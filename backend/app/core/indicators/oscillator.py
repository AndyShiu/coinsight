from __future__ import annotations

import pandas as pd
from ta.momentum import RSIIndicator as _RSI
from ta.momentum import StochasticOscillator

from app.core.indicators.base import BaseIndicator, IndicatorResult


class RSIIndicator(BaseIndicator):
    """RSI 相對強弱指標"""

    def __init__(self, period: int = 14):
        self.period = period

    @property
    def name(self) -> str:
        return "RSI"

    @staticmethod
    def _continuous(rsi: float) -> float:
        """RSI → 連續分數 (-1.0 ~ +1.0)
        RSI=0 → +1.0 (極度超賣=看多)
        RSI=30 → +0.4, RSI=50 → 0.0, RSI=70 → -0.4
        RSI=100 → -1.0 (極度超買=看空)
        """
        if rsi <= 30:
            return 0.4 + (30 - rsi) / 30 * 0.6
        elif rsi <= 50:
            return (50 - rsi) / 20 * 0.4
        elif rsi <= 70:
            return -(rsi - 50) / 20 * 0.4
        else:
            return -(0.4 + (rsi - 70) / 30 * 0.6)

    def calculate(self, df: pd.DataFrame) -> IndicatorResult:
        rsi_indicator = _RSI(close=df["close"], window=self.period)
        rsi = rsi_indicator.rsi()
        latest = float(rsi.iloc[-1])

        if latest < 30:
            signal = "bullish"
            strength = (30 - latest) / 30
        elif latest > 70:
            signal = "bearish"
            strength = (latest - 70) / 30
        else:
            signal = "neutral"
            strength = 0.0

        return IndicatorResult(
            name="RSI",
            values={"rsi": rsi},
            signal=signal,
            strength=min(strength, 1.0),
            continuous_score=round(self._continuous(latest), 4),
            metadata={"period": self.period, "latest_value": round(latest, 2)},
        )


class KDIndicator(BaseIndicator):
    """KD 隨機指標 (Stochastic Oscillator)"""

    def __init__(self, k_period: int = 14, d_period: int = 3, smooth_k: int = 3):
        self.k_period = k_period
        self.d_period = d_period
        self.smooth_k = smooth_k

    @property
    def name(self) -> str:
        return "KD"

    @staticmethod
    def _continuous(k_now: float, k_prev: float, d_now: float, d_prev: float) -> float:
        """KD → 連續分數 (-1.0 ~ +1.0)
        K 值區間分數 + 交叉加成
        """
        # K 值基礎分數
        if k_now <= 20:
            base = 0.3 + (20 - k_now) / 20 * 0.4
        elif k_now <= 50:
            base = (50 - k_now) / 30 * 0.3
        elif k_now <= 80:
            base = -(k_now - 50) / 30 * 0.3
        else:
            base = -(0.3 + (k_now - 80) / 20 * 0.4)

        # 交叉加成 ±0.3
        cross_up = k_now > d_now and k_prev <= d_prev
        cross_down = k_now < d_now and k_prev >= d_prev
        if cross_up:
            base = min(base + 0.3, 1.0)
        elif cross_down:
            base = max(base - 0.3, -1.0)

        return base

    def calculate(self, df: pd.DataFrame) -> IndicatorResult:
        stoch = StochasticOscillator(
            high=df["high"],
            low=df["low"],
            close=df["close"],
            window=self.k_period,
            smooth_window=self.d_period,
        )

        k_line = stoch.stoch()
        d_line = stoch.stoch_signal()

        k_now = float(k_line.iloc[-1])
        d_now = float(d_line.iloc[-1])
        k_prev = float(k_line.iloc[-2])
        d_prev = float(d_line.iloc[-2])

        # 黃金交叉 / 死亡交叉
        cross_up = k_now > d_now and k_prev <= d_prev
        cross_down = k_now < d_now and k_prev >= d_prev

        if cross_up and k_now < 20:
            signal, strength = "bullish", 0.9
        elif cross_up:
            signal, strength = "bullish", 0.6
        elif cross_down and k_now > 80:
            signal, strength = "bearish", 0.9
        elif cross_down:
            signal, strength = "bearish", 0.6
        elif k_now < 20:
            signal, strength = "bullish", 0.4
        elif k_now > 80:
            signal, strength = "bearish", 0.4
        else:
            signal, strength = "neutral", 0.0

        return IndicatorResult(
            name="KD",
            values={"K": k_line, "D": d_line},
            signal=signal,
            strength=strength,
            continuous_score=round(self._continuous(k_now, k_prev, d_now, d_prev), 4),
            metadata={
                "k_period": self.k_period,
                "d_period": self.d_period,
                "K": round(k_now, 2),
                "D": round(d_now, 2),
            },
        )
