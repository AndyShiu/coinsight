from __future__ import annotations

from sqlalchemy import Column, Float, String, Text

from app.db.base import Base


class ApiCache(Base):
    """通用 API 快取表 — key/value + 過期機制"""

    __tablename__ = "api_cache"

    key = Column(String, primary_key=True)
    value_json = Column(Text, nullable=False)
    created_at = Column(Float, nullable=False)   # time.time() epoch
    max_age = Column(Float, nullable=False)       # 秒數，超過即視為過期
