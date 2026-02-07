import { useQuery } from "@tanstack/react-query";
import { getFundingRates } from "../api/sentiment";

export function useFundingRates(symbol = "BTC") {
  return useQuery({
    queryKey: ["funding-rates", symbol],
    queryFn: () => getFundingRates(symbol),
    refetchInterval: 300_000,
  });
}
