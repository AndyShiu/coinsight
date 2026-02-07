import { apiFetch } from "./client";
import type {
  TechnicalAnalysisResponse,
  SingleIndicatorResponse,
  IndicatorSeriesResponse,
  SupportResistanceResponse,
} from "../types/technical";

export function getTechnicalAnalysis(
  symbol: string,
  timeframe = "1d",
): Promise<TechnicalAnalysisResponse> {
  return apiFetch(`/api/v1/technical/${symbol}/analysis?timeframe=${timeframe}`);
}

export function getSingleIndicator(
  symbol: string,
  indicator: string,
  timeframe = "1d",
): Promise<SingleIndicatorResponse> {
  return apiFetch(`/api/v1/technical/${symbol}/${indicator}?timeframe=${timeframe}`);
}

export function getIndicatorSeries(
  symbol: string,
  indicator: string,
  timeframe = "1d",
): Promise<IndicatorSeriesResponse> {
  return apiFetch(`/api/v1/technical/${symbol}/series/${indicator}?timeframe=${timeframe}`);
}

export function getSupportResistance(
  symbol: string,
  timeframe = "1d",
): Promise<SupportResistanceResponse> {
  return apiFetch(`/api/v1/technical/${symbol}/support-resistance?timeframe=${timeframe}`);
}
