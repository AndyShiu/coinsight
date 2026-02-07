from __future__ import annotations

import pandas as pd

from app.core.sentiment.open_interest import analyze_open_interest


class TestOpenInterestAnalysis:
    def test_empty_df(self):
        df = pd.DataFrame()
        result = analyze_open_interest(df, "BTC")
        assert result.signal == "neutral"
        assert result.strength == 0
        assert result.trend == "stable"

    def test_rising_oi(self):
        rows = [
            {"timestamp": i, "open_interest": 1000 + i * 10,
             "open_interest_value": 50_000_000 + i * 1_000_000}
            for i in range(30)
        ]
        df = pd.DataFrame(rows)
        result = analyze_open_interest(df, "BTC")
        assert result.trend == "rising"
        assert result.change_pct > 0

    def test_falling_oi(self):
        rows = [
            {"timestamp": i, "open_interest": 1000 - i * 10,
             "open_interest_value": 50_000_000 - i * 1_000_000}
            for i in range(30)
        ]
        df = pd.DataFrame(rows)
        result = analyze_open_interest(df, "BTC")
        assert result.trend == "falling"
        assert result.change_pct < 0

    def test_extreme_spike_bearish(self):
        rows = [
            {"timestamp": 0, "open_interest": 1000,
             "open_interest_value": 50_000_000},
            {"timestamp": 1, "open_interest": 1200,
             "open_interest_value": 60_000_000},
        ]
        df = pd.DataFrame(rows)
        result = analyze_open_interest(df, "BTC")
        assert result.change_pct == 20.0
        assert result.signal == "bearish"
        assert result.strength > 0

    def test_stable_oi_neutral(self):
        rows = [
            {"timestamp": i, "open_interest": 1000,
             "open_interest_value": 50_000_000}
            for i in range(10)
        ]
        df = pd.DataFrame(rows)
        result = analyze_open_interest(df, "BTC")
        assert result.signal == "neutral"
        assert result.trend == "stable"
