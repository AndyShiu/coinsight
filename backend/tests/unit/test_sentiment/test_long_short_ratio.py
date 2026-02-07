from __future__ import annotations

import pandas as pd

from app.core.sentiment.long_short_ratio import analyze_long_short_ratio


class TestLongShortRatioAnalysis:
    def test_empty_df(self):
        df = pd.DataFrame()
        result = analyze_long_short_ratio(df, "BTC")
        assert result.signal == "neutral"
        assert result.current_ratio == 1.0

    def test_extreme_long_bearish(self):
        rows = [
            {"timestamp": i, "long_short_ratio": 1.8,
             "long_account": 0.64, "short_account": 0.36}
            for i in range(10)
        ]
        df = pd.DataFrame(rows)
        result = analyze_long_short_ratio(df, "BTC")
        assert result.signal == "bearish"
        assert result.trend == "more_longs"
        assert result.strength > 0.3

    def test_moderate_long_bearish(self):
        rows = [
            {"timestamp": i, "long_short_ratio": 1.3,
             "long_account": 0.57, "short_account": 0.43}
            for i in range(10)
        ]
        df = pd.DataFrame(rows)
        result = analyze_long_short_ratio(df, "BTC")
        assert result.signal == "bearish"
        assert result.trend == "more_longs"

    def test_extreme_short_bullish(self):
        rows = [
            {"timestamp": i, "long_short_ratio": 0.5,
             "long_account": 0.33, "short_account": 0.67}
            for i in range(10)
        ]
        df = pd.DataFrame(rows)
        result = analyze_long_short_ratio(df, "BTC")
        assert result.signal == "bullish"
        assert result.trend == "more_shorts"
        assert result.strength > 0.3

    def test_balanced_neutral(self):
        rows = [
            {"timestamp": i, "long_short_ratio": 1.0,
             "long_account": 0.5, "short_account": 0.5}
            for i in range(10)
        ]
        df = pd.DataFrame(rows)
        result = analyze_long_short_ratio(df, "BTC")
        assert result.signal == "neutral"
        assert result.trend == "balanced"
