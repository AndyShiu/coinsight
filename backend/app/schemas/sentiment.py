from __future__ import annotations

from typing import Dict, List, Optional

from pydantic import BaseModel


class FearGreedEntry(BaseModel):
    timestamp: str
    value: int
    classification: str


class FearGreedResponse(BaseModel):
    current_value: int
    current_class: str
    signal: str
    strength: float
    trend: str
    avg_7d: float
    avg_30d: float
    history: List[FearGreedEntry]


class FundingRateEntry(BaseModel):
    exchange: str
    symbol: str
    rate: float
    predicted_rate: Optional[float] = None


class FundingRateResponse(BaseModel):
    symbol: str
    avg_rate: float
    max_rate: float
    min_rate: float
    signal: str
    strength: float
    exchanges: List[FundingRateEntry]


# ── Open Interest ─────────────────────────────────────────────


class OpenInterestEntry(BaseModel):
    timestamp: int
    open_interest: float
    open_interest_value: float


class OpenInterestResponse(BaseModel):
    symbol: str
    current_oi: float
    current_oi_value: float
    change_pct: float
    signal: str
    strength: float
    trend: str
    history: List[OpenInterestEntry]


# ── Long/Short Ratio ─────────────────────────────────────────


class LongShortRatioEntry(BaseModel):
    timestamp: int
    long_short_ratio: float
    long_account: float
    short_account: float


class LongShortRatioResponse(BaseModel):
    symbol: str
    current_ratio: float
    long_pct: float
    short_pct: float
    avg_ratio: float
    signal: str
    strength: float
    trend: str
    history: List[LongShortRatioEntry]


# ── Taker Buy/Sell Volume ────────────────────────────────────


class TakerVolumeEntry(BaseModel):
    timestamp: int
    buy_sell_ratio: float
    buy_vol: float
    sell_vol: float


class TakerVolumeResponse(BaseModel):
    symbol: str
    current_ratio: float
    buy_vol: float
    sell_vol: float
    avg_ratio: float
    signal: str
    strength: float
    pressure: str
    history: List[TakerVolumeEntry]
