from __future__ import annotations
import pandas as pd
import pytest

from app.core.indicators.oscillator import KDIndicator, RSIIndicator


class TestRSI:
    def test_calculate_returns_result(self, sample_ohlcv):
        indicator = RSIIndicator(period=14)
        result = indicator.calculate(sample_ohlcv)

        assert result.name == "RSI"
        assert result.signal in ("bullish", "bearish", "neutral")
        assert 0.0 <= result.strength <= 1.0
        assert "rsi" in result.values
        assert "latest_value" in result.metadata

    def test_rsi_value_in_range(self, sample_ohlcv):
        indicator = RSIIndicator(period=14)
        result = indicator.calculate(sample_ohlcv)

        rsi_values = result.values["rsi"].dropna()
        assert all(0 <= v <= 100 for v in rsi_values)

    def test_rsi_bearish_on_downtrend(self, bearish_ohlcv):
        indicator = RSIIndicator(period=14)
        result = indicator.calculate(bearish_ohlcv)

        # 下跌趨勢的 RSI 應該偏低
        latest_rsi = result.metadata["latest_value"]
        assert latest_rsi < 60  # 不一定 < 30，但應該偏低

    def test_custom_period(self, sample_ohlcv):
        indicator = RSIIndicator(period=7)
        result = indicator.calculate(sample_ohlcv)

        assert result.metadata["period"] == 7

    def test_to_dict(self, sample_ohlcv):
        indicator = RSIIndicator()
        result = indicator.calculate(sample_ohlcv)
        d = result.to_dict()

        assert "name" in d
        assert "signal" in d
        assert "strength" in d
        assert "latest_values" in d
        assert "rsi" in d["latest_values"]


class TestKD:
    def test_calculate_returns_result(self, sample_ohlcv):
        indicator = KDIndicator()
        result = indicator.calculate(sample_ohlcv)

        assert result.name == "KD"
        assert result.signal in ("bullish", "bearish", "neutral")
        assert 0.0 <= result.strength <= 1.0
        assert "K" in result.values
        assert "D" in result.values

    def test_kd_values_in_range(self, sample_ohlcv):
        indicator = KDIndicator()
        result = indicator.calculate(sample_ohlcv)

        k_values = result.values["K"].dropna()
        d_values = result.values["D"].dropna()
        assert all(0 <= v <= 100 for v in k_values)
        assert all(0 <= v <= 100 for v in d_values)

    def test_metadata_has_kd_values(self, sample_ohlcv):
        indicator = KDIndicator()
        result = indicator.calculate(sample_ohlcv)

        assert "K" in result.metadata
        assert "D" in result.metadata
