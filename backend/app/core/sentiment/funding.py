from __future__ import annotations

from dataclasses import dataclass

import pandas as pd


@dataclass
class FundingRateAnalysis:
    """資金費率分析結果"""

    symbol: str
    avg_rate: float
    max_rate: float
    min_rate: float
    signal: str  # "bullish" | "bearish" | "neutral"
    strength: float
    exchanges: pd.DataFrame


def analyze_funding_rates(df: pd.DataFrame, symbol: str = "BTC") -> FundingRateAnalysis:
    """分析資金費率

    策略邏輯：
    - 資金費率極高 (> 0.05%) → 多頭過熱，看空
    - 資金費率正常正值 (0~0.05%) → 溫和看多
    - 資金費率為負 (< 0%) → 空頭佔優，但可能是超賣反彈機會
    - 資金費率極低 (< -0.05%) → 空頭極端，看多（逆向）
    """
    if df.empty or "rate" not in df.columns:
        return FundingRateAnalysis(
            symbol=symbol,
            avg_rate=0.0,
            max_rate=0.0,
            min_rate=0.0,
            signal="neutral",
            strength=0.0,
            exchanges=df,
        )

    avg_rate = float(df["rate"].mean())
    max_rate = float(df["rate"].max())
    min_rate = float(df["rate"].min())

    # 以百分比為單位分析
    rate_pct = avg_rate * 100

    if rate_pct > 0.05:
        signal, strength = "bearish", min(rate_pct / 0.1, 1.0) * 0.6 + 0.2
    elif rate_pct > 0:
        signal, strength = "neutral", 0.0
    elif rate_pct > -0.05:
        signal, strength = "neutral", 0.0
    else:
        signal, strength = "bullish", min(abs(rate_pct) / 0.1, 1.0) * 0.6 + 0.2

    return FundingRateAnalysis(
        symbol=symbol,
        avg_rate=round(avg_rate, 6),
        max_rate=round(max_rate, 6),
        min_rate=round(min_rate, 6),
        signal=signal,
        strength=round(strength, 4),
        exchanges=df,
    )
