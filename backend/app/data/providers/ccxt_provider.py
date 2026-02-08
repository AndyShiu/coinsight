from __future__ import annotations
import asyncio
import logging
from datetime import datetime, timezone

import ccxt.async_support as ccxt
import pandas as pd

from app.data.base import MarketDataProvider

logger = logging.getLogger(__name__)


class CCXTProvider(MarketDataProvider):
    """透過 ccxt 從交易所取得市場數據"""

    def __init__(self, exchange_id: str = "binance"):
        self._exchange_id = exchange_id
        self._exchange: ccxt.Exchange | None = None
        self._pair_cache: dict[str, str] = {}  # symbol -> resolved pair

    async def _get_exchange(self) -> ccxt.Exchange:
        # 每次請求都建立新 exchange 實例，避免 event loop 問題
        if self._exchange is not None:
            try:
                # 測試 exchange 是否仍然可用
                loop = asyncio.get_event_loop()
                if loop.is_closed():
                    self._exchange = None
            except RuntimeError:
                self._exchange = None

        if self._exchange is None:
            exchange_class = getattr(ccxt, self._exchange_id)
            self._exchange = exchange_class({"enableRateLimit": True})
        return self._exchange

    async def _resolve_pair(self, symbol: str) -> str:
        """解析交易對：先嘗試 SYMBOL/USDT，找不到則搜尋包含該 symbol 的現貨 USDT 對。"""
        upper = symbol.upper()
        if upper in self._pair_cache:
            return self._pair_cache[upper]

        exchange = await self._get_exchange()
        direct = f"{upper}/USDT"

        # 確保 markets 已載入
        if not exchange.markets:
            await exchange.load_markets()

        # 直接匹配
        if direct in exchange.symbols:
            self._pair_cache[upper] = direct
            return direct

        # 模糊搜尋：找包含該 symbol 關鍵字的現貨 USDT 對
        candidates = [
            s for s in exchange.symbols
            if upper in s.upper() and s.endswith("/USDT") and ":" not in s
        ]
        if candidates:
            # 優先選最短的（最精確匹配）
            best = min(candidates, key=len)
            logger.info(f"Resolved {upper} -> {best}")
            self._pair_cache[upper] = best
            return best

        # 找不到，回傳原始 pair（讓後續報錯）
        self._pair_cache[upper] = direct
        return direct

    async def close(self) -> None:
        if self._exchange is not None:
            await self._exchange.close()
            self._exchange = None

    async def get_ohlcv(
        self, symbol: str, timeframe: str = "1d", limit: int = 100,
        since: int | None = None,
    ) -> pd.DataFrame:
        exchange = await self._get_exchange()
        pair = await self._resolve_pair(symbol)
        ohlcv = await exchange.fetch_ohlcv(pair, timeframe=timeframe, since=since, limit=limit)

        df = pd.DataFrame(ohlcv, columns=["timestamp", "open", "high", "low", "close", "volume"])
        df["timestamp"] = pd.to_datetime(df["timestamp"], unit="ms", utc=True)
        df = df.set_index("timestamp")
        return df

    async def get_current_price(self, symbols: list[str]) -> dict[str, float]:
        exchange = await self._get_exchange()
        prices: dict[str, float] = {}

        for symbol in symbols:
            try:
                pair = await self._resolve_pair(symbol)
                ticker = await exchange.fetch_ticker(pair)
                prices[symbol.upper()] = ticker["last"]
            except Exception:
                continue

        return prices

    async def get_market_overview(self, limit: int = 20) -> pd.DataFrame:
        exchange = await self._get_exchange()
        tickers = await exchange.fetch_tickers()

        rows = []
        for pair, ticker in tickers.items():
            if not pair.endswith("/USDT"):
                continue
            symbol = pair.replace("/USDT", "")
            rows.append({
                "symbol": symbol,
                "name": symbol,
                "price": ticker.get("last", 0),
                "volume_24h": ticker.get("quoteVolume", 0),
                "change_24h": ticker.get("percentage", 0),
            })

        df = pd.DataFrame(rows)
        if not df.empty:
            df = df.sort_values("volume_24h", ascending=False).head(limit).reset_index(drop=True)
        return df
