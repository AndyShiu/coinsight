from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel


class PriceResponse(BaseModel):
    symbol: str
    price: float


class MarketCoinResponse(BaseModel):
    symbol: str
    name: str
    price: float
    market_cap: Optional[float] = None
    volume_24h: Optional[float] = None
    change_24h: Optional[float] = None
    image: Optional[str] = None


class OhlcvEntry(BaseModel):
    time: int
    open: float
    high: float
    low: float
    close: float
    volume: float


class MarketOverviewResponse(BaseModel):
    coins: List[MarketCoinResponse]


class CoinSearchResult(BaseModel):
    symbol: str
    name: str
    market_cap_rank: Optional[int] = None
    thumb: Optional[str] = None
