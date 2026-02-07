from __future__ import annotations

from fastapi import APIRouter, Query

from app.schemas.onchain import (
    BTCNetworkStats,
    ExchangeFlowResponse,
    MVRVResponse,
    NUPLResponse,
)
from app.services.onchain_service import OnchainService

router = APIRouter(prefix="/onchain", tags=["On-chain Data"])

_service = OnchainService()


@router.get("/{asset}/exchange-flow", response_model=ExchangeFlowResponse)
async def get_exchange_flow(asset: str):
    """取得交易所淨流入/流出分析 (需要 Glassnode API key)"""
    result = await _service.get_exchange_flow(asset)
    return ExchangeFlowResponse(
        asset=result.asset,
        latest_netflow=result.latest_netflow,
        avg_netflow_7d=result.avg_netflow_7d,
        signal=result.signal,
        strength=result.strength,
        trend=result.trend,
    )


@router.get("/{asset}/mvrv", response_model=MVRVResponse)
async def get_mvrv(asset: str):
    """取得 MVRV 比率分析 (需要 Glassnode API key)"""
    result = await _service.get_mvrv(asset)
    return MVRVResponse(
        asset=result.asset,
        current_mvrv=result.current_mvrv,
        signal=result.signal,
        strength=result.strength,
        zone=result.zone,
    )


@router.get("/{asset}/nupl", response_model=NUPLResponse)
async def get_nupl(asset: str):
    """取得 NUPL 分析 (需要 Glassnode API key)"""
    result = await _service.get_nupl(asset)
    return NUPLResponse(
        asset=result.asset,
        current_nupl=result.current_nupl,
        signal=result.signal,
        strength=result.strength,
        phase=result.phase,
    )


@router.get("/btc/network", response_model=BTCNetworkStats)
async def get_btc_network_stats():
    """取得 BTC 網路統計 (免費)"""
    stats = await _service.get_btc_network_stats()
    return BTCNetworkStats(**stats)
