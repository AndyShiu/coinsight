from __future__ import annotations
import math
import pandas as pd

from app.core.indicators.base import BaseIndicator, IndicatorResult
from app.core.indicators.oscillator import KDIndicator, RSIIndicator
from app.core.indicators.trend import EMAIndicator, MACDIndicator
from app.core.indicators.volatility import BollingerBandsIndicator
from app.core.indicators.volume import VolumeAnalysis
from app.data.aggregator import DataAggregator
from app.data.cache import cache
from app.services.sentiment_service import SentimentService

import logging

logger = logging.getLogger(__name__)

# 所有可用指標
AVAILABLE_INDICATORS: dict[str, type[BaseIndicator]] = {
    "rsi": RSIIndicator,
    "kd": KDIndicator,
    "macd": MACDIndicator,
    "ema": EMAIndicator,
    "bbands": BollingerBandsIndicator,
    "volume": VolumeAnalysis,
}


class TechnicalService:
    """技術分析服務"""

    def __init__(self, aggregator: DataAggregator):
        self._aggregator = aggregator
        self._sentiment = SentimentService()

    async def _get_ohlcv(self, symbol: str, timeframe: str, limit: int = 200) -> pd.DataFrame:
        cache_key = f"ohlcv:{symbol}:{timeframe}:{limit}"
        cached = await cache.get(cache_key)
        if cached is not None:
            return cached

        df = await self._aggregator.get_ohlcv(symbol, timeframe, limit)
        ttl = 60 if timeframe in ("1h", "4h") else 300
        await cache.set(cache_key, df, ttl=ttl)
        return df

    async def get_indicator(
        self, symbol: str, indicator_name: str, timeframe: str = "1d", **kwargs
    ) -> IndicatorResult:
        indicator_cls = AVAILABLE_INDICATORS.get(indicator_name.lower())
        if indicator_cls is None:
            raise ValueError(
                f"Unknown indicator: {indicator_name}. "
                f"Available: {list(AVAILABLE_INDICATORS.keys())}"
            )

        df = await self._get_ohlcv(symbol, timeframe)
        indicator = indicator_cls(**kwargs)
        return indicator.calculate(df)

    async def get_full_analysis(
        self,
        symbol: str,
        timeframe: str = "1d",
    ) -> dict:
        df = await self._get_ohlcv(symbol, timeframe)

        results: list[IndicatorResult] = []
        for indicator_cls in AVAILABLE_INDICATORS.values():
            try:
                indicator = indicator_cls()
                result = indicator.calculate(df)
                results.append(result)
            except Exception:
                continue

        # 取得衍生品指標（不阻塞技術指標）
        derivatives_signals: list[dict] = []
        try:
            oi = await self._sentiment.get_open_interest(symbol)
            derivatives_signals.append({
                "name": "OI",
                "signal": oi.signal,
                "strength": oi.strength,
                "continuous_score": oi.continuous_score,
                "latest_values": {"OI_value": oi.current_oi_value, "change_pct": oi.change_pct},
                "metadata": {"trend": oi.trend},
            })
        except Exception:
            logger.debug("OI fetch failed for %s", symbol)

        try:
            ls = await self._sentiment.get_long_short_ratio(symbol)
            derivatives_signals.append({
                "name": "LS_Ratio",
                "signal": ls.signal,
                "strength": ls.strength,
                "continuous_score": ls.continuous_score,
                "latest_values": {"ratio": ls.current_ratio, "long_pct": ls.long_pct},
                "metadata": {"trend": ls.trend},
            })
        except Exception:
            logger.debug("LS ratio fetch failed for %s", symbol)

        try:
            tv = await self._sentiment.get_taker_volume(symbol)
            derivatives_signals.append({
                "name": "Taker",
                "signal": tv.signal,
                "strength": tv.strength,
                "continuous_score": tv.continuous_score,
                "latest_values": {"ratio": tv.current_ratio, "buy_vol": tv.buy_vol},
                "metadata": {"pressure": tv.pressure},
            })
        except Exception:
            logger.debug("Taker volume fetch failed for %s", symbol)

        # ── 分組加權綜合評分（連續分數版）──
        # 使用各指標的 continuous_score（-1.0 ~ +1.0）取代離散 signal×strength
        GROUP_WEIGHTS = {
            "momentum": 0.25,    # RSI, KD, MACD
            "trend": 0.20,       # EMA
            "volatility": 0.15,  # BBANDS
            "volume": 0.10,      # Volume
            "derivatives": 0.30, # OI, LS_Ratio, Taker
        }
        INDICATOR_GROUP = {
            "RSI": "momentum",
            "KD": "momentum",
            "MACD": "momentum",
            "EMA": "trend",
            "BBANDS": "volatility",
            "Volume": "volume",
            "OI": "derivatives",
            "LS_Ratio": "derivatives",
            "Taker": "derivatives",
        }

        # 收集每組的 continuous_score
        group_values: dict[str, list[float]] = {g: [] for g in GROUP_WEIGHTS}
        all_scores: list[float] = []

        for r in results:
            group = INDICATOR_GROUP.get(r.name)
            if group:
                group_values[group].append(r.continuous_score)
                all_scores.append(r.continuous_score)

        for ds in derivatives_signals:
            group = INDICATOR_GROUP.get(ds["name"])
            if group:
                cs = ds.get("continuous_score", 0.0)
                group_values[group].append(cs)
                all_scores.append(cs)

        # 綜合評分 = Σ(組內平均 × 群組權重)
        overall_score = 0.0
        for group, weight in GROUP_WEIGHTS.items():
            values = group_values[group]
            if values:
                group_avg = sum(values) / len(values)
                overall_score += group_avg * weight

        if overall_score > 0.2:
            overall_signal = "bullish"
        elif overall_score < -0.2:
            overall_signal = "bearish"
        else:
            overall_signal = "neutral"

        # ── 一致性指標 (Consensus) ──
        # consensus = 1 - std(all_scores)
        # std=0 → 所有指標完全一致 → consensus=1.0
        # std≈1 → 指標極度分歧 → consensus≈0.0
        if len(all_scores) >= 2:
            mean_s = sum(all_scores) / len(all_scores)
            variance = sum((s - mean_s) ** 2 for s in all_scores) / len(all_scores)
            std_s = math.sqrt(variance)
            consensus = round(max(1.0 - std_s, 0.0), 4)
        else:
            consensus = 1.0

        all_indicators = [r.to_dict() for r in results] + derivatives_signals

        return {
            "symbol": symbol.upper(),
            "timeframe": timeframe,
            "indicators": all_indicators,
            "overall_signal": overall_signal,
            "overall_score": round(overall_score, 4),
            "consensus": consensus,
        }

    async def get_indicator_series(
        self, symbol: str, indicator_name: str, timeframe: str = "1d", **kwargs
    ) -> dict:
        """取得指標完整時間序列（圖表覆蓋用）"""
        indicator_cls = AVAILABLE_INDICATORS.get(indicator_name.lower())
        if indicator_cls is None:
            raise ValueError(
                f"Unknown indicator: {indicator_name}. "
                f"Available: {list(AVAILABLE_INDICATORS.keys())}"
            )

        df = await self._get_ohlcv(symbol, timeframe)
        indicator = indicator_cls(**kwargs)
        result = indicator.calculate(df)

        lines: dict[str, list[dict]] = {}
        for line_name, series in result.values.items():
            points = []
            for idx, val in series.items():
                # idx 可能是 pd.Timestamp, datetime, str, 或 int
                ts = int(pd.Timestamp(idx).timestamp())
                fval = float(val) if pd.notna(val) and not (isinstance(val, float) and (math.isnan(val) or math.isinf(val))) else None
                points.append({"time": ts, "value": fval})
            lines[line_name] = points

        return {
            "symbol": symbol.upper(),
            "timeframe": timeframe,
            "indicator": {"name": result.name, "lines": lines},
        }

    async def get_support_resistance(
        self, symbol: str, timeframe: str = "1d"
    ) -> dict:
        """用 Pivot Points 計算支撐/壓力位"""
        df = await self._get_ohlcv(symbol, timeframe)
        recent = df.tail(20)
        high = float(recent["high"].max())
        low = float(recent["low"].min())
        close = float(df["close"].iloc[-1])

        pp = (high + low + close) / 3
        r1 = 2 * pp - low
        r2 = pp + (high - low)
        s1 = 2 * pp - high
        s2 = pp - (high - low)

        # 根據價格大小動態決定小數位數
        def _precision(price: float) -> int:
            if price == 0:
                return 2
            abs_p = abs(price)
            if abs_p >= 1:
                return 2
            # 小數幣：保留到有效數字 +2 位
            import math
            return max(2, -int(math.floor(math.log10(abs_p))) + 2)

        ndigits = _precision(close)

        return {
            "symbol": symbol.upper(),
            "timeframe": timeframe,
            "levels": [
                {"price": round(s2, ndigits), "label": "S2"},
                {"price": round(s1, ndigits), "label": "S1"},
                {"price": round(pp, ndigits), "label": "PP"},
                {"price": round(r1, ndigits), "label": "R1"},
                {"price": round(r2, ndigits), "label": "R2"},
            ],
        }
