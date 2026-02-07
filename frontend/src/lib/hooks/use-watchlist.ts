import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { getWatchlist, updateWatchlist } from "../api/settings";
import { useAppStore } from "../stores/app-store";

const KEY = ["settings", "watchlist"] as const;

export function useWatchlist() {
  const setWatchlist = useAppStore((s) => s.setWatchlist);

  const query = useQuery({
    queryKey: KEY,
    queryFn: getWatchlist,
    staleTime: Infinity,
  });

  useEffect(() => {
    if (query.data) {
      setWatchlist(query.data.symbols);
    }
  }, [query.data, setWatchlist]);

  return query;
}

export function useUpdateWatchlist() {
  const qc = useQueryClient();
  const setWatchlist = useAppStore((s) => s.setWatchlist);

  return useMutation({
    mutationFn: (symbols: string[]) => updateWatchlist(symbols),
    onSuccess: (data) => {
      qc.setQueryData(KEY, data);
      setWatchlist(data.symbols);
      // Invalidate dashboard pins (watchlist removal may affect pins)
      qc.invalidateQueries({ queryKey: ["settings", "dashboard-pins"] });
    },
  });
}
