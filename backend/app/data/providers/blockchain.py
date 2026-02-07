from __future__ import annotations

from typing import Optional

import httpx
import pandas as pd

from app.data.base import OnchainDataProvider

BLOCKCHAIN_API_URL = "https://api.blockchain.info"


class BlockchainProvider(OnchainDataProvider):
    """Blockchain.com API — BTC 基本鏈上數據 (完全免費)"""

    async def _request(self, endpoint: str, params: Optional[dict] = None) -> dict:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{BLOCKCHAIN_API_URL}/{endpoint}",
                params=params or {},
                timeout=15.0,
            )
            resp.raise_for_status()
            return resp.json()

    async def _get_chart_data(self, chart_name: str, timespan: str = "1year") -> pd.DataFrame:
        """取得 Blockchain.com chart 數據"""
        data = await self._request(
            f"charts/{chart_name}",
            params={"timespan": timespan, "format": "json", "cors": "true"},
        )

        rows = []
        for entry in data.get("values", []):
            rows.append({
                "timestamp": pd.to_datetime(entry["x"], unit="s", utc=True),
                "value": float(entry["y"]),
            })

        df = pd.DataFrame(rows)
        if not df.empty:
            df = df.sort_values("timestamp").reset_index(drop=True)
        return df

    async def get_exchange_flow(
        self, asset: str = "BTC", direction: str = "netflow"
    ) -> pd.DataFrame:
        """Blockchain.com 不直接提供交易所流入流出，回傳空 DataFrame"""
        return pd.DataFrame(columns=["timestamp", "value"])

    async def get_mvrv(self, asset: str = "BTC") -> pd.DataFrame:
        """Blockchain.com 不直接提供 MVRV，回傳空 DataFrame"""
        return pd.DataFrame(columns=["timestamp", "mvrv"])

    async def get_nupl(self, asset: str = "BTC") -> pd.DataFrame:
        """Blockchain.com 不直接提供 NUPL，回傳空 DataFrame"""
        return pd.DataFrame(columns=["timestamp", "nupl"])

    async def get_hash_rate(self, timespan: str = "1year") -> pd.DataFrame:
        """取得 BTC 網路算力"""
        return await self._get_chart_data("hash-rate", timespan)

    async def get_active_addresses(self, timespan: str = "1year") -> pd.DataFrame:
        """取得每日活躍地址數"""
        return await self._get_chart_data("n-unique-addresses", timespan)

    async def get_transaction_count(self, timespan: str = "1year") -> pd.DataFrame:
        """取得每日交易筆數"""
        return await self._get_chart_data("n-transactions", timespan)

    async def get_mempool_size(self, timespan: str = "1year") -> pd.DataFrame:
        """取得記憶體池大小"""
        return await self._get_chart_data("mempool-size", timespan)

    async def get_difficulty(self, timespan: str = "1year") -> pd.DataFrame:
        """取得採礦難度"""
        return await self._get_chart_data("difficulty", timespan)

    async def get_stats(self) -> dict:
        """取得 BTC 網路即時統計"""
        return await self._request("stats")
