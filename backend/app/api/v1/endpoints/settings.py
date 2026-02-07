from __future__ import annotations

from fastapi import APIRouter

from app.db.session import async_session
from app.schemas.settings import (
    ApiKeysResponse,
    ApiKeysUpdateRequest,
    ApiKeyStatus,
    WatchlistResponse,
    WatchlistUpdateRequest,
    DashboardPinsResponse,
    DashboardPinsUpdateRequest,
)
from app.services.settings_service import SettingsService

router = APIRouter(prefix="/settings", tags=["settings"])

_service = SettingsService(async_session)


@router.get("/api-keys", response_model=ApiKeysResponse)
async def get_api_keys():
    """取得所有 API key 狀態（遮罩顯示）"""
    statuses = await _service.get_all_api_keys_status()
    return ApiKeysResponse(keys=[ApiKeyStatus(**s) for s in statuses])


@router.put("/api-keys", response_model=ApiKeysResponse)
async def update_api_keys(req: ApiKeysUpdateRequest):
    """批量更新 API key（空字串或 null 的欄位不更新）"""
    updates = req.model_dump(exclude_none=True)
    for name, value in updates.items():
        if value:  # 忽略空字串
            await _service.set_api_key(name, value)

    statuses = await _service.get_all_api_keys_status()
    return ApiKeysResponse(keys=[ApiKeyStatus(**s) for s in statuses])


@router.delete("/api-keys/{name}")
async def delete_api_key(name: str):
    """刪除指定 API key"""
    await _service.delete_api_key(name)
    return {"status": "ok", "deleted": name}


# ---- Watchlist ----

@router.get("/watchlist", response_model=WatchlistResponse)
async def get_watchlist():
    """取得關注清單"""
    symbols = await _service.get_watchlist()
    return WatchlistResponse(symbols=symbols)


@router.put("/watchlist", response_model=WatchlistResponse)
async def update_watchlist(req: WatchlistUpdateRequest):
    """更新關注清單（整體替換）"""
    symbols = await _service.set_watchlist(req.symbols)
    return WatchlistResponse(symbols=symbols)


# ---- Dashboard Pins ----

@router.get("/dashboard-pins", response_model=DashboardPinsResponse)
async def get_dashboard_pins():
    """取得 Dashboard 置頂幣種"""
    symbols = await _service.get_dashboard_pins()
    return DashboardPinsResponse(symbols=symbols)


@router.put("/dashboard-pins", response_model=DashboardPinsResponse)
async def update_dashboard_pins(req: DashboardPinsUpdateRequest):
    """更新 Dashboard 置頂幣種"""
    symbols = await _service.set_dashboard_pins(req.symbols)
    return DashboardPinsResponse(symbols=symbols)
