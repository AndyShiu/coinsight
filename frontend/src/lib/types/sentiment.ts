export interface FearGreedEntry {
  timestamp: string;
  value: number;
  classification: string;
}

export interface FearGreedResponse {
  current_value: number;
  current_class: string;
  signal: string;
  strength: number;
  trend: string;
  avg_7d: number;
  avg_30d: number;
  history: FearGreedEntry[];
}

export interface FundingRateEntry {
  exchange: string;
  symbol: string;
  rate: number;
  predicted_rate: number | null;
}

export interface FundingRateResponse {
  symbol: string;
  avg_rate: number;
  max_rate: number;
  min_rate: number;
  signal: string;
  strength: number;
  exchanges: FundingRateEntry[];
}

// ── Open Interest ─────────────────────────────────────────────

export interface OpenInterestEntry {
  timestamp: number;
  open_interest: number;
  open_interest_value: number;
}

export interface OpenInterestResponse {
  symbol: string;
  current_oi: number;
  current_oi_value: number;
  change_pct: number;
  signal: string;
  strength: number;
  trend: string;
  history: OpenInterestEntry[];
}

// ── Long/Short Ratio ─────────────────────────────────────────

export interface LongShortRatioEntry {
  timestamp: number;
  long_short_ratio: number;
  long_account: number;
  short_account: number;
}

export interface LongShortRatioResponse {
  symbol: string;
  current_ratio: number;
  long_pct: number;
  short_pct: number;
  avg_ratio: number;
  signal: string;
  strength: number;
  trend: string;
  history: LongShortRatioEntry[];
}

// ── Taker Buy/Sell Volume ────────────────────────────────────

export interface TakerVolumeEntry {
  timestamp: number;
  buy_sell_ratio: number;
  buy_vol: number;
  sell_vol: number;
}

export interface TakerVolumeResponse {
  symbol: string;
  current_ratio: number;
  buy_vol: number;
  sell_vol: number;
  avg_ratio: number;
  signal: string;
  strength: number;
  pressure: string;
  history: TakerVolumeEntry[];
}
