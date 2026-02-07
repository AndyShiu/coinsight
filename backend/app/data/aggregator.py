from __future__ import annotations
import logging

import pandas as pd

from app.data.base import MarketDataProvider

logger = logging.getLogger(__name__)


class DataAggregator:
    """數據聚合器 — 多來源整合、自動降級"""

    def __init__(
        self,
        providers: dict[str, MarketDataProvider],
        primary: str = "ccxt",
        fallback: str = "coingecko",
    ):
        self._providers = providers
        self._primary = primary
        self._fallback = fallback

    def _get_provider(self, name: str) -> MarketDataProvider:
        provider = self._providers.get(name)
        if provider is None:
            raise ValueError(f"Unknown provider: {name}")
        return provider

    async def get_ohlcv(
        self,
        symbol: str,
        timeframe: str = "1d",
        limit: int = 100,
        provider: str | None = None,
        since: int | None = None,
    ) -> pd.DataFrame:
        """取得 OHLCV 數據，支援自動降級"""
        if provider:
            return await self._get_provider(provider).get_ohlcv(symbol, timeframe, limit, since=since)

        try:
            return await self._get_provider(self._primary).get_ohlcv(symbol, timeframe, limit, since=since)
        except Exception as e:
            logger.warning(f"Primary provider ({self._primary}) failed: {e}, falling back")
            return await self._get_provider(self._fallback).get_ohlcv(symbol, timeframe, limit, since=since)

    async def get_current_price(
        self, symbols: list[str], provider: str | None = None
    ) -> dict[str, float]:
        if provider:
            return await self._get_provider(provider).get_current_price(symbols)

        try:
            return await self._get_provider(self._primary).get_current_price(symbols)
        except Exception as e:
            logger.warning(f"Primary provider ({self._primary}) failed: {e}, falling back")
            return await self._get_provider(self._fallback).get_current_price(symbols)

    async def get_market_overview(
        self, limit: int = 20, provider: str | None = None
    ) -> pd.DataFrame:
        target = provider or self._fallback  # 市場總覽預設用 CoinGecko (有 market_cap)
        return await self._get_provider(target).get_market_overview(limit)
