import { apiFetch } from "./client";
import type {
  BTCNetworkStats,
  ExchangeFlowResponse,
  MVRVResponse,
  NUPLResponse,
} from "../types/onchain";

export function getExchangeFlow(asset: string): Promise<ExchangeFlowResponse> {
  return apiFetch(`/api/v1/onchain/${asset}/exchange-flow`);
}

export function getMvrv(asset: string): Promise<MVRVResponse> {
  return apiFetch(`/api/v1/onchain/${asset}/mvrv`);
}

export function getNupl(asset: string): Promise<NUPLResponse> {
  return apiFetch(`/api/v1/onchain/${asset}/nupl`);
}

export function getBtcNetwork(): Promise<BTCNetworkStats> {
  return apiFetch(`/api/v1/onchain/btc/network`);
}
