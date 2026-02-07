import { useQuery } from "@tanstack/react-query";
import { getMarketOverview } from "../api/market";

export function useMarketOverview(limit = 20) {
  return useQuery({
    queryKey: ["market-overview", limit],
    queryFn: () => getMarketOverview(limit),
    refetchInterval: 60_000,
  });
}
