"use client";

import { useEffect, useRef } from "react";
import {
  createChart,
  type IChartApi,
  type ISeriesApi,
  ColorType,
  LineSeries,
  HistogramSeries,
  type Time,
  type LineData,
  type HistogramData,
  LineStyle,
} from "lightweight-charts";
import type { TimeSeriesPoint } from "@/lib/types/technical";
import * as colors from "./chart-colors";
import { CHART_THEME } from "./chart-colors";

interface SubChartConfig {
  scaleMin?: number;
  scaleMax?: number;
  refLines?: number[];
}

interface SubChartProps {
  indicator: "rsi" | "kd" | "macd";
  height?: number;
  lines?: Record<string, TimeSeriesPoint[]>;
  subChartRefs: React.RefObject<Map<string, IChartApi>>;
  colorTheme?: "light" | "dark";
}

function toLineData(points: TimeSeriesPoint[]): LineData<Time>[] {
  const out: LineData<Time>[] = [];
  for (const p of points) {
    if (p.value != null) {
      out.push({ time: p.time as Time, value: p.value });
    }
  }
  return out;
}

const INDICATOR_CONFIG: Record<string, {
  lineColors: Record<string, string>;
  config: SubChartConfig;
  hasHistogram?: boolean;
}> = {
  rsi: {
    lineColors: { rsi: colors.RSI.line },
    config: { scaleMin: 0, scaleMax: 100, refLines: [30, 70] },
  },
  kd: {
    lineColors: { K: colors.KD.k, D: colors.KD.d },
    config: { scaleMin: 0, scaleMax: 100, refLines: [20, 80] },
  },
  macd: {
    lineColors: { macd: colors.MACD_COLORS.macd, signal: colors.MACD_COLORS.signal },
    config: { refLines: [0] },
    hasHistogram: true,
  },
};

export function SubChart({
  indicator,
  height = 120,
  lines,
  subChartRefs,
  colorTheme = "dark",
}: SubChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  const cfg = INDICATOR_CONFIG[indicator];

  // Create chart once (only depends on indicator type + height)
  useEffect(() => {
    if (!containerRef.current) return;

    const ct = CHART_THEME[colorTheme] ?? CHART_THEME.dark;

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: ct.text,
      },
      grid: {
        vertLines: { color: ct.grid },
        horzLines: { color: ct.grid },
      },
      crosshair: {
        vertLine: { labelBackgroundColor: ct.crosshair },
        horzLine: { labelBackgroundColor: ct.crosshair },
      },
      timeScale: {
        borderColor: ct.border,
        timeVisible: true,
        visible: true,
      },
      rightPriceScale: {
        borderColor: ct.border,
      },
    });

    chartRef.current = chart;
    subChartRefs.current.set(indicator, chart);

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        try { chart.applyOptions({ width: entry.contentRect.width }); } catch { /* disposed */ }
      }
    });
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      subChartRefs.current.delete(indicator);
      chartRef.current = null;
      // Defer removal to let pending lightweight-charts paint frames complete
      requestAnimationFrame(() => {
        try { chart.remove(); } catch { /* already disposed */ }
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [indicator, height, colorTheme]);

  // Update data (re-runs when lines change)
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || !lines) return;

    const seriesList: (ISeriesApi<"Line"> | ISeriesApi<"Histogram">)[] = [];

    try {
      // MACD histogram first (rendered behind lines)
      if (cfg.hasHistogram && lines.histogram) {
        const histData: HistogramData<Time>[] = [];
        for (const p of lines.histogram) {
          if (p.value != null) {
            histData.push({
              time: p.time as Time,
              value: p.value,
              color: p.value >= 0 ? colors.MACD_COLORS.histUp : colors.MACD_COLORS.histDown,
            });
          }
        }
        const hs = chart.addSeries(HistogramSeries, {
          priceFormat: { type: "price", precision: 2, minMove: 0.01 },
          lastValueVisible: false,
          priceLineVisible: false,
        });
        hs.setData(histData);
        seriesList.push(hs);
      }

      // Line series
      for (const [lineKey, color] of Object.entries(cfg.lineColors)) {
        const pts = lines[lineKey];
        if (!pts) continue;
        const s = chart.addSeries(LineSeries, {
          color,
          lineWidth: 1,
          lastValueVisible: false,
          priceLineVisible: false,
        });
        s.setData(toLineData(pts));
        seriesList.push(s);

        // Add reference lines on the first line series
        if (cfg.config.refLines && seriesList.length === (cfg.hasHistogram ? 2 : 1)) {
          for (const price of cfg.config.refLines) {
            s.createPriceLine({
              price,
              color: "rgba(255,255,255,0.15)",
              lineWidth: 1,
              lineStyle: LineStyle.Dotted,
              axisLabelVisible: false,
              title: "",
            });
          }
        }
      }

      chart.timeScale().fitContent();
    } catch {
      // Chart disposed during data update — ignore
      return;
    }

    return () => {
      for (const s of seriesList) {
        try { chart.removeSeries(s); } catch { /* disposed */ }
      }
    };
  }, [lines, cfg, colorTheme]);

  return (
    <div className="border-t border-border">
      <div className="flex items-center px-2 py-0.5">
        <span className="text-xs text-muted-foreground uppercase font-medium">
          {indicator}
        </span>
      </div>
      <div ref={containerRef} className="w-full" />
    </div>
  );
}
