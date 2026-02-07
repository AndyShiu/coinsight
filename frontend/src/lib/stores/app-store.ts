import { create } from "zustand";
import type { OverlayIndicator, SubChartIndicator } from "../types/technical";

interface AppState {
  selectedSymbol: string;
  timeframe: string;
  watchlist: string[];
  dashboardPins: string[];
  enabledOverlays: Set<OverlayIndicator>;
  enabledSubCharts: Set<SubChartIndicator>;
  setSymbol: (s: string) => void;
  setTimeframe: (t: string) => void;
  setWatchlist: (symbols: string[]) => void;
  setDashboardPins: (symbols: string[]) => void;
  toggleOverlay: (id: OverlayIndicator) => void;
  toggleSubChart: (id: SubChartIndicator) => void;
}

export const useAppStore = create<AppState>((set) => ({
  selectedSymbol: "BTC",
  timeframe: "1d",
  watchlist: ["BTC", "ETH", "SOL", "BNB", "XRP"],
  dashboardPins: ["BTC", "ETH", "SOL"],
  enabledOverlays: new Set<OverlayIndicator>(["ema"]),
  enabledSubCharts: new Set<SubChartIndicator>(),
  setSymbol: (s) => set({ selectedSymbol: s }),
  setTimeframe: (t) => set({ timeframe: t }),
  setWatchlist: (symbols) => set({ watchlist: symbols }),
  setDashboardPins: (symbols) => set({ dashboardPins: symbols }),
  toggleOverlay: (id) =>
    set((state) => {
      const next = new Set(state.enabledOverlays);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { enabledOverlays: next };
    }),
  toggleSubChart: (id) =>
    set((state) => {
      const next = new Set(state.enabledSubCharts);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { enabledSubCharts: next };
    }),
}));
