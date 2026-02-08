from __future__ import annotations

import logging
from typing import Optional

import pandas as pd
from fastapi import APIRouter, Depends, Query
from fastapi.responses import JSONResponse

from app.dependencies import get_aggregator, get_market_service

logger = logging.getLogger(__name__)
from app.schemas.market import CoinSearchResult, MarketCoinResponse, MarketOverviewResponse, OhlcvEntry, PriceResponse
from app.services.market_service import MarketService

TIMEFRAME_MS = {
    "15m": 900_000, "30m": 1_800_000,
    "1h": 3_600_000, "2h": 7_200_000, "4h": 14_400_000, "12h": 43_200_000,
    "1d": 86_400_000, "3d": 259_200_000, "1w": 604_800_000,
}
TIMEFRAME_PATTERN = "^(15m|30m|1h|2h|4h|12h|1d|3d|1w)$"

router = APIRouter(prefix="/market", tags=["Market"])


@router.get("/prices", response_model=list[PriceResponse])
async def get_prices(
    symbols: str = Query(description="逗號分隔的幣種代號，例如 BTC,ETH,SOL"),
    service: MarketService = Depends(get_market_service),
):
    """取得即時價格"""
    symbol_list = [s.strip().upper() for s in symbols.split(",")]
    prices = await service.get_prices(symbol_list)
    return [PriceResponse(symbol=k, price=v) for k, v in prices.items()]


@router.get("/overview", response_model=MarketOverviewResponse)
async def get_market_overview(
    limit: int = Query(default=20, ge=1, le=250),
    service: MarketService = Depends(get_market_service),
):
    """取得市場總覽（市值排名）"""
    try:
        df = await service.get_market_overview(limit)
        df = df.fillna({"price": 0, "market_cap": 0, "volume_24h": 0, "change_24h": 0})
        coins = [
            MarketCoinResponse(**row)
            for row in df.to_dict("records")
        ]
        return MarketOverviewResponse(coins=coins)
    except Exception as e:
        logger.warning(f"Market overview failed: {e}")
        return MarketOverviewResponse(coins=[])


@router.get("/search", response_model=list[CoinSearchResult])
async def search_coins(
    q: str = Query(min_length=1, max_length=50, description="搜尋關鍵字（幣種代號或名稱）"),
    limit: int = Query(default=20, ge=1, le=50),
    service: MarketService = Depends(get_market_service),
):
    """搜尋幣種（透過 CoinGecko）"""
    results = await service.search_coins(q, limit)
    return [CoinSearchResult(**r) for r in results]


@router.get("/ohlcv/{symbol}", response_model=list[OhlcvEntry])
async def get_ohlcv(
    symbol: str,
    timeframe: str = Query(default="1d", pattern=TIMEFRAME_PATTERN),
    limit: int = Query(default=200, ge=1, le=500),
    before: Optional[int] = Query(default=None, description="Unix timestamp (秒) — 取此時間之前的數據"),
):
    """取得 OHLCV K 線數據"""
    aggregator = get_aggregator()

    since_ms = None
    if before is not None:
        tf_ms = TIMEFRAME_MS.get(timeframe, 86_400_000)
        since_ms = before * 1000 - limit * tf_ms

    try:
        df = await aggregator.get_ohlcv(symbol.upper(), timeframe, limit, since=since_ms)
    except Exception as e:
        logger.warning(f"OHLCV fetch failed for {symbol}: {e}")
        return []

    if df.empty:
        return []

    # 如果指定 before，過濾掉 >= before 的數據
    if before is not None:
        before_dt = pd.Timestamp(before, unit="s", tz="UTC")
        df = df[df.index < before_dt]

    entries = []
    for idx, row in df.iterrows():
        ts = int(pd.Timestamp(idx).timestamp())
        entries.append(OhlcvEntry(
            time=ts,
            open=float(row["open"]),
            high=float(row["high"]),
            low=float(row["low"]),
            close=float(row["close"]),
            volume=float(row["volume"]),
        ))
    return entries
