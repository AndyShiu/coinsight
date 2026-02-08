from __future__ import annotations

import logging
from typing import Optional

import httpx
import pandas as pd

from app.data.providers.binance_pair_resolver import resolve_futures_pair
from app.db.session import async_session
from app.services.settings_service import SettingsService

logger = logging.getLogger(__name__)

BINANCE_FAPI_URL = "https://fapi.binance.com"

_settings_svc = SettingsService(async_session)


class BinanceDerivativesProvider:
    """幣安合約 API — 未平倉合約、多空比、主動買賣量

    所有端點皆為免費公開，無需 API key。有 key 可提升 rate limit。
    """

    async def _get_headers(self) -> dict:
        api_key = await _settings_svc.get_api_key("binance_api_key")
        if api_key:
            return {"X-MBX-APIKEY": api_key}
        return {}

    async def get_open_interest(
        self, symbol: str = "BTC", period: str = "1h", limit: int = 30
    ) -> pd.DataFrame:
        """取得未平倉合約歷史數據

        回傳 DataFrame 欄位: timestamp, open_interest, open_interest_value
        """
        pair = await resolve_futures_pair(symbol)
        headers = await self._get_headers()
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(
                    f"{BINANCE_FAPI_URL}/futures/data/openInterestHist",
                    params={"symbol": pair, "period": period, "limit": limit},
                    headers=headers,
                )
                resp.raise_for_status()
                data = resp.json()

            rows = []
            for item in data:
                rows.append({
                    "timestamp": int(item["timestamp"]) // 1000,
                    "open_interest": float(item["sumOpenInterest"]),
                    "open_interest_value": float(item["sumOpenInterestValue"]),
                })

            if not rows:
                return pd.DataFrame(columns=["timestamp", "open_interest", "open_interest_value"])

            return pd.DataFrame(rows)

        except Exception as e:
            logger.warning("Binance open interest failed: %s", e)
            return pd.DataFrame(columns=["timestamp", "open_interest", "open_interest_value"])

    async def get_long_short_ratio(
        self, symbol: str = "BTC", period: str = "1h", limit: int = 30
    ) -> pd.DataFrame:
        """取得多空比（頂級交易者帳戶比例）

        回傳 DataFrame 欄位: timestamp, long_short_ratio, long_account, short_account
        """
        pair = await resolve_futures_pair(symbol)
        headers = await self._get_headers()
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(
                    f"{BINANCE_FAPI_URL}/futures/data/topLongShortAccountRatio",
                    params={"symbol": pair, "period": period, "limit": limit},
                    headers=headers,
                )
                resp.raise_for_status()
                data = resp.json()

            rows = []
            for item in data:
                rows.append({
                    "timestamp": int(item["timestamp"]) // 1000,
                    "long_short_ratio": float(item["longShortRatio"]),
                    "long_account": float(item["longAccount"]),
                    "short_account": float(item["shortAccount"]),
                })

            if not rows:
                return pd.DataFrame(
                    columns=["timestamp", "long_short_ratio", "long_account", "short_account"]
                )

            return pd.DataFrame(rows)

        except Exception as e:
            logger.warning("Binance long/short ratio failed: %s", e)
            return pd.DataFrame(
                columns=["timestamp", "long_short_ratio", "long_account", "short_account"]
            )

    async def get_taker_buy_sell(
        self, symbol: str = "BTC", period: str = "1h", limit: int = 30
    ) -> pd.DataFrame:
        """取得主動買賣量比

        回傳 DataFrame 欄位: timestamp, buy_sell_ratio, buy_vol, sell_vol
        """
        pair = await resolve_futures_pair(symbol)
        headers = await self._get_headers()
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(
                    f"{BINANCE_FAPI_URL}/futures/data/takerlongshortRatio",
                    params={"symbol": pair, "period": period, "limit": limit},
                    headers=headers,
                )
                resp.raise_for_status()
                data = resp.json()

            rows = []
            for item in data:
                rows.append({
                    "timestamp": int(item["timestamp"]) // 1000,
                    "buy_sell_ratio": float(item["buySellRatio"]),
                    "buy_vol": float(item["buyVol"]),
                    "sell_vol": float(item["sellVol"]),
                })

            if not rows:
                return pd.DataFrame(columns=["timestamp", "buy_sell_ratio", "buy_vol", "sell_vol"])

            return pd.DataFrame(rows)

        except Exception as e:
            logger.warning("Binance taker buy/sell failed: %s", e)
            return pd.DataFrame(columns=["timestamp", "buy_sell_ratio", "buy_vol", "sell_vol"])
