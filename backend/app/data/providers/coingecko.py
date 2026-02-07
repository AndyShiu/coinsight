from __future__ import annotations
from typing import Optional

import httpx
import pandas as pd

from app.db.session import async_session
from app.services.settings_service import SettingsService

COINGECKO_BASE_URL = "https://api.coingecko.com/api/v3"
COINGECKO_PRO_URL = "https://pro-api.coingecko.com/api/v3"

_settings_svc = SettingsService(async_session)

# CoinGecko 常用幣種 ID 映射
SYMBOL_TO_ID: dict[str, str] = {
    "BTC": "bitcoin",
    "ETH": "ethereum",
    "BNB": "binancecoin",
    "SOL": "solana",
    "XRP": "ripple",
    "ADA": "cardano",
    "DOGE": "dogecoin",
    "DOT": "polkadot",
    "AVAX": "avalanche-2",
    "MATIC": "matic-network",
    "LINK": "chainlink",
    "UNI": "uniswap",
    "ATOM": "cosmos",
    "LTC": "litecoin",
    "FIL": "filecoin",
}


class CoinGeckoProvider:
    """透過 CoinGecko API 取得市場數據"""

    def _get_coin_id(self, symbol: str) -> str:
        return SYMBOL_TO_ID.get(symbol.upper(), symbol.lower())

    async def _get_api_config(self) -> tuple[str, dict[str, str]]:
        """動態取得 API URL 和 headers（支援 DB 儲存的 key）。"""
        api_key = await _settings_svc.get_api_key("coingecko_api_key")
        if api_key:
            return COINGECKO_PRO_URL, {"x-cg-pro-api-key": api_key}
        return COINGECKO_BASE_URL, {}

    async def _request(self, endpoint: str, params: Optional[dict] = None) -> dict | list:
        base_url, headers = await self._get_api_config()
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{base_url}{endpoint}",
                params=params or {},
                headers=headers,
                timeout=30.0,
            )
            resp.raise_for_status()
            return resp.json()

    async def get_ohlcv(
        self, symbol: str, timeframe: str = "1d", limit: int = 100,
        since: int | None = None,
    ) -> pd.DataFrame:
        coin_id = self._get_coin_id(symbol)

        # CoinGecko OHLC 只接受: 1, 7, 14, 30, 90, 180, 365, max
        valid_days = [1, 7, 14, 30, 90, 180, 365]
        days_map = {
            "15m": 1, "30m": 1,
            "1h": 1, "2h": 7, "4h": 7, "12h": 30,
            "1d": 90, "3d": 180, "1w": 365,
        }
        target = days_map.get(timeframe, 90)
        days = next((d for d in valid_days if d >= target), 365)

        data = await self._request(
            f"/coins/{coin_id}/ohlc",
            params={"vs_currency": "usd", "days": str(days)},
        )

        df = pd.DataFrame(data, columns=["timestamp", "open", "high", "low", "close"])
        df["timestamp"] = pd.to_datetime(df["timestamp"], unit="ms", utc=True)
        df["volume"] = 0.0  # CoinGecko OHLC 不提供成交量
        df = df.set_index("timestamp")
        return df.tail(limit)

    async def get_current_price(self, symbols: list[str]) -> dict[str, float]:
        ids = [self._get_coin_id(s) for s in symbols]
        data = await self._request(
            "/simple/price",
            params={"ids": ",".join(ids), "vs_currencies": "usd"},
        )

        id_to_symbol = {self._get_coin_id(s): s.upper() for s in symbols}
        prices: dict[str, float] = {}
        for coin_id, price_data in data.items():
            symbol = id_to_symbol.get(coin_id, coin_id.upper())
            prices[symbol] = price_data.get("usd", 0)

        return prices

    async def search_coins(self, query: str, limit: int = 20) -> list[dict]:
        """使用 CoinGecko /search API 搜尋幣種"""
        data = await self._request("/search", params={"query": query})
        coins = data.get("coins", [])
        results = []
        for coin in coins[:limit]:
            results.append({
                "symbol": coin.get("symbol", "").upper(),
                "name": coin.get("name", ""),
                "market_cap_rank": coin.get("market_cap_rank"),
                "thumb": coin.get("thumb"),
            })
        return results

    async def get_market_overview(self, limit: int = 20) -> pd.DataFrame:
        data = await self._request(
            "/coins/markets",
            params={
                "vs_currency": "usd",
                "order": "market_cap_desc",
                "per_page": str(limit),
                "page": "1",
                "sparkline": "false",
            },
        )

        rows = []
        for coin in data:
            rows.append({
                "symbol": coin["symbol"].upper(),
                "name": coin["name"],
                "price": coin.get("current_price", 0),
                "market_cap": coin.get("market_cap", 0),
                "volume_24h": coin.get("total_volume", 0),
                "change_24h": coin.get("price_change_percentage_24h", 0),
                "image": coin.get("image"),
            })

        return pd.DataFrame(rows)
