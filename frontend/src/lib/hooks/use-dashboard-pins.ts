import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { getDashboardPins, updateDashboardPins } from "../api/settings";
import { useAppStore } from "../stores/app-store";

const KEY = ["settings", "dashboard-pins"] as const;

export function useDashboardPins() {
  const setDashboardPins = useAppStore((s) => s.setDashboardPins);

  const query = useQuery({
    queryKey: KEY,
    queryFn: getDashboardPins,
    staleTime: Infinity,
  });

  useEffect(() => {
    if (query.data) {
      setDashboardPins(query.data.symbols);
    }
  }, [query.data, setDashboardPins]);

  return query;
}

export function useUpdateDashboardPins() {
  const qc = useQueryClient();
  const setDashboardPins = useAppStore((s) => s.setDashboardPins);

  return useMutation({
    mutationFn: (symbols: string[]) => updateDashboardPins(symbols),
    onSuccess: (data) => {
      qc.setQueryData(KEY, data);
      setDashboardPins(data.symbols);
    },
  });
}
