import { useQuery } from "@tanstack/react-query";
import { getIndicatorSeries, getSupportResistance } from "../api/technical";

export function useIndicatorSeries(
  symbol: string,
  indicator: string,
  timeframe: string,
  enabled: boolean,
) {
  return useQuery({
    queryKey: ["indicator-series", symbol, indicator, timeframe],
    queryFn: () => getIndicatorSeries(symbol, indicator, timeframe),
    refetchInterval: 300_000,
    enabled: enabled && !!symbol,
  });
}

export function useSupportResistance(
  symbol: string,
  timeframe: string,
  enabled: boolean,
) {
  return useQuery({
    queryKey: ["support-resistance", symbol, timeframe],
    queryFn: () => getSupportResistance(symbol, timeframe),
    refetchInterval: 300_000,
    enabled: enabled && !!symbol,
  });
}
