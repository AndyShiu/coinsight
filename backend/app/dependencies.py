from __future__ import annotations

from app.data.aggregator import DataAggregator
from app.data.providers.ccxt_provider import CCXTProvider
from app.data.providers.coingecko import CoinGeckoProvider
from app.services.market_service import MarketService
from app.services.technical_service import TechnicalService

_aggregator = None


def get_aggregator() -> DataAggregator:
    global _aggregator
    if _aggregator is None:
        providers = {
            "ccxt": CCXTProvider(),
            "coingecko": CoinGeckoProvider(),
        }
        _aggregator = DataAggregator(providers, primary="ccxt", fallback="coingecko")
    return _aggregator


def reset_aggregator() -> None:
    """重置 aggregator（用於測試或 event loop 切換時）"""
    global _aggregator
    _aggregator = None


def get_market_service() -> MarketService:
    return MarketService(get_aggregator())


def get_technical_service() -> TechnicalService:
    return TechnicalService(get_aggregator())
