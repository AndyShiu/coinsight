import { useQuery } from "@tanstack/react-query";
import { getOpenInterest, getLongShortRatio, getTakerVolume } from "../api/sentiment";

export function useOpenInterest(symbol = "BTC", period = "1h") {
  return useQuery({
    queryKey: ["open-interest", symbol, period],
    queryFn: () => getOpenInterest(symbol, period),
    refetchInterval: 300_000,
    enabled: !!symbol,
  });
}

export function useLongShortRatio(symbol = "BTC", period = "1h") {
  return useQuery({
    queryKey: ["long-short-ratio", symbol, period],
    queryFn: () => getLongShortRatio(symbol, period),
    refetchInterval: 300_000,
    enabled: !!symbol,
  });
}

export function useTakerVolume(symbol = "BTC", period = "1h") {
  return useQuery({
    queryKey: ["taker-volume", symbol, period],
    queryFn: () => getTakerVolume(symbol, period),
    refetchInterval: 300_000,
    enabled: !!symbol,
  });
}
