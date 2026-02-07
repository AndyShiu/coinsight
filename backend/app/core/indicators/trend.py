from __future__ import annotations

import math

import pandas as pd
from ta.trend import MACD as _MACD
from ta.trend import EMAIndicator as _EMA

from app.core.indicators.base import BaseIndicator, IndicatorResult


class MACDIndicator(BaseIndicator):
    """MACD 指數平滑異同移動平均線"""

    def __init__(self, fast: int = 12, slow: int = 26, signal_period: int = 9):
        self.fast = fast
        self.slow = slow
        self.signal_period = signal_period

    @property
    def name(self) -> str:
        return "MACD"

    @staticmethod
    def _continuous(hist_now: float, hist_prev: float, close_now: float) -> float:
        """MACD histogram → 連續分數 (-1.0 ~ +1.0)
        用 tanh 平滑映射 histogram 佔價格的百分比
        """
        if close_now <= 0:
            return 0.0
        hist_pct = hist_now / close_now * 100
        base = math.tanh(hist_pct * 2.0)
        # 動量加成: histogram 方向加強/減弱
        if (hist_now > 0 and hist_now > hist_prev) or (hist_now < 0 and hist_now < hist_prev):
            base *= 1.15
        elif (hist_now > 0 and hist_now < hist_prev) or (hist_now < 0 and hist_now > hist_prev):
            base *= 0.85
        return max(min(base, 1.0), -1.0)

    def calculate(self, df: pd.DataFrame) -> IndicatorResult:
        macd = _MACD(
            close=df["close"],
            window_slow=self.slow,
            window_fast=self.fast,
            window_sign=self.signal_period,
        )

        macd_line = macd.macd()
        signal_line = macd.macd_signal()
        histogram = macd.macd_diff()

        macd_now = float(macd_line.iloc[-1])
        signal_now = float(signal_line.iloc[-1])
        hist_now = float(histogram.iloc[-1])
        hist_prev = float(histogram.iloc[-2])
        close_now = float(df["close"].iloc[-1])

        if macd_now > signal_now and hist_now > hist_prev:
            signal = "bullish"
            strength = min(abs(hist_now) / abs(macd_now) if macd_now != 0 else 0.5, 1.0)
        elif macd_now < signal_now and hist_now < hist_prev:
            signal = "bearish"
            strength = min(abs(hist_now) / abs(macd_now) if macd_now != 0 else 0.5, 1.0)
        else:
            signal = "neutral"
            strength = 0.0

        return IndicatorResult(
            name="MACD",
            values={"macd": macd_line, "signal": signal_line, "histogram": histogram},
            signal=signal,
            strength=strength,
            continuous_score=round(self._continuous(hist_now, hist_prev, close_now), 4),
            metadata={
                "fast": self.fast,
                "slow": self.slow,
                "signal_period": self.signal_period,
                "macd": round(macd_now, 4),
                "signal_value": round(signal_now, 4),
                "histogram": round(hist_now, 4),
            },
        )


class EMAIndicator(BaseIndicator):
    """EMA 交叉指標"""

    def __init__(self, fast_period: int = 9, slow_period: int = 21):
        self.fast_period = fast_period
        self.slow_period = slow_period

    @property
    def name(self) -> str:
        return "EMA"

    @staticmethod
    def _continuous(fast_now: float, slow_now: float,
                    fast_prev: float, slow_prev: float) -> float:
        """EMA 交叉 → 連續分數 (-1.0 ~ +1.0)
        fast-slow 差距佔 slow 的百分比 + 交叉加成
        """
        if slow_now <= 0:
            return 0.0
        spread_pct = (fast_now - slow_now) / slow_now * 100
        base = math.tanh(spread_pct * 1.5)
        # 交叉加成 ±0.2
        cross_up = fast_now > slow_now and fast_prev <= slow_prev
        cross_down = fast_now < slow_now and fast_prev >= slow_prev
        if cross_up:
            base = min(base + 0.2, 1.0)
        elif cross_down:
            base = max(base - 0.2, -1.0)
        return base

    def calculate(self, df: pd.DataFrame) -> IndicatorResult:
        ema_fast = _EMA(close=df["close"], window=self.fast_period).ema_indicator()
        ema_slow = _EMA(close=df["close"], window=self.slow_period).ema_indicator()

        fast_now = float(ema_fast.iloc[-1])
        slow_now = float(ema_slow.iloc[-1])
        fast_prev = float(ema_fast.iloc[-2])
        slow_prev = float(ema_slow.iloc[-2])

        cross_up = fast_now > slow_now and fast_prev <= slow_prev
        cross_down = fast_now < slow_now and fast_prev >= slow_prev

        if cross_up:
            signal, strength = "bullish", 0.8
        elif cross_down:
            signal, strength = "bearish", 0.8
        elif fast_now > slow_now:
            signal, strength = "bullish", 0.4
        elif fast_now < slow_now:
            signal, strength = "bearish", 0.4
        else:
            signal, strength = "neutral", 0.0

        return IndicatorResult(
            name="EMA",
            values={"ema_fast": ema_fast, "ema_slow": ema_slow},
            signal=signal,
            strength=strength,
            continuous_score=round(self._continuous(fast_now, slow_now, fast_prev, slow_prev), 4),
            metadata={
                "fast_period": self.fast_period,
                "slow_period": self.slow_period,
                "ema_fast": round(fast_now, 2),
                "ema_slow": round(slow_now, 2),
            },
        )
