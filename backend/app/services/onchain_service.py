from __future__ import annotations

from app.core.onchain.exchange_flow import ExchangeFlowAnalysis, analyze_exchange_flow
from app.core.onchain.valuation import (
    MVRVAnalysis,
    NUPLAnalysis,
    analyze_mvrv,
    analyze_nupl,
)
from app.data.cache import cache
from app.data.providers.blockchain import BlockchainProvider
from app.data.providers.glassnode import GlassnodeProvider


class OnchainService:
    """鏈上數據分析服務"""

    def __init__(self):
        self._glassnode = GlassnodeProvider()
        self._blockchain = BlockchainProvider()

    async def get_exchange_flow(self, asset: str = "BTC") -> ExchangeFlowAnalysis:
        cache_key = f"exchange_flow:{asset}"
        cached = await cache.get(cache_key)
        if cached is not None:
            return cached

        try:
            df = await self._glassnode.get_exchange_flow(asset)
        except ValueError:
            # 沒有 Glassnode API key，回傳空結果
            import pandas as pd
            df = pd.DataFrame(columns=["timestamp", "value"])

        result = analyze_exchange_flow(df, asset)
        await cache.set(cache_key, result, ttl=3600)
        return result

    async def get_mvrv(self, asset: str = "BTC") -> MVRVAnalysis:
        cache_key = f"mvrv:{asset}"
        cached = await cache.get(cache_key)
        if cached is not None:
            return cached

        try:
            df = await self._glassnode.get_mvrv(asset)
        except ValueError:
            import pandas as pd
            df = pd.DataFrame(columns=["timestamp", "mvrv"])

        result = analyze_mvrv(df, asset)
        await cache.set(cache_key, result, ttl=3600)
        return result

    async def get_nupl(self, asset: str = "BTC") -> NUPLAnalysis:
        cache_key = f"nupl:{asset}"
        cached = await cache.get(cache_key)
        if cached is not None:
            return cached

        try:
            df = await self._glassnode.get_nupl(asset)
        except ValueError:
            import pandas as pd
            df = pd.DataFrame(columns=["timestamp", "nupl"])

        result = analyze_nupl(df, asset)
        await cache.set(cache_key, result, ttl=3600)
        return result

    async def get_btc_network_stats(self) -> dict:
        cache_key = "btc_network_stats"
        cached = await cache.get(cache_key)
        if cached is not None:
            return cached

        try:
            stats = await self._blockchain.get_stats()
            result = {
                "hash_rate": stats.get("hash_rate"),
                "difficulty": stats.get("difficulty"),
                "transaction_count": stats.get("n_tx"),
                "mempool_size": stats.get("n_blocks_total"),
            }
        except Exception:
            result = {}

        await cache.set(cache_key, result, ttl=3600)
        return result
