from __future__ import annotations

import logging
import time

import httpx

logger = logging.getLogger(__name__)

# Binance 合約 symbol 快取 (symbol -> resolved_pair)
_futures_pair_cache: dict[str, str] = {}
# 所有合約 symbols 列表快取
_futures_symbols: list[str] = []
_futures_symbols_ts: float = 0
_CACHE_TTL = 3600  # 1 小時


async def _ensure_futures_symbols() -> list[str]:
    """載入 Binance 合約市場的所有 symbol（快取 1 小時）。"""
    global _futures_symbols, _futures_symbols_ts
    if _futures_symbols and (time.time() - _futures_symbols_ts) < _CACHE_TTL:
        return _futures_symbols

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get("https://fapi.binance.com/fapi/v1/exchangeInfo")
            resp.raise_for_status()
            data = resp.json()
        _futures_symbols = [
            s["symbol"] for s in data.get("symbols", [])
            if s.get("contractType") == "PERPETUAL" and s.get("quoteAsset") == "USDT"
        ]
        _futures_symbols_ts = time.time()
        logger.info("Loaded %d Binance futures symbols", len(_futures_symbols))
    except Exception as e:
        logger.warning("Failed to load Binance futures symbols: %s", e)

    return _futures_symbols


async def resolve_futures_pair(symbol: str) -> str:
    """解析合約交易對：先嘗試 SYMBOLUSDT，找不到則模糊搜尋。

    Examples:
        BTC -> BTCUSDT
        BABYDOGE -> 1MBABYDOGEUSDT
        SHIB -> 1000SHIBUSDT
    """
    upper = symbol.upper()
    if upper in _futures_pair_cache:
        return _futures_pair_cache[upper]

    symbols = await _ensure_futures_symbols()
    direct = f"{upper}USDT"

    # 直接匹配
    if direct in symbols:
        _futures_pair_cache[upper] = direct
        return direct

    # 模糊搜尋：找包含該 symbol 的合約 USDT 對
    candidates = [s for s in symbols if upper in s and s.endswith("USDT")]
    if candidates:
        best = min(candidates, key=len)
        logger.info("Resolved futures pair: %s -> %s", upper, best)
        _futures_pair_cache[upper] = best
        return best

    # 找不到，回傳原始 pair
    _futures_pair_cache[upper] = direct
    return direct
