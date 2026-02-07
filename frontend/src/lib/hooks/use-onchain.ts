import { useQuery } from "@tanstack/react-query";
import { getBtcNetwork, getExchangeFlow, getMvrv, getNupl } from "../api/onchain";

export function useExchangeFlow(asset: string) {
  return useQuery({
    queryKey: ["exchange-flow", asset],
    queryFn: () => getExchangeFlow(asset),
    refetchInterval: 1_800_000,
    enabled: !!asset,
  });
}

export function useMvrv(asset: string) {
  return useQuery({
    queryKey: ["mvrv", asset],
    queryFn: () => getMvrv(asset),
    refetchInterval: 1_800_000,
    enabled: !!asset,
  });
}

export function useNupl(asset: string) {
  return useQuery({
    queryKey: ["nupl", asset],
    queryFn: () => getNupl(asset),
    refetchInterval: 1_800_000,
    enabled: !!asset,
  });
}

export function useBtcNetwork() {
  return useQuery({
    queryKey: ["btc-network"],
    queryFn: getBtcNetwork,
    refetchInterval: 1_800_000,
  });
}
