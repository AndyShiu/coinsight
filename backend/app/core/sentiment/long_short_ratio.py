from __future__ import annotations

import math
from dataclasses import dataclass

import pandas as pd


@dataclass
class LongShortRatioAnalysis:
    """多空比分析結果"""

    symbol: str
    current_ratio: float
    long_pct: float
    short_pct: float
    avg_ratio: float
    signal: str
    strength: float
    continuous_score: float
    trend: str
    history: pd.DataFrame


def _ls_continuous(ratio: float) -> float:
    """多空比 → 連續分數 (-1.0 ~ +1.0) — 逆向指標
    ratio=1.0 → 0.0, ratio>1.5 → 趨近 -1.0, ratio<0.67 → 趨近 +1.0
    0.8~1.2 為弱訊號區
    """
    if ratio >= 1.0:
        raw = -math.tanh((ratio - 1.0) / 0.8)
    else:
        raw = math.tanh((1.0 - ratio) / 0.5)
    # 0.8~1.2 弱訊號區壓縮
    if 0.8 <= ratio <= 1.2:
        raw *= 0.3
    return max(min(raw, 1.0), -1.0)


def analyze_long_short_ratio(
    df: pd.DataFrame, symbol: str = "BTC"
) -> LongShortRatioAnalysis:
    """分析多空比（逆向指標）

    策略邏輯：
    - Ratio > 1.5 → 多頭擁擠，逆向看空
    - Ratio > 1.2 → 偏多，輕微逆向看空
    - 0.8 ~ 1.2 → 均衡，中性
    - Ratio < 0.8 → 偏空，逆向看多
    - Ratio < 0.67 → 空頭擁擠，強烈逆向看多
    """
    if df.empty or "long_short_ratio" not in df.columns:
        return LongShortRatioAnalysis(
            symbol=symbol, current_ratio=1.0, long_pct=0.5,
            short_pct=0.5, avg_ratio=1.0, signal="neutral",
            strength=0, continuous_score=0.0, trend="balanced", history=df,
        )

    current = float(df.iloc[-1]["long_short_ratio"])
    long_pct = float(df.iloc[-1]["long_account"])
    short_pct = float(df.iloc[-1]["short_account"])
    avg_ratio = float(df["long_short_ratio"].mean())

    # 趨勢
    if current > 1.2:
        trend = "more_longs"
    elif current < 0.8:
        trend = "more_shorts"
    else:
        trend = "balanced"

    # 逆向訊號
    if current > 1.5:
        signal = "bearish"
        strength = min((current - 1.5) / 1.0, 1.0) * 0.5 + 0.4
    elif current > 1.2:
        signal = "bearish"
        strength = (current - 1.2) / 0.3 * 0.3
    elif current > 0.8:
        signal, strength = "neutral", 0.0
    elif current > 0.67:
        signal = "bullish"
        strength = (0.8 - current) / 0.13 * 0.3
    else:
        signal = "bullish"
        strength = min((0.67 - current) / 0.3, 1.0) * 0.5 + 0.4

    return LongShortRatioAnalysis(
        symbol=symbol,
        current_ratio=round(current, 4),
        long_pct=round(long_pct, 4),
        short_pct=round(short_pct, 4),
        avg_ratio=round(avg_ratio, 4),
        signal=signal,
        strength=round(strength, 4),
        continuous_score=round(_ls_continuous(current), 4),
        trend=trend,
        history=df,
    )
