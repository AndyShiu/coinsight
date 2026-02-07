from __future__ import annotations
import numpy as np
import pandas as pd
import pytest


@pytest.fixture
def sample_ohlcv() -> pd.DataFrame:
    """產生模擬 OHLCV 數據供測試使用"""
    np.random.seed(42)
    n = 100

    # 模擬一個有趨勢的價格序列
    base_price = 50000
    trend = np.linspace(0, 5000, n)
    noise = np.random.normal(0, 500, n)
    close = base_price + trend + noise

    high = close + np.abs(np.random.normal(200, 100, n))
    low = close - np.abs(np.random.normal(200, 100, n))
    open_price = close + np.random.normal(0, 100, n)
    volume = np.random.uniform(100, 1000, n)

    dates = pd.date_range("2024-01-01", periods=n, freq="D", tz="UTC")

    df = pd.DataFrame({
        "open": open_price,
        "high": high,
        "low": low,
        "close": close,
        "volume": volume,
    }, index=dates)
    df.index.name = "timestamp"

    return df


@pytest.fixture
def bearish_ohlcv() -> pd.DataFrame:
    """產生下跌趨勢的 OHLCV 數據"""
    np.random.seed(123)
    n = 100

    base_price = 55000
    trend = np.linspace(0, -10000, n)
    noise = np.random.normal(0, 300, n)
    close = base_price + trend + noise

    high = close + np.abs(np.random.normal(200, 100, n))
    low = close - np.abs(np.random.normal(200, 100, n))
    open_price = close + np.random.normal(0, 100, n)
    volume = np.random.uniform(100, 1000, n)

    dates = pd.date_range("2024-01-01", periods=n, freq="D", tz="UTC")

    df = pd.DataFrame({
        "open": open_price,
        "high": high,
        "low": low,
        "close": close,
        "volume": volume,
    }, index=dates)
    df.index.name = "timestamp"

    return df
