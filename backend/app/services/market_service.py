from __future__ import annotations
import pandas as pd

from app.data.aggregator import DataAggregator
from app.data.cache import cache


class MarketService:
    """市場數據服務"""

    def __init__(self, aggregator: DataAggregator):
        self._aggregator = aggregator

    async def get_prices(self, symbols: list[str]) -> dict[str, float]:
        cache_key = f"prices:{'_'.join(sorted(symbols))}"
        cached = await cache.get(cache_key)
        if cached is not None:
            return cached

        prices = await self._aggregator.get_current_price(symbols)
        await cache.set(cache_key, prices, ttl=60)
        return prices

    async def get_market_overview(self, limit: int = 20) -> pd.DataFrame:
        cache_key = f"market_overview:{limit}"
        cached = await cache.get(cache_key)
        if cached is not None:
            return cached

        df = await self._aggregator.get_market_overview(limit)
        await cache.set(cache_key, df, ttl=120)
        return df

    async def search_coins(self, query: str, limit: int = 20) -> list[dict]:
        cache_key = f"search_coins:{query.lower()}:{limit}"
        cached = await cache.get(cache_key)
        if cached is not None:
            return cached

        provider = self._aggregator._providers.get("coingecko")
        if provider is None:
            return []
        results = await provider.search_coins(query, limit)
        await cache.set(cache_key, results, ttl=300)
        return results
