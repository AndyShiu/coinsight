from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, Query
from fastapi.responses import JSONResponse

from app.api.v1.endpoints.market import TIMEFRAME_PATTERN
from app.dependencies import get_technical_service
from app.schemas.technical import (
    IndicatorSeriesResponse,
    SingleIndicatorResponse,
    SupportResistanceResponse,
    TechnicalAnalysisResponse,
)
from app.services.technical_service import TechnicalService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/technical", tags=["Technical Analysis"])


@router.get("/{symbol}/analysis", response_model=TechnicalAnalysisResponse)
async def get_full_analysis(
    symbol: str,
    timeframe: str = Query(default="1d", pattern=TIMEFRAME_PATTERN),
    service: TechnicalService = Depends(get_technical_service),
):
    """取得完整技術分析（所有指標）"""
    try:
        result = await service.get_full_analysis(symbol, timeframe)
    except Exception as e:
        logger.warning(f"Technical analysis failed for {symbol}: {e}")
        return JSONResponse(status_code=422, content={"detail": f"No data available for {symbol}"})
    return TechnicalAnalysisResponse(**result)


@router.get("/{symbol}/series/{indicator_name}", response_model=IndicatorSeriesResponse)
async def get_indicator_series(
    symbol: str,
    indicator_name: str,
    timeframe: str = Query(default="1d", pattern=TIMEFRAME_PATTERN),
    service: TechnicalService = Depends(get_technical_service),
):
    """取得指標完整時間序列（K 線圖覆蓋用）"""
    result = await service.get_indicator_series(symbol, indicator_name, timeframe)
    return IndicatorSeriesResponse(**result)


@router.get("/{symbol}/support-resistance", response_model=SupportResistanceResponse)
async def get_support_resistance(
    symbol: str,
    timeframe: str = Query(default="1d", pattern=TIMEFRAME_PATTERN),
    service: TechnicalService = Depends(get_technical_service),
):
    """取得支撐/壓力位（Pivot Points）"""
    try:
        result = await service.get_support_resistance(symbol, timeframe)
    except Exception as e:
        logger.warning(f"Support/resistance failed for {symbol}: {e}")
        return JSONResponse(status_code=422, content={"detail": f"No data available for {symbol}"})
    return SupportResistanceResponse(**result)


@router.get("/{symbol}/{indicator_name}", response_model=SingleIndicatorResponse)
async def get_single_indicator(
    symbol: str,
    indicator_name: str,
    timeframe: str = Query(default="1d", pattern=TIMEFRAME_PATTERN),
    service: TechnicalService = Depends(get_technical_service),
):
    """取得單一指標分析（rsi, macd, kd, ema, bbands, volume）"""
    result = await service.get_indicator(symbol, indicator_name, timeframe)
    return SingleIndicatorResponse(
        symbol=symbol.upper(),
        timeframe=timeframe,
        indicator=result.to_dict(),
    )
