from __future__ import annotations

import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.responses import Response

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

class CatchAllMiddleware(BaseHTTPMiddleware):
    """捕獲所有未處理的異常，回傳 JSON 500。"""
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        try:
            return await call_next(request)
        except Exception as exc:
            logger.error(f"Unhandled error: {exc}", exc_info=True)
            return JSONResponse(status_code=500, content={"detail": "Internal server error"})


# Starlette middleware 是 LIFO：後加的在外層
# CatchAllMiddleware 先加（內層），CORSMiddleware 後加（外層）
# 這樣 CORS headers 會加到所有 response 上，包含 500 錯誤
app.add_middleware(CatchAllMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.api_v1_prefix)


@app.get("/health")
async def health_check():
    return {"status": "ok"}
