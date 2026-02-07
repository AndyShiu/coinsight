from __future__ import annotations

import math

import pandas as pd
from ta.volume import OnBalanceVolumeIndicator

from app.core.indicators.base import BaseIndicator, IndicatorResult


class VolumeAnalysis(BaseIndicator):
    """成交量分析（含 OBV）"""

    def __init__(self, ma_period: int = 20):
        self.ma_period = ma_period

    @property
    def name(self) -> str:
        return "Volume"

    def calculate(self, df: pd.DataFrame) -> IndicatorResult:
        volume = df["volume"]

        # 若成交量全為 0（如 CoinGecko OHLC），回傳中性結果
        if volume.sum() == 0:
            return IndicatorResult(
                name="Volume",
                values={"volume": volume, "obv": volume, "volume_ma": volume},
                signal="neutral",
                strength=0.0,
                metadata={"ma_period": self.ma_period, "note": "no volume data available"},
            )

        obv = OnBalanceVolumeIndicator(close=df["close"], volume=volume).on_balance_volume()
        volume_ma = volume.rolling(window=self.ma_period).mean()

        vol_now = float(volume.iloc[-1])
        vol_ma_now = float(volume_ma.iloc[-1]) if not pd.isna(volume_ma.iloc[-1]) else vol_now
        obv_now = float(obv.iloc[-1])
        obv_prev = float(obv.iloc[-5]) if len(obv) > 5 else obv_now

        # 相對成交量比率
        vol_ratio = vol_now / vol_ma_now if vol_ma_now > 0 else 1.0

        # OBV 趨勢
        obv_rising = obv_now > obv_prev
        price_rising = float(df["close"].iloc[-1]) > float(df["close"].iloc[-5]) if len(df) > 5 else True

        # 量價配合判斷
        if obv_rising and price_rising and vol_ratio > 1.5:
            signal, strength = "bullish", 0.8
        elif obv_rising and price_rising:
            signal, strength = "bullish", 0.4
        elif not obv_rising and not price_rising and vol_ratio > 1.5:
            signal, strength = "bearish", 0.8
        elif not obv_rising and not price_rising:
            signal, strength = "bearish", 0.4
        elif obv_rising and not price_rising:
            signal, strength = "bullish", 0.6
        elif not obv_rising and price_rising:
            signal, strength = "bearish", 0.6
        else:
            signal, strength = "neutral", 0.0

        # 連續分數: OBV 方向 × 成交量放大倍率
        obv_dir = 1.0 if obv_rising else -1.0
        price_dir = 1.0 if price_rising else -1.0
        # 量價同向加強，量價背離取 OBV 方向但減弱
        if obv_dir == price_dir:
            cscore = obv_dir * math.tanh((vol_ratio - 1.0) * 1.5) * 0.6 + obv_dir * 0.2
        else:
            cscore = obv_dir * 0.3 * math.tanh((vol_ratio - 1.0) * 1.5)
        cscore = max(min(cscore, 1.0), -1.0)

        return IndicatorResult(
            name="Volume",
            values={"volume": volume, "obv": obv, "volume_ma": volume_ma},
            signal=signal,
            strength=strength,
            continuous_score=round(cscore, 4),
            metadata={
                "ma_period": self.ma_period,
                "current_volume": round(vol_now, 2),
                "volume_ma": round(vol_ma_now, 2),
                "volume_ratio": round(vol_ratio, 2),
                "obv": round(obv_now, 2),
                "obv_trend": "rising" if obv_rising else "falling",
            },
        )
