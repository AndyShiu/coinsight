from __future__ import annotations
from app.core.indicators.volatility import BollingerBandsIndicator


class TestBollingerBands:
    def test_calculate_returns_result(self, sample_ohlcv):
        indicator = BollingerBandsIndicator()
        result = indicator.calculate(sample_ohlcv)

        assert result.name == "BBANDS"
        assert result.signal in ("bullish", "bearish", "neutral")
        assert 0.0 <= result.strength <= 1.0
        assert "upper" in result.values
        assert "middle" in result.values
        assert "lower" in result.values

    def test_upper_above_lower(self, sample_ohlcv):
        indicator = BollingerBandsIndicator()
        result = indicator.calculate(sample_ohlcv)

        assert result.metadata["upper"] > result.metadata["lower"]
        assert result.metadata["upper"] > result.metadata["middle"]
        assert result.metadata["middle"] > result.metadata["lower"]

    def test_percent_b_in_metadata(self, sample_ohlcv):
        indicator = BollingerBandsIndicator()
        result = indicator.calculate(sample_ohlcv)

        assert "percent_b" in result.metadata

    def test_custom_params(self, sample_ohlcv):
        indicator = BollingerBandsIndicator(period=10, std_dev=1.5)
        result = indicator.calculate(sample_ohlcv)

        assert result.metadata["period"] == 10
        assert result.metadata["std_dev"] == 1.5
