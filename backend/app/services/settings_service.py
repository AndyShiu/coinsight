from __future__ import annotations

import json
import logging
import time
from typing import Any, Optional

from sqlalchemy import delete
from sqlalchemy.dialects.sqlite import insert as sqlite_insert
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.config import settings
from app.db.models.app_setting import AppSetting

logger = logging.getLogger(__name__)

# 可管理的 API key 定義
API_KEY_DEFS = {
    "binance_api_key": {
        "label": "Binance API Key",
        "description": "幣安 API Key — 提升合約數據請求限額 (免費申請)",
    },
    "binance_api_secret": {
        "label": "Binance API Secret",
        "description": "幣安 API Secret — 搭配 API Key 使用",
    },
    "coingecko_api_key": {
        "label": "CoinGecko",
        "description": "CoinGecko Pro API — 解除速率限制，提升市場數據品質",
    },
    "glassnode_api_key": {
        "label": "Glassnode",
        "description": "鏈上數據 — MVRV、NUPL、交易所流入流出 ($29+/月)",
    },
    "coinglass_api_key": {
        "label": "CoinGlass",
        "description": "進階資金費率 — 多交易所費率對比 (免費申請)",
    },
}


def _mask_value(value: str) -> str:
    """遮罩 API key，僅顯示後 4 碼。"""
    if len(value) <= 4:
        return "****"
    return "*" * (len(value) - 4) + value[-4:]


class SettingsService:
    """應用程式設定服務 — 管理 API key 與使用者偏好"""

    DEFAULT_WATCHLIST = ["BTC", "ETH", "SOL", "BNB", "XRP"]
    DEFAULT_DASHBOARD_PINS = ["BTC", "ETH", "SOL"]

    def __init__(self, session_factory: async_sessionmaker[AsyncSession]):
        self._sf = session_factory

    async def get_api_key(self, name: str) -> Optional[str]:
        """取得 API key：先查 DB，fallback 到 .env config。"""
        try:
            async with self._sf() as session:
                row = await session.get(AppSetting, f"apikey:{name}")
                if row is not None:
                    return row.value
        except Exception:
            logger.warning("Failed to read API key from DB: %s", name, exc_info=True)

        # Fallback: .env config
        return getattr(settings, name, None)

    async def set_api_key(self, name: str, value: str) -> None:
        """寫入 API key 到 DB (upsert)。"""
        if name not in API_KEY_DEFS:
            raise ValueError(f"Unknown API key: {name}")

        try:
            async with self._sf() as session:
                stmt = sqlite_insert(AppSetting).values(
                    key=f"apikey:{name}",
                    value=value,
                    updated_at=time.time(),
                )
                stmt = stmt.on_conflict_do_update(
                    index_elements=[AppSetting.key],
                    set_={
                        "value": stmt.excluded.value,
                        "updated_at": stmt.excluded.updated_at,
                    },
                )
                await session.execute(stmt)
                await session.commit()
                logger.info("API key updated: %s", name)
        except Exception:
            logger.error("Failed to save API key: %s", name, exc_info=True)
            raise

    async def delete_api_key(self, name: str) -> None:
        """從 DB 刪除 API key。"""
        try:
            async with self._sf() as session:
                await session.execute(
                    delete(AppSetting).where(AppSetting.key == f"apikey:{name}")
                )
                await session.commit()
                logger.info("API key deleted: %s", name)
        except Exception:
            logger.error("Failed to delete API key: %s", name, exc_info=True)
            raise

    async def get_all_api_keys_status(self) -> list[dict]:
        """取得所有 API key 的狀態（遮罩顯示）。"""
        result = []
        for name, info in API_KEY_DEFS.items():
            value = await self.get_api_key(name)
            result.append({
                "name": name,
                "label": info["label"],
                "description": info["description"],
                "is_set": value is not None and len(value) > 0,
                "masked_value": _mask_value(value) if value else None,
            })
        return result

    # ---- 使用者偏好 (JSON stored in app_settings with "pref:" prefix) ----

    async def get_preference(self, name: str, default: Any = None) -> Any:
        """取得使用者偏好設定（JSON 值）。"""
        try:
            async with self._sf() as session:
                row = await session.get(AppSetting, f"pref:{name}")
                if row is not None:
                    return json.loads(row.value)
        except Exception:
            logger.warning("Failed to read preference: %s", name, exc_info=True)
        return default

    async def set_preference(self, name: str, value: Any) -> None:
        """寫入使用者偏好設定（JSON upsert）。"""
        try:
            async with self._sf() as session:
                stmt = sqlite_insert(AppSetting).values(
                    key=f"pref:{name}",
                    value=json.dumps(value),
                    updated_at=time.time(),
                )
                stmt = stmt.on_conflict_do_update(
                    index_elements=[AppSetting.key],
                    set_={
                        "value": stmt.excluded.value,
                        "updated_at": stmt.excluded.updated_at,
                    },
                )
                await session.execute(stmt)
                await session.commit()
        except Exception:
            logger.error("Failed to save preference: %s", name, exc_info=True)
            raise

    @staticmethod
    def _clean_symbols(symbols: list[str]) -> list[str]:
        """去重、大寫、保持順序。"""
        seen: set[str] = set()
        cleaned: list[str] = []
        for s in symbols:
            upper = s.upper().strip()
            if upper and upper not in seen:
                seen.add(upper)
                cleaned.append(upper)
        return cleaned

    async def get_watchlist(self) -> list[str]:
        return await self.get_preference("watchlist", self.DEFAULT_WATCHLIST)

    async def set_watchlist(self, symbols: list[str]) -> list[str]:
        cleaned = self._clean_symbols(symbols)
        await self.set_preference("watchlist", cleaned)
        # 同步清理 dashboard pins（移除不在新 watchlist 中的項目）
        pins = await self.get_dashboard_pins()
        valid_pins = [p for p in pins if p in cleaned]
        if len(valid_pins) != len(pins):
            await self.set_preference("dashboard_pins", valid_pins)
        return cleaned

    async def get_dashboard_pins(self) -> list[str]:
        return await self.get_preference("dashboard_pins", self.DEFAULT_DASHBOARD_PINS)

    async def set_dashboard_pins(self, symbols: list[str]) -> list[str]:
        cleaned = self._clean_symbols(symbols)
        await self.set_preference("dashboard_pins", cleaned)
        return cleaned
