from __future__ import annotations

import pandas as pd

from app.core.sentiment.taker_volume import analyze_taker_volume


class TestTakerVolumeAnalysis:
    def test_empty_df(self):
        df = pd.DataFrame()
        result = analyze_taker_volume(df, "BTC")
        assert result.signal == "neutral"
        assert result.pressure == "balanced"

    def test_strong_buying_pressure(self):
        rows = [
            {"timestamp": i, "buy_sell_ratio": 1.2,
             "buy_vol": 120_000_000, "sell_vol": 100_000_000}
            for i in range(10)
        ]
        df = pd.DataFrame(rows)
        result = analyze_taker_volume(df, "BTC")
        assert result.signal == "bullish"
        assert result.pressure == "buying"

    def test_strong_selling_pressure(self):
        rows = [
            {"timestamp": i, "buy_sell_ratio": 0.8,
             "buy_vol": 80_000_000, "sell_vol": 100_000_000}
            for i in range(10)
        ]
        df = pd.DataFrame(rows)
        result = analyze_taker_volume(df, "BTC")
        assert result.signal == "bearish"
        assert result.pressure == "selling"

    def test_balanced(self):
        rows = [
            {"timestamp": i, "buy_sell_ratio": 1.0,
             "buy_vol": 100_000_000, "sell_vol": 100_000_000}
            for i in range(10)
        ]
        df = pd.DataFrame(rows)
        result = analyze_taker_volume(df, "BTC")
        assert result.signal == "neutral"
        assert result.pressure == "balanced"

    def test_moderate_buying(self):
        rows = [
            {"timestamp": i, "buy_sell_ratio": 1.1,
             "buy_vol": 110_000_000, "sell_vol": 100_000_000}
            for i in range(10)
        ]
        df = pd.DataFrame(rows)
        result = analyze_taker_volume(df, "BTC")
        assert result.signal == "bullish"
        assert result.pressure == "buying"
