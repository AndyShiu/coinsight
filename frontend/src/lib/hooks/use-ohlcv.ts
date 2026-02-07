import { useQuery } from "@tanstack/react-query";
import { getOhlcv } from "../api/market";

export function useOhlcv(symbol: string, timeframe = "1d", limit = 200) {
  return useQuery({
    queryKey: ["ohlcv", symbol, timeframe, limit],
    queryFn: () => getOhlcv(symbol, timeframe, limit),
    refetchInterval: 300_000,
    enabled: !!symbol,
  });
}
