import { useQuery } from "@tanstack/react-query";
import { getFearGreed } from "../api/sentiment";

export function useFearGreed(limit = 30) {
  return useQuery({
    queryKey: ["fear-greed", limit],
    queryFn: () => getFearGreed(limit),
    refetchInterval: 1_800_000,
  });
}
