from __future__ import annotations
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any

import math

import pandas as pd


def _safe_float(val) -> float | None:
    """將值轉為安全的 float，NaN/Inf 轉為 None"""
    if val is None:
        return None
    f = float(val)
    if math.isnan(f) or math.isinf(f):
        return None
    return round(f, 4)


def _safe_metadata(meta: dict) -> dict:
    """清理 metadata 中的 NaN/Inf"""
    cleaned = {}
    for k, v in meta.items():
        if isinstance(v, float):
            if math.isnan(v) or math.isinf(v):
                cleaned[k] = None
            else:
                cleaned[k] = v
        else:
            cleaned[k] = v
    return cleaned


@dataclass
class IndicatorResult:
    """指標計算結果"""

    name: str
    values: dict[str, pd.Series]  # 多條輸出線 (如 MACD 有 macd, signal, histogram)
    signal: str  # "bullish" | "bearish" | "neutral"
    strength: float  # 0.0 ~ 1.0
    continuous_score: float = 0.0  # -1.0 (極度看空) ~ +1.0 (極度看多)
    metadata: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict:
        """轉為可序列化的 dict"""
        return {
            "name": self.name,
            "signal": self.signal,
            "strength": round(self.strength, 4),
            "continuous_score": round(self.continuous_score, 4),
            "metadata": _safe_metadata(self.metadata),
            "latest_values": {
                k: _safe_float(v.iloc[-1]) if len(v) > 0 else None
                for k, v in self.values.items()
            },
        }


class BaseIndicator(ABC):
    """技術指標基底類別"""

    @property
    @abstractmethod
    def name(self) -> str:
        ...

    @abstractmethod
    def calculate(self, df: pd.DataFrame) -> IndicatorResult:
        """計算指標

        Args:
            df: 必須包含 open, high, low, close, volume 欄位的 DataFrame

        Returns:
            IndicatorResult
        """
        ...
