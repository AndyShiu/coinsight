export interface PriceResponse {
  symbol: string;
  price: number;
}

export interface MarketCoinResponse {
  symbol: string;
  name: string;
  price: number;
  market_cap: number | null;
  volume_24h: number | null;
  change_24h: number | null;
  image: string | null;
}

export interface MarketOverviewResponse {
  coins: MarketCoinResponse[];
}

export interface CoinSearchResult {
  symbol: string;
  name: string;
  market_cap_rank: number | null;
  thumb: string | null;
}

export interface OhlcvEntry {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}
