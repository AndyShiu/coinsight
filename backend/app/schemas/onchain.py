from __future__ import annotations

from typing import Dict, List, Optional

from pydantic import BaseModel


class OnchainEntry(BaseModel):
    timestamp: str
    value: float


class ExchangeFlowResponse(BaseModel):
    asset: str
    latest_netflow: float
    avg_netflow_7d: float
    signal: str
    strength: float
    trend: str


class MVRVResponse(BaseModel):
    asset: str
    current_mvrv: float
    signal: str
    strength: float
    zone: str


class NUPLResponse(BaseModel):
    asset: str
    current_nupl: float
    signal: str
    strength: float
    phase: str


class BTCNetworkStats(BaseModel):
    hash_rate: Optional[float] = None
    difficulty: Optional[float] = None
    active_addresses: Optional[float] = None
    transaction_count: Optional[float] = None
    mempool_size: Optional[float] = None
