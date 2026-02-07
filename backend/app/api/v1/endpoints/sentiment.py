from __future__ import annotations

from fastapi import APIRouter, Query

from app.schemas.sentiment import (
    FearGreedEntry,
    FearGreedResponse,
    FundingRateEntry,
    FundingRateResponse,
    OpenInterestEntry,
    OpenInterestResponse,
    LongShortRatioEntry,
    LongShortRatioResponse,
    TakerVolumeEntry,
    TakerVolumeResponse,
)
from app.services.sentiment_service import SentimentService

router = APIRouter(prefix="/sentiment", tags=["Market Sentiment"])

_service = SentimentService()


@router.get("/fear-greed", response_model=FearGreedResponse)
async def get_fear_greed_index(
    limit: int = Query(default=30, ge=1, le=365, description="歷史天數"),
):
    """取得恐懼貪婪指數分析"""
    result = await _service.get_fear_greed(limit)

    history = []
    for _, row in result.history.iterrows():
        history.append(FearGreedEntry(
            timestamp=str(row["timestamp"]),
            value=int(row["value"]),
            classification=str(row["classification"]),
        ))

    return FearGreedResponse(
        current_value=result.current_value,
        current_class=result.current_class,
        signal=result.signal,
        strength=result.strength,
        trend=result.trend,
        avg_7d=result.avg_7d,
        avg_30d=result.avg_30d,
        history=history,
    )


@router.get("/funding-rates", response_model=FundingRateResponse)
async def get_funding_rates(
    symbol: str = Query(default="BTC", description="幣種代號"),
):
    """取得各交易所資金費率分析"""
    result = await _service.get_funding_rates(symbol)

    exchanges = []
    for _, row in result.exchanges.iterrows():
        exchanges.append(FundingRateEntry(
            exchange=str(row.get("exchange", "")),
            symbol=str(row.get("symbol", symbol)),
            rate=float(row.get("rate", 0)),
            predicted_rate=float(row.get("predicted_rate", 0)) if "predicted_rate" in row else None,
        ))

    return FundingRateResponse(
        symbol=result.symbol,
        avg_rate=result.avg_rate,
        max_rate=result.max_rate,
        min_rate=result.min_rate,
        signal=result.signal,
        strength=result.strength,
        exchanges=exchanges,
    )


@router.get("/open-interest", response_model=OpenInterestResponse)
async def get_open_interest(
    symbol: str = Query(default="BTC", description="幣種代號"),
    period: str = Query(default="1h", description="K 線週期"),
    limit: int = Query(default=30, ge=1, le=500, description="歷史筆數"),
):
    """取得未平倉合約分析"""
    result = await _service.get_open_interest(symbol, period, limit)

    history = []
    for _, row in result.history.iterrows():
        history.append(OpenInterestEntry(
            timestamp=int(row["timestamp"]),
            open_interest=float(row["open_interest"]),
            open_interest_value=float(row["open_interest_value"]),
        ))

    return OpenInterestResponse(
        symbol=result.symbol,
        current_oi=result.current_oi,
        current_oi_value=result.current_oi_value,
        change_pct=result.change_pct,
        signal=result.signal,
        strength=result.strength,
        trend=result.trend,
        history=history,
    )


@router.get("/long-short-ratio", response_model=LongShortRatioResponse)
async def get_long_short_ratio(
    symbol: str = Query(default="BTC", description="幣種代號"),
    period: str = Query(default="1h", description="K 線週期"),
    limit: int = Query(default=30, ge=1, le=500, description="歷史筆數"),
):
    """取得多空比分析（頂級交易者）"""
    result = await _service.get_long_short_ratio(symbol, period, limit)

    history = []
    for _, row in result.history.iterrows():
        history.append(LongShortRatioEntry(
            timestamp=int(row["timestamp"]),
            long_short_ratio=float(row["long_short_ratio"]),
            long_account=float(row["long_account"]),
            short_account=float(row["short_account"]),
        ))

    return LongShortRatioResponse(
        symbol=result.symbol,
        current_ratio=result.current_ratio,
        long_pct=result.long_pct,
        short_pct=result.short_pct,
        avg_ratio=result.avg_ratio,
        signal=result.signal,
        strength=result.strength,
        trend=result.trend,
        history=history,
    )


@router.get("/taker-volume", response_model=TakerVolumeResponse)
async def get_taker_volume(
    symbol: str = Query(default="BTC", description="幣種代號"),
    period: str = Query(default="1h", description="K 線週期"),
    limit: int = Query(default=30, ge=1, le=500, description="歷史筆數"),
):
    """取得主動買賣量比分析"""
    result = await _service.get_taker_volume(symbol, period, limit)

    history = []
    for _, row in result.history.iterrows():
        history.append(TakerVolumeEntry(
            timestamp=int(row["timestamp"]),
            buy_sell_ratio=float(row["buy_sell_ratio"]),
            buy_vol=float(row["buy_vol"]),
            sell_vol=float(row["sell_vol"]),
        ))

    return TakerVolumeResponse(
        symbol=result.symbol,
        current_ratio=result.current_ratio,
        buy_vol=result.buy_vol,
        sell_vol=result.sell_vol,
        avg_ratio=result.avg_ratio,
        signal=result.signal,
        strength=result.strength,
        pressure=result.pressure,
        history=history,
    )
