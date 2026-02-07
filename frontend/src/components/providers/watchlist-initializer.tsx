"use client";

import { useWatchlist } from "@/lib/hooks/use-watchlist";
import { useDashboardPins } from "@/lib/hooks/use-dashboard-pins";

export function WatchlistInitializer() {
  useWatchlist();
  useDashboardPins();
  return null;
}
