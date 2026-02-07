import { apiFetch } from "./client";
import type {
  FearGreedResponse,
  FundingRateResponse,
  OpenInterestResponse,
  LongShortRatioResponse,
  TakerVolumeResponse,
} from "../types/sentiment";

export function getFearGreed(limit = 30): Promise<FearGreedResponse> {
  return apiFetch(`/api/v1/sentiment/fear-greed?limit=${limit}`);
}

export function getFundingRates(symbol = "BTC"): Promise<FundingRateResponse> {
  return apiFetch(`/api/v1/sentiment/funding-rates?symbol=${symbol}`);
}

export function getOpenInterest(symbol = "BTC", period = "1h"): Promise<OpenInterestResponse> {
  return apiFetch(`/api/v1/sentiment/open-interest?symbol=${symbol}&period=${period}`);
}

export function getLongShortRatio(symbol = "BTC", period = "1h"): Promise<LongShortRatioResponse> {
  return apiFetch(`/api/v1/sentiment/long-short-ratio?symbol=${symbol}&period=${period}`);
}

export function getTakerVolume(symbol = "BTC", period = "1h"): Promise<TakerVolumeResponse> {
  return apiFetch(`/api/v1/sentiment/taker-volume?symbol=${symbol}&period=${period}`);
}
