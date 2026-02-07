from __future__ import annotations

from dataclasses import dataclass

import pandas as pd


@dataclass
class ExchangeFlowAnalysis:
    """交易所流入流出分析結果"""

    asset: str
    latest_netflow: float
    avg_netflow_7d: float
    signal: str
    strength: float
    trend: str  # "accumulation" (囤幣) | "distribution" (拋售) | "neutral"
    history: pd.DataFrame


def analyze_exchange_flow(df: pd.DataFrame, asset: str = "BTC") -> ExchangeFlowAnalysis:
    """分析交易所淨流入流出

    策略邏輯：
    - 大量淨流出 → 投資者將幣從交易所提走，代表囤幣 → 看多
    - 大量淨流入 → 投資者將幣轉入交易所，準備賣出 → 看空
    """
    if df.empty or "value" not in df.columns:
        return ExchangeFlowAnalysis(
            asset=asset,
            latest_netflow=0.0,
            avg_netflow_7d=0.0,
            signal="neutral",
            strength=0.0,
            trend="neutral",
            history=df,
        )

    latest = float(df.iloc[-1]["value"])
    avg_7d = float(df.tail(7)["value"].mean())

    # 判斷趨勢：負值=淨流出=囤幣，正值=淨流入=準備賣
    if avg_7d < 0:
        trend = "accumulation"
        signal = "bullish"
        strength = min(abs(avg_7d) / 10000, 1.0) * 0.6
    elif avg_7d > 0:
        trend = "distribution"
        signal = "bearish"
        strength = min(abs(avg_7d) / 10000, 1.0) * 0.6
    else:
        trend = "neutral"
        signal = "neutral"
        strength = 0.0

    return ExchangeFlowAnalysis(
        asset=asset,
        latest_netflow=round(latest, 2),
        avg_netflow_7d=round(avg_7d, 2),
        signal=signal,
        strength=round(strength, 4),
        trend=trend,
        history=df,
    )
