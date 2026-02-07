export interface ApiKeyStatus {
  name: string;
  label: string;
  description: string;
  is_set: boolean;
  masked_value: string | null;
}

export interface ApiKeysResponse {
  keys: ApiKeyStatus[];
}

export interface ApiKeysUpdateRequest {
  binance_api_key?: string;
  binance_api_secret?: string;
  coingecko_api_key?: string;
  glassnode_api_key?: string;
  coinglass_api_key?: string;
}

export interface WatchlistResponse {
  symbols: string[];
}

export interface DashboardPinsResponse {
  symbols: string[];
}
