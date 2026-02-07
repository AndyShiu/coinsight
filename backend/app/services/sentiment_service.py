from __future__ import annotations

import logging

from app.core.sentiment.fear_greed import FearGreedAnalysis, analyze_fear_greed
from app.core.sentiment.funding import FundingRateAnalysis, analyze_funding_rates
from app.core.sentiment.open_interest import OpenInterestAnalysis, analyze_open_interest
from app.core.sentiment.long_short_ratio import LongShortRatioAnalysis, analyze_long_short_ratio
from app.core.sentiment.taker_volume import TakerVolumeAnalysis, analyze_taker_volume
from app.data.cache import cache
from app.data.providers.alternative import AlternativeMeProvider
from app.data.providers.binance_derivatives import BinanceDerivativesProvider
from app.data.providers.multi_exchange_funding import fetch_all_funding_rates

logger = logging.getLogger(__name__)


class SentimentService:
    """市場情緒分析服務"""

    def __init__(self):
        self._fear_greed_provider = AlternativeMeProvider()
        self._derivatives_provider = BinanceDerivativesProvider()

    async def get_fear_greed(self, limit: int = 30) -> FearGreedAnalysis:
        cache_key = f"fear_greed:{limit}"
        cached = await cache.get(cache_key)
        if cached is not None:
            return cached

        df = await self._fear_greed_provider.get_fear_greed_index(limit)
        result = analyze_fear_greed(df)
        await cache.set(cache_key, result, ttl=3600)  # 快取 1 小時
        return result

    async def get_funding_rates(self, symbol: str = "BTC") -> FundingRateAnalysis:
        cache_key = f"funding:{symbol}"
        cached = await cache.get(cache_key)
        if cached is not None:
            return cached

        # 並行取得多交易所資金費率 (Binance, OKX, Bybit, Bitget, Gate.io)
        df = await fetch_all_funding_rates(symbol)

        result = analyze_funding_rates(df, symbol)
        await cache.set(cache_key, result, ttl=300)
        return result

    async def get_open_interest(
        self, symbol: str = "BTC", period: str = "1h", limit: int = 30
    ) -> OpenInterestAnalysis:
        cache_key = f"open_interest:{symbol}:{period}"
        cached = await cache.get(cache_key)
        if cached is not None:
            return cached

        df = await self._derivatives_provider.get_open_interest(symbol, period, limit)
        result = analyze_open_interest(df, symbol)
        await cache.set(cache_key, result, ttl=300)
        return result

    async def get_long_short_ratio(
        self, symbol: str = "BTC", period: str = "1h", limit: int = 30
    ) -> LongShortRatioAnalysis:
        cache_key = f"long_short_ratio:{symbol}:{period}"
        cached = await cache.get(cache_key)
        if cached is not None:
            return cached

        df = await self._derivatives_provider.get_long_short_ratio(symbol, period, limit)
        result = analyze_long_short_ratio(df, symbol)
        await cache.set(cache_key, result, ttl=300)
        return result

    async def get_taker_volume(
        self, symbol: str = "BTC", period: str = "1h", limit: int = 30
    ) -> TakerVolumeAnalysis:
        cache_key = f"taker_volume:{symbol}:{period}"
        cached = await cache.get(cache_key)
        if cached is not None:
            return cached

        df = await self._derivatives_provider.get_taker_buy_sell(symbol, period, limit)
        result = analyze_taker_volume(df, symbol)
        await cache.set(cache_key, result, ttl=300)
        return result
