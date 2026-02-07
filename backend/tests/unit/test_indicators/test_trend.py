from __future__ import annotations
from app.core.indicators.trend import EMAIndicator, MACDIndicator


class TestMACD:
    def test_calculate_returns_result(self, sample_ohlcv):
        indicator = MACDIndicator()
        result = indicator.calculate(sample_ohlcv)

        assert result.name == "MACD"
        assert result.signal in ("bullish", "bearish", "neutral")
        assert 0.0 <= result.strength <= 1.0
        assert "macd" in result.values
        assert "signal" in result.values
        assert "histogram" in result.values

    def test_metadata_fields(self, sample_ohlcv):
        indicator = MACDIndicator(fast=12, slow=26, signal_period=9)
        result = indicator.calculate(sample_ohlcv)

        assert result.metadata["fast"] == 12
        assert result.metadata["slow"] == 26
        assert "macd" in result.metadata
        assert "histogram" in result.metadata

    def test_to_dict(self, sample_ohlcv):
        indicator = MACDIndicator()
        result = indicator.calculate(sample_ohlcv)
        d = result.to_dict()

        assert d["name"] == "MACD"
        assert "macd" in d["latest_values"]
        assert "signal" in d["latest_values"]


class TestEMA:
    def test_calculate_returns_result(self, sample_ohlcv):
        indicator = EMAIndicator()
        result = indicator.calculate(sample_ohlcv)

        assert result.name == "EMA"
        assert result.signal in ("bullish", "bearish", "neutral")
        assert "ema_fast" in result.values
        assert "ema_slow" in result.values

    def test_uptrend_signal(self, sample_ohlcv):
        """上升趨勢中，快線應在慢線上方"""
        indicator = EMAIndicator(fast_period=9, slow_period=21)
        result = indicator.calculate(sample_ohlcv)

        # sample_ohlcv 是上升趨勢，EMA 快線應高於慢線
        assert result.metadata["ema_fast"] > result.metadata["ema_slow"]

    def test_custom_periods(self, sample_ohlcv):
        indicator = EMAIndicator(fast_period=5, slow_period=50)
        result = indicator.calculate(sample_ohlcv)

        assert result.metadata["fast_period"] == 5
        assert result.metadata["slow_period"] == 50
