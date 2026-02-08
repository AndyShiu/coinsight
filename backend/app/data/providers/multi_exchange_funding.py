from __future__ import annotations

import asyncio
import logging
from typing import Optional

import httpx
import pandas as pd

from app.data.providers.binance_pair_resolver import resolve_futures_pair

logger = logging.getLogger(__name__)

COLUMNS = ["exchange", "symbol", "rate", "predicted_rate"]


async def _fetch_binance(client: httpx.AsyncClient, symbol: str) -> list[dict]:
    """Binance — 免費公開端點"""
    pair = await resolve_futures_pair(symbol)
    try:
        resp = await client.get(
            "https://fapi.binance.com/fapi/v1/premiumIndex",
            params={"symbol": pair},
        )
        resp.raise_for_status()
        d = resp.json()
        return [{
            "exchange": "Binance",
            "symbol": symbol.upper(),
            "rate": float(d.get("lastFundingRate", 0)),
            "predicted_rate": float(d.get("lastFundingRate", 0)),
        }]
    except Exception as e:
        logger.warning("Binance funding failed: %s", e)
        return []


async def _fetch_okx(client: httpx.AsyncClient, symbol: str) -> list[dict]:
    """OKX — 免費公開端點"""
    inst_id = f"{symbol.upper()}-USDT-SWAP"
    try:
        resp = await client.get(
            "https://www.okx.com/api/v5/public/funding-rate",
            params={"instId": inst_id},
        )
        resp.raise_for_status()
        data = resp.json().get("data", [])
        if not data:
            return []
        item = data[0]
        return [{
            "exchange": "OKX",
            "symbol": symbol.upper(),
            "rate": float(item.get("fundingRate", 0)),
            "predicted_rate": float(item.get("nextFundingRate", 0) or item.get("fundingRate", 0)),
        }]
    except Exception as e:
        logger.warning("OKX funding failed: %s", e)
        return []


async def _fetch_bybit(client: httpx.AsyncClient, symbol: str) -> list[dict]:
    """Bybit — 免費公開端點"""
    try:
        resp = await client.get(
            "https://api.bybit.com/v5/market/tickers",
            params={"category": "linear", "symbol": f"{symbol.upper()}USDT"},
        )
        resp.raise_for_status()
        items = resp.json().get("result", {}).get("list", [])
        if not items:
            return []
        item = items[0]
        return [{
            "exchange": "Bybit",
            "symbol": symbol.upper(),
            "rate": float(item.get("fundingRate", 0)),
            "predicted_rate": float(item.get("fundingRate", 0)),
        }]
    except Exception as e:
        logger.warning("Bybit funding failed: %s", e)
        return []


async def _fetch_bitget(client: httpx.AsyncClient, symbol: str) -> list[dict]:
    """Bitget — 免費公開端點"""
    try:
        resp = await client.get(
            "https://api.bitget.com/api/v2/mix/market/current-fund-rate",
            params={"productType": "USDT-FUTURES", "symbol": f"{symbol.upper()}USDT"},
        )
        resp.raise_for_status()
        data = resp.json().get("data", [])
        if not data:
            return []
        item = data[0]
        return [{
            "exchange": "Bitget",
            "symbol": symbol.upper(),
            "rate": float(item.get("fundingRate", 0)),
            "predicted_rate": float(item.get("fundingRate", 0)),
        }]
    except Exception as e:
        logger.warning("Bitget funding failed: %s", e)
        return []


async def _fetch_gateio(client: httpx.AsyncClient, symbol: str) -> list[dict]:
    """Gate.io — 免費公開端點"""
    contract = f"{symbol.upper()}_USDT"
    try:
        resp = await client.get(
            f"https://api.gateio.ws/api/v4/futures/usdt/contracts/{contract}",
        )
        resp.raise_for_status()
        d = resp.json()
        return [{
            "exchange": "Gate.io",
            "symbol": symbol.upper(),
            "rate": float(d.get("funding_rate", 0)),
            "predicted_rate": float(d.get("funding_rate_indicative", 0) or d.get("funding_rate", 0)),
        }]
    except Exception as e:
        logger.warning("Gate.io funding failed: %s", e)
        return []


_FETCHERS = [
    _fetch_binance,
    _fetch_okx,
    _fetch_bybit,
    _fetch_bitget,
    _fetch_gateio,
]


async def fetch_all_funding_rates(symbol: str = "BTC") -> pd.DataFrame:
    """並行取得多個交易所的資金費率，回傳聚合 DataFrame。"""
    async with httpx.AsyncClient(timeout=10.0) as client:
        results = await asyncio.gather(
            *[fn(client, symbol) for fn in _FETCHERS],
            return_exceptions=True,
        )

    rows: list[dict] = []
    for result in results:
        if isinstance(result, list):
            rows.extend(result)
        elif isinstance(result, Exception):
            logger.warning("Funding fetch exception: %s", result)

    if not rows:
        return pd.DataFrame(columns=COLUMNS)

    df = pd.DataFrame(rows)
    # 按費率絕對值排序（高→低）
    df["abs_rate"] = df["rate"].abs()
    df = df.sort_values("abs_rate", ascending=False).drop(columns=["abs_rate"])
    return df.reset_index(drop=True)
