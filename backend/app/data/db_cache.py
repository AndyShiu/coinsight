from __future__ import annotations

import logging
import time
from typing import Optional

from sqlalchemy import delete
from sqlalchemy.dialects.sqlite import insert as sqlite_insert
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.db.models.api_cache import ApiCache

logger = logging.getLogger(__name__)


class DBCache:
    """L2 持久化快取 — SQLite via async SQLAlchemy"""

    def __init__(self, session_factory: async_sessionmaker[AsyncSession]):
        self._sf = session_factory

    async def get(self, key: str) -> Optional[str]:
        """取得快取。回傳 JSON 字串或 None（未命中/過期）。"""
        try:
            async with self._sf() as session:
                row = await session.get(ApiCache, key)
                if row is None:
                    return None
                if time.time() > row.created_at + row.max_age:
                    await session.delete(row)
                    await session.commit()
                    logger.debug("DB cache expired: %s", key)
                    return None
                logger.debug("DB cache hit: %s", key)
                return row.value_json
        except Exception:
            logger.warning("DB cache get failed: key=%s", key, exc_info=True)
            return None

    async def set(self, key: str, value_json: str, max_age: float) -> None:
        """寫入/更新快取 (upsert)。"""
        try:
            async with self._sf() as session:
                stmt = sqlite_insert(ApiCache).values(
                    key=key,
                    value_json=value_json,
                    created_at=time.time(),
                    max_age=max_age,
                )
                stmt = stmt.on_conflict_do_update(
                    index_elements=[ApiCache.key],
                    set_={
                        "value_json": stmt.excluded.value_json,
                        "created_at": stmt.excluded.created_at,
                        "max_age": stmt.excluded.max_age,
                    },
                )
                await session.execute(stmt)
                await session.commit()
        except Exception:
            logger.warning("DB cache set failed: key=%s", key, exc_info=True)

    async def cleanup(self) -> int:
        """刪除所有過期 entries，回傳刪除數量。"""
        try:
            async with self._sf() as session:
                now = time.time()
                result = await session.execute(
                    delete(ApiCache).where(
                        ApiCache.created_at + ApiCache.max_age < now
                    )
                )
                await session.commit()
                count = result.rowcount
                if count > 0:
                    logger.info("DB cache cleanup: removed %d stale entries", count)
                return count
        except Exception:
            logger.warning("DB cache cleanup failed", exc_info=True)
            return 0
