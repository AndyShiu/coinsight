import { useQuery } from "@tanstack/react-query";
import { getTechnicalAnalysis } from "../api/technical";

export function useTechnical(symbol: string, timeframe = "1d") {
  return useQuery({
    queryKey: ["technical", symbol, timeframe],
    queryFn: () => getTechnicalAnalysis(symbol, timeframe),
    refetchInterval: 300_000,
    enabled: !!symbol,
  });
}
