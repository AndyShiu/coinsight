from __future__ import annotations

from typing import Dict, List, Optional

from pydantic import BaseModel


class IndicatorSignal(BaseModel):
    name: str
    signal: str  # "bullish" | "bearish" | "neutral"
    strength: float
    latest_values: Dict[str, Optional[float]]
    metadata: dict


class TechnicalAnalysisResponse(BaseModel):
    symbol: str
    timeframe: str
    indicators: List[IndicatorSignal]
    overall_signal: str  # "bullish" | "bearish" | "neutral"
    overall_score: float  # -1.0 (極度看空) ~ +1.0 (極度看多)


class SingleIndicatorResponse(BaseModel):
    symbol: str
    timeframe: str
    indicator: IndicatorSignal


# --- 指標時間序列 (圖表覆蓋用) ---


class TimeSeriesPoint(BaseModel):
    time: int
    value: Optional[float]


class IndicatorSeriesData(BaseModel):
    name: str
    lines: Dict[str, List[TimeSeriesPoint]]


class IndicatorSeriesResponse(BaseModel):
    symbol: str
    timeframe: str
    indicator: IndicatorSeriesData


class SupportResistanceLevel(BaseModel):
    price: float
    label: str


class SupportResistanceResponse(BaseModel):
    symbol: str
    timeframe: str
    levels: List[SupportResistanceLevel]
