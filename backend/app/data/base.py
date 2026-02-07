from __future__ import annotations
from abc import ABC, abstractmethod

import pandas as pd


class MarketDataProvider(ABC):
    """市場數據提供者基底類別"""

    @abstractmethod
    async def get_ohlcv(
        self, symbol: str, timeframe: str = "1d", limit: int = 100,
        since: int | None = None,
    ) -> pd.DataFrame:
        """取得 OHLCV K 線數據

        Args:
            since: 起始時間 (unix ms)，None 表示取最新的 limit 筆

        回傳 DataFrame 包含欄位: timestamp, open, high, low, close, volume
        """
        ...

    @abstractmethod
    async def get_current_price(self, symbols: list[str]) -> dict[str, float]:
        """取得即時價格"""
        ...

    @abstractmethod
    async def get_market_overview(self, limit: int = 20) -> pd.DataFrame:
        """取得市場總覽（市值排名前 N 的幣種）

        回傳 DataFrame 包含: symbol, name, price, market_cap, volume_24h, change_24h
        """
        ...


class OnchainDataProvider(ABC):
    """鏈上數據提供者基底類別"""

    @abstractmethod
    async def get_exchange_flow(
        self, asset: str, direction: str = "netflow"
    ) -> pd.DataFrame:
        """取得交易所流入/流出數據"""
        ...

    @abstractmethod
    async def get_mvrv(self, asset: str) -> pd.DataFrame:
        """取得 MVRV 比率"""
        ...

    @abstractmethod
    async def get_nupl(self, asset: str) -> pd.DataFrame:
        """取得 NUPL (未實現淨利潤/損失)"""
        ...


class SentimentDataProvider(ABC):
    """市場情緒數據提供者基底類別"""

    @abstractmethod
    async def get_fear_greed_index(self, limit: int = 30) -> pd.DataFrame:
        """取得恐懼貪婪指數"""
        ...
