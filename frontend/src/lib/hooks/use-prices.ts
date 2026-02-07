import { useQuery } from "@tanstack/react-query";
import { getPrices } from "../api/market";

export function usePrices(symbols: string[]) {
  return useQuery({
    queryKey: ["prices", symbols],
    queryFn: () => getPrices(symbols),
    refetchInterval: 30_000,
    enabled: symbols.length > 0,
  });
}
