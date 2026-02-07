from __future__ import annotations

from sqlalchemy import Column, Float, String, Text

from app.db.base import Base


class AppSetting(Base):
    """通用應用程式設定表 — 用於儲存 API key 等設定"""

    __tablename__ = "app_settings"

    key = Column(String, primary_key=True)
    value = Column(Text, nullable=False)
    updated_at = Column(Float, nullable=False)
