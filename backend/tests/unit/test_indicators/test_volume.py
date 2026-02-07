from __future__ import annotations
from app.core.indicators.volume import VolumeAnalysis


class TestVolumeAnalysis:
    def test_calculate_returns_result(self, sample_ohlcv):
        indicator = VolumeAnalysis()
        result = indicator.calculate(sample_ohlcv)

        assert result.name == "Volume"
        assert result.signal in ("bullish", "bearish", "neutral")
        assert 0.0 <= result.strength <= 1.0
        assert "volume" in result.values
        assert "obv" in result.values

    def test_metadata_fields(self, sample_ohlcv):
        indicator = VolumeAnalysis()
        result = indicator.calculate(sample_ohlcv)

        assert "current_volume" in result.metadata
        assert "volume_ma" in result.metadata
        assert "volume_ratio" in result.metadata
        assert "obv" in result.metadata
        assert "obv_trend" in result.metadata
        assert result.metadata["obv_trend"] in ("rising", "falling")

    def test_volume_ratio_positive(self, sample_ohlcv):
        indicator = VolumeAnalysis()
        result = indicator.calculate(sample_ohlcv)

        assert result.metadata["volume_ratio"] > 0
