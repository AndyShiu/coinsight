from __future__ import annotations
from fastapi import APIRouter

from app.api.v1.endpoints import market, onchain, sentiment, settings, technical

api_router = APIRouter()
api_router.include_router(market.router)
api_router.include_router(technical.router)
api_router.include_router(sentiment.router)
api_router.include_router(onchain.router)
api_router.include_router(settings.router)
