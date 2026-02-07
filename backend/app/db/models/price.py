from __future__ import annotations
from datetime import datetime

from sqlalchemy import Column, DateTime, Float, Index, Integer, String

from app.db.base import Base


class PriceHistory(Base):
    __tablename__ = "price_history"

    id = Column(Integer, primary_key=True, autoincrement=True)
    symbol = Column(String(20), nullable=False, index=True)
    timeframe = Column(String(5), nullable=False)
    timestamp = Column(DateTime, nullable=False)
    open = Column(Float, nullable=False)
    high = Column(Float, nullable=False)
    low = Column(Float, nullable=False)
    close = Column(Float, nullable=False)
    volume = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        Index("idx_symbol_tf_ts", "symbol", "timeframe", "timestamp", unique=True),
    )


class IndicatorCache(Base):
    __tablename__ = "indicator_cache"

    id = Column(Integer, primary_key=True, autoincrement=True)
    symbol = Column(String(20), nullable=False)
    indicator_name = Column(String(50), nullable=False)
    timeframe = Column(String(5), nullable=False)
    timestamp = Column(DateTime, nullable=False)
    value_json = Column(String, nullable=False)
    signal = Column(String(10))
    calculated_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        Index("idx_indicator_lookup", "symbol", "indicator_name", "timeframe", "timestamp"),
    )
