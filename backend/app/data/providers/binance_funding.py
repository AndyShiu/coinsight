from __future__ import annotations

import hashlib
import hmac
import logging
import time
from typing import Optional

import httpx
import pandas as pd

from app.db.session import async_session
from app.services.settings_service import SettingsService

logger = logging.getLogger(__name__)

BINANCE_FAPI_URL = "https://fapi.binance.com"

_settings_svc = SettingsService(async_session)


class BinanceFundingProvider:
    """幣安合約 API — 資金費率

    無 API key 也可使用（公開端點），有 key 可提升 rate limit。
    """

    async def _get_headers(self) -> dict[str, str]:
        api_key = await _settings_svc.get_api_key("binance_api_key")
        if api_key:
            return {"X-MBX-APIKEY": api_key}
        return {}

    async def get_funding_rates(self, symbol: str = "BTC") -> pd.DataFrame:
        """取得幣安當前資金費率

        回傳 DataFrame 欄位: exchange, symbol, rate, predicted_rate
        """
        pair = f"{symbol.upper()}USDT"
        headers = await self._get_headers()
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                # 取得最新資金費率
                resp = await client.get(
                    f"{BINANCE_FAPI_URL}/fapi/v1/fundingRate",
                    params={"symbol": pair, "limit": 1},
                    headers=headers,
                )
                resp.raise_for_status()
                data = resp.json()

                # 取得 premiumIndex (包含預估下次費率)
                resp2 = await client.get(
                    f"{BINANCE_FAPI_URL}/fapi/v1/premiumIndex",
                    params={"symbol": pair},
                    headers=headers,
                )
                resp2.raise_for_status()
                premium = resp2.json()

            if not data:
                return pd.DataFrame(columns=["exchange", "symbol", "rate", "predicted_rate"])

            current_rate = float(data[-1].get("fundingRate", 0))
            predicted_rate = float(premium.get("lastFundingRate", current_rate))

            return pd.DataFrame([{
                "exchange": "Binance",
                "symbol": symbol.upper(),
                "rate": current_rate,
                "predicted_rate": predicted_rate,
            }])

        except Exception as e:
            logger.warning(f"Binance funding rate failed: {e}")
            return pd.DataFrame(columns=["exchange", "symbol", "rate", "predicted_rate"])

    async def get_multi_symbol_funding(self, symbols: Optional[list[str]] = None) -> pd.DataFrame:
        """取得多幣種資金費率"""
        if symbols is None:
            symbols = ["BTC", "ETH", "SOL", "BNB", "XRP"]

        rows = []
        headers = await self._get_headers()
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(
                    f"{BINANCE_FAPI_URL}/fapi/v1/premiumIndex",
                    headers=headers,
                )
                resp.raise_for_status()
                all_data = resp.json()

            target_pairs = {f"{s.upper()}USDT" for s in symbols}
            for item in all_data:
                pair = item.get("symbol", "")
                if pair in target_pairs:
                    sym = pair.replace("USDT", "")
                    rows.append({
                        "exchange": "Binance",
                        "symbol": sym,
                        "rate": float(item.get("lastFundingRate", 0)),
                        "predicted_rate": float(item.get("lastFundingRate", 0)),
                    })

        except Exception as e:
            logger.warning(f"Binance multi-symbol funding failed: {e}")

        return pd.DataFrame(rows) if rows else pd.DataFrame(
            columns=["exchange", "symbol", "rate", "predicted_rate"]
        )
