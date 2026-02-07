from __future__ import annotations

from dataclasses import dataclass

import pandas as pd


@dataclass
class FearGreedAnalysis:
    """恐懼貪婪指數分析結果"""

    current_value: int
    current_class: str
    signal: str  # "bullish" | "bearish" | "neutral"
    strength: float
    trend: str  # "improving" | "worsening" | "stable"
    avg_7d: float
    avg_30d: float
    history: pd.DataFrame


def analyze_fear_greed(df: pd.DataFrame) -> FearGreedAnalysis:
    """分析恐懼貪婪指數

    策略邏輯（逆向操作）：
    - 極度恐懼 (0-25)  → 看多訊號（別人恐懼我貪婪）
    - 恐懼 (25-45)     → 偏多
    - 中性 (45-55)     → 中性
    - 貪婪 (55-75)     → 偏空
    - 極度貪婪 (75-100) → 看空訊號（別人貪婪我恐懼）
    """
    if df.empty:
        return FearGreedAnalysis(
            current_value=50,
            current_class="Neutral",
            signal="neutral",
            strength=0.0,
            trend="stable",
            avg_7d=50.0,
            avg_30d=50.0,
            history=df,
        )

    current = int(df.iloc[-1]["value"])
    current_class = str(df.iloc[-1]["classification"])

    # 計算均值
    avg_7d = float(df.tail(7)["value"].mean())
    avg_30d = float(df["value"].mean())

    # 訊號判斷（逆向：恐懼=買入機會，貪婪=賣出訊號）
    if current <= 25:
        signal, strength = "bullish", min((25 - current) / 25, 1.0) * 0.6 + 0.4
    elif current <= 45:
        signal, strength = "bullish", (45 - current) / 20 * 0.4
    elif current <= 55:
        signal, strength = "neutral", 0.0
    elif current <= 75:
        signal, strength = "bearish", (current - 55) / 20 * 0.4
    else:
        signal, strength = "bearish", min((current - 75) / 25, 1.0) * 0.6 + 0.4

    # 趨勢判斷
    if avg_7d > avg_30d + 5:
        trend = "improving"
    elif avg_7d < avg_30d - 5:
        trend = "worsening"
    else:
        trend = "stable"

    return FearGreedAnalysis(
        current_value=current,
        current_class=current_class,
        signal=signal,
        strength=round(strength, 4),
        trend=trend,
        avg_7d=round(avg_7d, 2),
        avg_30d=round(avg_30d, 2),
        history=df,
    )
