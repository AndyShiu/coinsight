from __future__ import annotations

from typing import Optional

import httpx
import pandas as pd

from app.db.session import async_session
from app.services.settings_service import SettingsService

GLASSNODE_BASE_URL = "https://api.glassnode.com/v1/metrics"

_settings_svc = SettingsService(async_session)


class GlassnodeProvider:
    """Glassnode 鏈上數據提供者

    免費版 (Tier 1): 僅日級數據、延遲一天
    付費版 ($29+/月): 即時數據、更多指標
    """

    async def _get_api_key(self) -> Optional[str]:
        return await _settings_svc.get_api_key("glassnode_api_key")

    async def _request(self, endpoint: str, params: Optional[dict] = None) -> list:
        api_key = await self._get_api_key()
        if not api_key:
            raise ValueError("Glassnode API key required. 請在設定頁面填入 API key。")

        request_params = {"a": "BTC", "api_key": api_key}
        if params:
            request_params.update(params)

        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{GLASSNODE_BASE_URL}/{endpoint}",
                params=request_params,
                timeout=30.0,
            )
            resp.raise_for_status()
            return resp.json()

    async def get_exchange_flow(
        self, asset: str = "BTC", direction: str = "netflow"
    ) -> pd.DataFrame:
        """取得交易所淨流入/流出"""
        endpoint_map = {
            "netflow": "transactions/transfers_volume_exchanges_net",
            "inflow": "transactions/transfers_volume_to_exchanges_sum",
            "outflow": "transactions/transfers_volume_from_exchanges_sum",
        }
        endpoint = endpoint_map.get(direction, endpoint_map["netflow"])

        data = await self._request(endpoint, {"a": asset.upper(), "i": "24h"})

        rows = []
        for entry in data:
            rows.append({
                "timestamp": pd.to_datetime(entry["t"], unit="s", utc=True),
                "value": float(entry.get("v", 0)),
            })

        df = pd.DataFrame(rows)
        if not df.empty:
            df = df.sort_values("timestamp").reset_index(drop=True)
        return df

    async def get_mvrv(self, asset: str = "BTC") -> pd.DataFrame:
        """取得 MVRV 比率 (Market Value to Realized Value)"""
        data = await self._request("market/mvrv", {"a": asset.upper(), "i": "24h"})

        rows = []
        for entry in data:
            rows.append({
                "timestamp": pd.to_datetime(entry["t"], unit="s", utc=True),
                "mvrv": float(entry.get("v", 0)),
            })

        df = pd.DataFrame(rows)
        if not df.empty:
            df = df.sort_values("timestamp").reset_index(drop=True)
        return df

    async def get_nupl(self, asset: str = "BTC") -> pd.DataFrame:
        """取得 NUPL (Net Unrealized Profit/Loss)"""
        data = await self._request(
            "market/net_unrealized_profit_loss", {"a": asset.upper(), "i": "24h"}
        )

        rows = []
        for entry in data:
            rows.append({
                "timestamp": pd.to_datetime(entry["t"], unit="s", utc=True),
                "nupl": float(entry.get("v", 0)),
            })

        df = pd.DataFrame(rows)
        if not df.empty:
            df = df.sort_values("timestamp").reset_index(drop=True)
        return df
