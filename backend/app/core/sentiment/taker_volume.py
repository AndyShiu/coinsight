from __future__ import annotations

import math
from dataclasses import dataclass

import pandas as pd


@dataclass
class TakerVolumeAnalysis:
    """主動買賣量分析結果"""

    symbol: str
    current_ratio: float
    buy_vol: float
    sell_vol: float
    avg_ratio: float
    signal: str
    strength: float
    continuous_score: float
    pressure: str
    history: pd.DataFrame


def _taker_continuous(ratio: float) -> float:
    """主動買賣量比 → 連續分數 (-1.0 ~ +1.0) — 順勢指標
    ratio=1.0 → 0.0, ratio>1.15 → 趨近 +1.0, ratio<0.85 → 趨近 -1.0
    0.95~1.05 為弱訊號區
    """
    if ratio >= 1.0:
        raw = math.tanh((ratio - 1.0) / 0.25)
    else:
        raw = -math.tanh((1.0 - ratio) / 0.25)
    # 0.95~1.05 弱訊號區壓縮
    if 0.95 <= ratio <= 1.05:
        raw *= 0.3
    return max(min(raw, 1.0), -1.0)


def analyze_taker_volume(
    df: pd.DataFrame, symbol: str = "BTC"
) -> TakerVolumeAnalysis:
    """分析主動買賣量（順勢指標）

    策略邏輯：
    - Ratio > 1.15 → 強烈買壓，看多
    - Ratio > 1.05 → 買壓偏多
    - 0.95 ~ 1.05 → 均衡，中性
    - Ratio < 0.95 → 賣壓偏大
    - Ratio < 0.85 → 強烈賣壓，看空
    """
    if df.empty or "buy_sell_ratio" not in df.columns:
        return TakerVolumeAnalysis(
            symbol=symbol, current_ratio=1.0, buy_vol=0,
            sell_vol=0, avg_ratio=1.0, signal="neutral",
            strength=0, continuous_score=0.0, pressure="balanced", history=df,
        )

    current = float(df.iloc[-1]["buy_sell_ratio"])
    buy_vol = float(df.iloc[-1]["buy_vol"])
    sell_vol = float(df.iloc[-1]["sell_vol"])
    avg_ratio = float(df["buy_sell_ratio"].mean())

    # 壓力方向
    if current > 1.05:
        pressure = "buying"
    elif current < 0.95:
        pressure = "selling"
    else:
        pressure = "balanced"

    # 順勢訊號
    if current > 1.15:
        signal = "bullish"
        strength = min((current - 1.15) / 0.3, 1.0) * 0.5 + 0.4
    elif current > 1.05:
        signal = "bullish"
        strength = (current - 1.05) / 0.1 * 0.3
    elif current > 0.95:
        signal, strength = "neutral", 0.0
    elif current > 0.85:
        signal = "bearish"
        strength = (0.95 - current) / 0.1 * 0.3
    else:
        signal = "bearish"
        strength = min((0.85 - current) / 0.3, 1.0) * 0.5 + 0.4

    return TakerVolumeAnalysis(
        symbol=symbol,
        current_ratio=round(current, 4),
        buy_vol=round(buy_vol, 2),
        sell_vol=round(sell_vol, 2),
        avg_ratio=round(avg_ratio, 4),
        signal=signal,
        strength=round(strength, 4),
        continuous_score=round(_taker_continuous(current), 4),
        pressure=pressure,
        history=df,
    )
