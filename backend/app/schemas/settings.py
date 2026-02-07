from __future__ import annotations

from typing import Optional

from pydantic import BaseModel


class ApiKeyStatus(BaseModel):
    """單一 API key 的狀態"""
    name: str
    label: str
    description: str
    is_set: bool
    masked_value: Optional[str] = None  # e.g. "****a1b2"


class ApiKeysResponse(BaseModel):
    """所有 API key 狀態"""
    keys: list[ApiKeyStatus]


class ApiKeysUpdateRequest(BaseModel):
    """更新 API key 的請求"""
    binance_api_key: Optional[str] = None
    binance_api_secret: Optional[str] = None
    coingecko_api_key: Optional[str] = None
    glassnode_api_key: Optional[str] = None
    coinglass_api_key: Optional[str] = None


class WatchlistResponse(BaseModel):
    """關注清單"""
    symbols: list[str]


class WatchlistUpdateRequest(BaseModel):
    """更新關注清單"""
    symbols: list[str]


class DashboardPinsResponse(BaseModel):
    """Dashboard 置頂幣種"""
    symbols: list[str]


class DashboardPinsUpdateRequest(BaseModel):
    """更新 Dashboard 置頂"""
    symbols: list[str]
