from __future__ import annotations

import importlib
import json
import logging
import time
from dataclasses import fields as dataclass_fields
from typing import Any, Optional

import pandas as pd

from app.data.db_cache import DBCache

logger = logging.getLogger(__name__)

# ── L2 DB max_age 設定 (秒) ─────────────────────────────────────────
# 依 cache key prefix 決定 DB 層的過期時間
DB_MAX_AGE: dict[str, float] = {
    "prices":            300,      # 5 分鐘
    "market_overview":   600,      # 10 分鐘
    "ohlcv":             3600,     # 1 小時 (預設，由 timeframe 覆蓋)
    "fear_greed":        86400,    # 24 小時
    "funding":           28800,    # 8 小時
    "exchange_flow":     86400,    # 24 小時
    "mvrv":              86400,    # 24 小時
    "nupl":              86400,    # 24 小時
    "btc_network_stats": 7200,     # 2 小時
    "open_interest":     300,      # 5 分鐘
    "long_short_ratio":  300,      # 5 分鐘
    "taker_volume":      300,      # 5 分鐘
}

OHLCV_DB_MAX_AGE: dict[str, float] = {
    "1h": 900,     # 15 分鐘
    "4h": 3600,    # 1 小時
    "1d": 14400,   # 4 小時
    "1w": 43200,   # 12 小時
}


def _resolve_db_max_age(key: str) -> float:
    """根據 cache key 決定 DB 層 max_age。"""
    if key.startswith("ohlcv:"):
        parts = key.split(":")
        if len(parts) >= 3:
            return OHLCV_DB_MAX_AGE.get(parts[2], 3600)
    prefix = key.split(":")[0]
    return DB_MAX_AGE.get(prefix, 3600)


# ── 序列化/反序列化 ──────────────────────────────────────────────────

def _serialize(value: Any) -> str:
    """將 Python 物件序列化為 JSON 字串。支援 DataFrame 和 dataclass。"""
    if isinstance(value, pd.DataFrame):
        payload = {"__type": "dataframe", "data": value.to_dict(orient="split")}
        return json.dumps(payload, default=str)

    if hasattr(value, "__dataclass_fields__"):
        field_dict: dict[str, Any] = {}
        for f in dataclass_fields(value):
            v = getattr(value, f.name)
            if isinstance(v, pd.DataFrame):
                field_dict[f.name] = {"__type": "dataframe", "data": v.to_dict(orient="split")}
            else:
                field_dict[f.name] = v
        payload = {
            "__type": "dataclass",
            "module": type(value).__module__,
            "class": type(value).__qualname__,
            "fields": field_dict,
        }
        return json.dumps(payload, default=str)

    return json.dumps(value, default=str)


def _deserialize(raw: str) -> Any:
    """將 JSON 字串反序列化回 Python 物件。"""
    obj = json.loads(raw)
    if not isinstance(obj, dict):
        return obj

    obj_type = obj.get("__type")
    if obj_type == "dataframe":
        return pd.DataFrame(**obj["data"])

    if obj_type == "dataclass":
        mod = importlib.import_module(obj["module"])
        cls = getattr(mod, obj["class"])
        restored: dict[str, Any] = {}
        for k, v in obj["fields"].items():
            if isinstance(v, dict) and v.get("__type") == "dataframe":
                restored[k] = pd.DataFrame(**v["data"])
            else:
                restored[k] = v
        return cls(**restored)

    return obj


# ── L1: InMemoryCache ────────────────────────────────────────────────

class InMemoryCache:
    """L1: 快速記憶體快取 (TTL 式)"""

    def __init__(self, default_ttl: int = 300):
        self._store: dict[str, tuple[Any, float]] = {}
        self._default_ttl = default_ttl

    def get(self, key: str) -> Optional[Any]:
        entry = self._store.get(key)
        if entry is None:
            return None
        value, expires_at = entry
        if time.time() > expires_at:
            del self._store[key]
            return None
        return value

    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        expires_at = time.time() + (ttl if ttl is not None else self._default_ttl)
        self._store[key] = (value, expires_at)

    def delete(self, key: str) -> None:
        self._store.pop(key, None)

    def clear(self) -> None:
        self._store.clear()


# ── TieredCache: L1 + L2 ─────────────────────────────────────────────

class TieredCache:
    """雙層快取：L1 (記憶體) + L2 (SQLite)

    - get/set 為 async，服務層需用 await 呼叫
    - L2 未 attach 時等同純 L1
    """

    def __init__(self, default_ttl: int = 300):
        self._l1 = InMemoryCache(default_ttl)
        self._l2: Optional[DBCache] = None

    def attach_db(self, db_cache: DBCache) -> None:
        """啟動時 attach L2 DB 快取。"""
        self._l2 = db_cache
        logger.info("L2 DB cache attached")

    async def get(self, key: str) -> Optional[Any]:
        # L1: 同步快速路徑
        value = self._l1.get(key)
        if value is not None:
            return value

        # L2: 非同步 DB 查詢
        if self._l2 is not None:
            raw = await self._l2.get(key)
            if raw is not None:
                try:
                    value = _deserialize(raw)
                except Exception:
                    logger.warning("Deserialize failed: key=%s", key, exc_info=True)
                    return None
                # 回填 L1
                self._l1.set(key, value)
                return value

        return None

    async def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        # 寫入 L1
        self._l1.set(key, value, ttl)

        # 寫入 L2
        if self._l2 is not None:
            db_max_age = _resolve_db_max_age(key)
            try:
                serialized = _serialize(value)
            except Exception:
                logger.warning("Serialize failed: key=%s", key, exc_info=True)
                return
            await self._l2.set(key, serialized, db_max_age)

    def delete(self, key: str) -> None:
        self._l1.delete(key)

    def clear(self) -> None:
        self._l1.clear()


# 全域快取實例
cache = TieredCache()
