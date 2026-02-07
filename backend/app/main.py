from __future__ import annotations

import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.config import settings
from app.data.cache import cache
from app.data.db_cache import DBCache
from app.db.session import async_session, init_db

logger = logging.getLogger(__name__)

CLEANUP_INTERVAL = 3600  # 每小時清理過期快取


async def _periodic_cleanup(db_cache: DBCache) -> None:
    """背景任務：定期清理過期的 DB 快取 entries。"""
    while True:
        await asyncio.sleep(CLEANUP_INTERVAL)
        await db_cache.cleanup()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 建立資料表
    await init_db()

    # 掛載 L2 DB 快取
    db_cache = DBCache(async_session)
    cache.attach_db(db_cache)

    # 啟動背景清理任務
    cleanup_task = asyncio.create_task(_periodic_cleanup(db_cache))

    yield

    # 關閉時取消背景任務
    cleanup_task.cancel()
    try:
        await cleanup_task
    except asyncio.CancelledError:
        pass


app = FastAPI(
    title=settings.app_name,
    description="加密貨幣現貨持有者分析工具 API",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.api_v1_prefix)


@app.get("/health")
async def health_check():
    return {"status": "ok"}
