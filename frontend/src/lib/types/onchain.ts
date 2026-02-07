export interface ExchangeFlowResponse {
  asset: string;
  latest_netflow: number;
  avg_netflow_7d: number;
  signal: string;
  strength: number;
  trend: string;
}

export interface MVRVResponse {
  asset: string;
  current_mvrv: number;
  signal: string;
  strength: number;
  zone: string;
}

export interface NUPLResponse {
  asset: string;
  current_nupl: number;
  signal: string;
  strength: number;
  phase: string;
}

export interface BTCNetworkStats {
  hash_rate: number | null;
  difficulty: number | null;
  active_addresses: number | null;
  transaction_count: number | null;
  mempool_size: number | null;
}
