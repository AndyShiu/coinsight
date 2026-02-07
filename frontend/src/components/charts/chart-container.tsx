"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { useTheme } from "next-themes";
import type { IChartApi, ISeriesApi } from "lightweight-charts";
import { useAppStore } from "@/lib/stores/app-store";
import { useIndicatorSeries, useSupportResistance } from "@/lib/hooks/use-indicator-series";
import { getOhlcv } from "@/lib/api/market";
import { MainChart } from "./main-chart";
import { SubChart } from "./sub-chart";
import { IndicatorToolbar } from "./indicator-toolbar";
import { VolumeProfile } from "./volume-profile";
import { SrZones } from "./sr-zones";
import { useChartSync } from "./use-chart-sync";
import type { OhlcvEntry } from "@/lib/types/market";

interface ChartContainerProps {
  data: OhlcvEntry[];
  symbol: string;
  timeframe: string;
}

export function ChartContainer({ data, symbol, timeframe }: ChartContainerProps) {
  const { resolvedTheme } = useTheme();
  const chartTheme = (resolvedTheme === "light" ? "light" : "dark") as "light" | "dark";
  const enabledOverlays = useAppStore((s) => s.enabledOverlays);
  const enabledSubCharts = useAppStore((s) => s.enabledSubCharts);

  // --- Historical data management ---
  const [allData, setAllData] = useState<OhlcvEntry[]>(data);
  const loadingMoreRef = useRef(false);
  const allDataRef = useRef(allData);
  allDataRef.current = allData;

  // Reset when initial data changes (new symbol / timeframe)
  useEffect(() => {
    if (data.length > 0) {
      setAllData(data);
      loadingMoreRef.current = false;
    }
  }, [data]);

  const handleLoadMore = useCallback(async () => {
    if (loadingMoreRef.current) return;
    const current = allDataRef.current;
    if (current.length === 0) return;

    loadingMoreRef.current = true;
    const oldestTime = current[0].time;

    try {
      const olderData = await getOhlcv(symbol, timeframe, 200, oldestTime);
      if (olderData.length > 0) {
        const existingTimes = new Set(current.map((d) => d.time));
        const newEntries = olderData.filter((d) => !existingTimes.has(d.time));
        if (newEntries.length > 0) {
          setAllData((prev) => [...newEntries, ...prev].sort((a, b) => a.time - b.time));
        }
      }
    } catch {
      // silently fail
    } finally {
      // Cooldown before allowing next load
      setTimeout(() => {
        loadingMoreRef.current = false;
      }, 1000);
    }
  }, [symbol, timeframe]);

  // Stable refs — no callbacks needed
  const mainChartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const subChartRefs = useRef<Map<string, IChartApi>>(new Map());

  // Conditionally fetch indicator series
  const ema = useIndicatorSeries(symbol, "ema", timeframe, enabledOverlays.has("ema"));
  const bbands = useIndicatorSeries(symbol, "bbands", timeframe, enabledOverlays.has("bbands"));
  const sr = useSupportResistance(symbol, timeframe, enabledOverlays.has("sr"));
  const rsi = useIndicatorSeries(symbol, "rsi", timeframe, enabledSubCharts.has("rsi"));
  const kd = useIndicatorSeries(symbol, "kd", timeframe, enabledSubCharts.has("kd"));
  const macd = useIndicatorSeries(symbol, "macd", timeframe, enabledSubCharts.has("macd"));

  // Sync time scales
  useChartSync(mainChartRef, subChartRefs);

  return (
    <div className="flex flex-col">
      <IndicatorToolbar />
      <div className="relative">
        <MainChart
          data={allData}
          height={400}
          chartApiRef={mainChartRef}
          candleSeriesRef={candleSeriesRef}
          emaLines={enabledOverlays.has("ema") ? ema.data?.indicator.lines : undefined}
          bbandsLines={enabledOverlays.has("bbands") ? bbands.data?.indicator.lines : undefined}
          srLevels={enabledOverlays.has("sr") ? sr.data?.levels : undefined}
          onLoadMore={handleLoadMore}
          colorTheme={chartTheme}
        />
        <SrZones
          chartApi={mainChartRef.current}
          candleSeries={candleSeriesRef.current}
          srLevels={enabledOverlays.has("sr") ? sr.data?.levels : undefined}
          enabled={enabledOverlays.has("sr")}
        />
        <VolumeProfile
          chartApi={mainChartRef.current}
          candleSeries={candleSeriesRef.current}
          data={allData}
          enabled={enabledOverlays.has("vpvr")}
        />
      </div>
      {enabledSubCharts.has("rsi") && (
        <SubChart
          indicator="rsi"
          height={120}
          lines={rsi.data?.indicator.lines}
          subChartRefs={subChartRefs}
          colorTheme={chartTheme}
        />
      )}
      {enabledSubCharts.has("kd") && (
        <SubChart
          indicator="kd"
          height={120}
          lines={kd.data?.indicator.lines}
          subChartRefs={subChartRefs}
          colorTheme={chartTheme}
        />
      )}
      {enabledSubCharts.has("macd") && (
        <SubChart
          indicator="macd"
          height={120}
          lines={macd.data?.indicator.lines}
          subChartRefs={subChartRefs}
          colorTheme={chartTheme}
        />
      )}
    </div>
  );
}
