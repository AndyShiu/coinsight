from __future__ import annotations

import pandas as pd
from ta.volatility import BollingerBands

from app.core.indicators.base import BaseIndicator, IndicatorResult


class BollingerBandsIndicator(BaseIndicator):
    """布林通道 (Bollinger Bands)"""

    def __init__(self, period: int = 20, std_dev: float = 2.0):
        self.period = period
        self.std_dev = std_dev

    @property
    def name(self) -> str:
        return "BBANDS"

    @staticmethod
    def _continuous(pct_b: float) -> float:
        """%B → 連續分數 (-1.0 ~ +1.0)
        %B=0 (下軌) → +0.5, %B=0.5 (中線) → 0.0, %B=1 (上軌) → -0.5
        突破上下軌則趨向 ±1.0
        """
        if pct_b <= 0.0:
            return min(0.5 + abs(pct_b) * 0.5, 1.0)
        elif pct_b <= 0.2:
            return 0.5 - (pct_b / 0.2) * 0.15  # [0.35, 0.5]
        elif pct_b <= 0.5:
            return (0.5 - pct_b) / 0.3 * 0.35  # [0.0, 0.35]
        elif pct_b <= 0.8:
            return -((pct_b - 0.5) / 0.3 * 0.35)  # [-0.35, 0.0]
        elif pct_b <= 1.0:
            return -(0.35 + (pct_b - 0.8) / 0.2 * 0.15)  # [-0.5, -0.35]
        else:
            return max(-(0.5 + (pct_b - 1.0) * 0.5), -1.0)

    def calculate(self, df: pd.DataFrame) -> IndicatorResult:
        bb = BollingerBands(
            close=df["close"],
            window=self.period,
            window_dev=int(self.std_dev),
        )

        upper = bb.bollinger_hband()
        mid = bb.bollinger_mavg()
        lower = bb.bollinger_lband()

        close_now = float(df["close"].iloc[-1])
        upper_now = float(upper.iloc[-1])
        lower_now = float(lower.iloc[-1])
        mid_now = float(mid.iloc[-1])

        # %B 值: 0 = 在下軌, 1 = 在上軌
        pct_b = (close_now - lower_now) / (upper_now - lower_now) if upper_now != lower_now else 0.5

        if pct_b < 0.0:
            signal, strength = "bullish", min(abs(pct_b), 1.0)
        elif pct_b > 1.0:
            signal, strength = "bearish", min(pct_b - 1.0, 1.0)
        elif pct_b < 0.2:
            signal, strength = "bullish", 0.6
        elif pct_b > 0.8:
            signal, strength = "bearish", 0.6
        else:
            signal, strength = "neutral", 0.0

        return IndicatorResult(
            name="BBANDS",
            values={"upper": upper, "middle": mid, "lower": lower},
            signal=signal,
            strength=strength,
            continuous_score=round(self._continuous(pct_b), 4),
            metadata={
                "period": self.period,
                "std_dev": self.std_dev,
                "upper": round(upper_now, 2),
                "middle": round(mid_now, 2),
                "lower": round(lower_now, 2),
                "percent_b": round(pct_b, 4),
            },
        )
