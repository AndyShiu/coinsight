from __future__ import annotations

import math
from dataclasses import dataclass

import pandas as pd


@dataclass
class OpenInterestAnalysis:
    """未平倉合約分析結果"""

    symbol: str
    current_oi: float
    current_oi_value: float
    change_pct: float
    signal: str
    strength: float
    continuous_score: float
    trend: str
    history: pd.DataFrame


def _oi_continuous(change_pct: float) -> float:
    """OI 變化百分比 → 連續分數 (-1.0 ~ +1.0)
    - 溫和上升 (0~10%) → 微正 (市場參與增加)
    - 快速膨脹 (>15%) → 負分 (過度槓桿)
    - 下降 → 接近零 (去槓桿，非方向性)
    """
    if change_pct > 15:
        return -math.tanh((change_pct - 15) / 15)
    elif change_pct > 0:
        return change_pct / 15 * 0.15
    elif change_pct > -10:
        return 0.0
    else:
        return 0.0


def analyze_open_interest(df: pd.DataFrame, symbol: str = "BTC") -> OpenInterestAnalysis:
    """分析未平倉合約

    策略邏輯：
    - OI 快速膨脹 >15% → 過度槓桿警訊 (bearish)
    - OI 穩定上升 3~15% → 正常趨勢 (neutral)
    - OI 下降 → 去槓桿、部位清算 (neutral)
    """
    if df.empty or "open_interest_value" not in df.columns:
        return OpenInterestAnalysis(
            symbol=symbol, current_oi=0, current_oi_value=0,
            change_pct=0, signal="neutral", strength=0,
            continuous_score=0.0, trend="stable", history=df,
        )

    current_oi = float(df.iloc[-1]["open_interest"])
    current_oi_value = float(df.iloc[-1]["open_interest_value"])

    first_val = float(df.iloc[0]["open_interest_value"])
    change_pct = ((current_oi_value - first_val) / first_val * 100) if first_val > 0 else 0

    # 趨勢
    if change_pct > 3:
        trend = "rising"
    elif change_pct < -3:
        trend = "falling"
    else:
        trend = "stable"

    # 訊號
    if change_pct > 15:
        signal = "bearish"
        strength = min(change_pct / 30, 1.0) * 0.5 + 0.3
    elif change_pct > 5:
        signal, strength = "neutral", 0.0
    elif change_pct < -10:
        signal, strength = "neutral", 0.0
    else:
        signal, strength = "neutral", 0.0

    return OpenInterestAnalysis(
        symbol=symbol,
        current_oi=round(current_oi, 2),
        current_oi_value=round(current_oi_value, 2),
        change_pct=round(change_pct, 2),
        signal=signal,
        strength=round(strength, 4),
        continuous_score=round(_oi_continuous(change_pct), 4),
        trend=trend,
        history=df,
    )
