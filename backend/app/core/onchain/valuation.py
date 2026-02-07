from __future__ import annotations

from dataclasses import dataclass

import pandas as pd


@dataclass
class MVRVAnalysis:
    """MVRV 分析結果"""

    asset: str
    current_mvrv: float
    signal: str
    strength: float
    zone: str  # "undervalued" | "fair" | "overvalued" | "extreme"
    history: pd.DataFrame


@dataclass
class NUPLAnalysis:
    """NUPL 分析結果"""

    asset: str
    current_nupl: float
    signal: str
    strength: float
    phase: str  # "capitulation" | "hope" | "optimism" | "belief" | "euphoria"
    history: pd.DataFrame


def analyze_mvrv(df: pd.DataFrame, asset: str = "BTC") -> MVRVAnalysis:
    """分析 MVRV 比率

    策略邏輯：
    - MVRV < 1.0  → 市場價值低於已實現價值，嚴重低估 → 強力看多
    - MVRV 1.0~1.5 → 低估區 → 看多
    - MVRV 1.5~2.5 → 合理區間 → 中性
    - MVRV 2.5~3.5 → 高估區 → 看空
    - MVRV > 3.5  → 過熱，歷史高點通常在此 → 強力看空
    """
    if df.empty or "mvrv" not in df.columns:
        return MVRVAnalysis(
            asset=asset, current_mvrv=0.0, signal="neutral",
            strength=0.0, zone="fair", history=df,
        )

    current = float(df.iloc[-1]["mvrv"])

    if current < 1.0:
        signal, strength, zone = "bullish", 0.9, "undervalued"
    elif current < 1.5:
        signal, strength, zone = "bullish", 0.5, "undervalued"
    elif current < 2.5:
        signal, strength, zone = "neutral", 0.0, "fair"
    elif current < 3.5:
        signal, strength, zone = "bearish", 0.5, "overvalued"
    else:
        signal, strength, zone = "bearish", 0.9, "extreme"

    return MVRVAnalysis(
        asset=asset,
        current_mvrv=round(current, 4),
        signal=signal,
        strength=strength,
        zone=zone,
        history=df,
    )


def analyze_nupl(df: pd.DataFrame, asset: str = "BTC") -> NUPLAnalysis:
    """分析 NUPL (Net Unrealized Profit/Loss)

    策略邏輯：
    - NUPL < 0     → 投降階段，大多數人虧損 → 強力看多（底部區域）
    - NUPL 0~0.25  → 希望階段 → 看多
    - NUPL 0.25~0.5 → 樂觀階段 → 中性偏多
    - NUPL 0.5~0.75 → 信念階段 → 中性偏空
    - NUPL > 0.75  → 狂熱階段 → 強力看空（頂部區域）
    """
    if df.empty or "nupl" not in df.columns:
        return NUPLAnalysis(
            asset=asset, current_nupl=0.0, signal="neutral",
            strength=0.0, phase="optimism", history=df,
        )

    current = float(df.iloc[-1]["nupl"])

    if current < 0:
        signal, strength, phase = "bullish", 0.9, "capitulation"
    elif current < 0.25:
        signal, strength, phase = "bullish", 0.5, "hope"
    elif current < 0.5:
        signal, strength, phase = "neutral", 0.1, "optimism"
    elif current < 0.75:
        signal, strength, phase = "bearish", 0.5, "belief"
    else:
        signal, strength, phase = "bearish", 0.9, "euphoria"

    return NUPLAnalysis(
        asset=asset,
        current_nupl=round(current, 4),
        signal=signal,
        strength=strength,
        phase=phase,
        history=df,
    )
