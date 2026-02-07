from __future__ import annotations
from typing import Optional

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # 應用程式
    app_name: str = "CoinSight 幣析"
    debug: bool = False
    api_v1_prefix: str = "/api/v1"

    # 資料庫
    database_url: str = "sqlite+aiosqlite:///./crypto_analyze.db"

    # API Keys
    coingecko_api_key: Optional[str] = None
    glassnode_api_key: Optional[str] = None
    cryptoquant_api_key: Optional[str] = None

    # 快取
    cache_ttl_seconds: int = 300
    use_redis: bool = False
    redis_url: str = "redis://localhost:6379"

    # 排程
    scheduler_enabled: bool = True
    price_fetch_interval_minutes: int = 5

    model_config = {"env_file": ".env", "env_prefix": "CRYPTO_"}


settings = Settings()
