from __future__ import annotations

from typing import Optional

import httpx
import pandas as pd

from app.db.session import async_session
from app.services.settings_service import SettingsService

COINGLASS_BASE_URL = "https://open-api.coinglass.com/public/v2"

_settings_svc = SettingsService(async_session)


class CoinGlassProvider:
    """CoinGlass 資金費率、清算數據提供者

    免費端點不需 API key，進階端點需要。
    """

    async def _get_headers(self) -> dict[str, str]:
        api_key = await _settings_svc.get_api_key("coinglass_api_key")
        if api_key:
            return {"coinglassSecret": api_key}
        return {}

    async def _request(self, endpoint: str, params: Optional[dict] = None) -> dict:
        headers = await self._get_headers()
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{COINGLASS_BASE_URL}{endpoint}",
                params=params or {},
                headers=headers,
                timeout=15.0,
            )
            resp.raise_for_status()
            return resp.json()

    async def get_funding_rates(self, symbol: str = "BTC") -> pd.DataFrame:
        """取得各交易所資金費率"""
        try:
            data = await self._request("/funding", params={"symbol": symbol.upper()})
        except Exception:
            return pd.DataFrame(columns=["exchange", "symbol", "rate", "predicted_rate"])

        rows = []
        for item in data.get("data", []):
            rows.append({
                "exchange": item.get("exchangeName", "unknown"),
                "symbol": symbol.upper(),
                "rate": float(item.get("rate", 0)),
                "predicted_rate": float(item.get("predictedRate", 0)),
            })

        return pd.DataFrame(rows)

    async def get_liquidation_data(self, symbol: str = "BTC", timeframe: str = "24h") -> dict:
        """取得清算數據摘要"""
        try:
            data = await self._request(
                "/liquidation_history",
                params={"symbol": symbol.upper(), "time_type": timeframe},
            )
            return data.get("data", {})
        except Exception:
            return {}
