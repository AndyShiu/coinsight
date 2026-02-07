import { apiFetch } from "./client";
import type { CoinSearchResult, MarketOverviewResponse, OhlcvEntry, PriceResponse } from "../types/market";

export function getPrices(symbols: string[]): Promise<PriceResponse[]> {
  return apiFetch(`/api/v1/market/prices?symbols=${symbols.join(",")}`);
}

export function getMarketOverview(limit = 20): Promise<MarketOverviewResponse> {
  return apiFetch(`/api/v1/market/overview?limit=${limit}`);
}

export function searchCoins(q: string, limit = 20): Promise<CoinSearchResult[]> {
  return apiFetch(`/api/v1/market/search?q=${encodeURIComponent(q)}&limit=${limit}`);
}

export function getOhlcv(
  symbol: string,
  timeframe = "1d",
  limit = 200,
  before?: number,
): Promise<OhlcvEntry[]> {
  let url = `/api/v1/market/ohlcv/${symbol}?timeframe=${timeframe}&limit=${limit}`;
  if (before != null) url += `&before=${before}`;
  return apiFetch(url);
}
