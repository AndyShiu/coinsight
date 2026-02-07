"use client";

import { useEffect, useRef, useCallback, type RefObject } from "react";
import {
  createChart,
  type IChartApi,
  type ISeriesApi,
  ColorType,
  CandlestickSeries,
  HistogramSeries,
  LineSeries,
  type CandlestickData,
  type HistogramData,
  type Time,
  type LineData,
  LineStyle,
} from "lightweight-charts";
import type { OhlcvEntry } from "@/lib/types/market";
import type { TimeSeriesPoint, SupportResistanceLevel } from "@/lib/types/technical";
import * as colors from "./chart-colors";
import { CHART_THEME } from "./chart-colors";

interface MainChartProps {
  data: OhlcvEntry[];
  height?: number;
  chartApiRef: RefObject<IChartApi | null>;
  candleSeriesRef?: RefObject<ISeriesApi<"Candlestick"> | null>;
  emaLines?: Record<string, TimeSeriesPoint[]>;
  bbandsLines?: Record<string, TimeSeriesPoint[]>;
  srLevels?: SupportResistanceLevel[];
  onLoadMore?: () => void;
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

export function MainChart({
  data,
  height = 400,
  chartApiRef,
  candleSeriesRef,
  emaLines,
  bbandsLines,
  srLevels,
  onLoadMore,
  colorTheme = "dark",
}: MainChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeRef = useRef<ISeriesApi<"Histogram"> | null>(null);

  // Track overlay series for cleanup
  const overlaySeriesRef = useRef<ISeriesApi<"Line">[]>([]);
  const priceLineIdsRef = useRef<ReturnType<ISeriesApi<"Candlestick">["createPriceLine"]>[]>([]);

  // Track previous data for prepend detection
  const prevDataRef = useRef<OhlcvEntry[]>([]);
  const onLoadMoreRef = useRef(onLoadMore);
  onLoadMoreRef.current = onLoadMore;

  // Create chart once
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
      },
      rightPriceScale: {
        borderColor: ct.border,
      },
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: colors.CANDLE.up,
      downColor: colors.CANDLE.down,
      borderDownColor: colors.CANDLE.down,
      borderUpColor: colors.CANDLE.up,
      wickDownColor: colors.CANDLE.down,
      wickUpColor: colors.CANDLE.up,
    });

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" },
      priceScaleId: "volume",
    });

    chart.priceScale("volume").applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });

    chartRef.current = chart;
    (chartApiRef as React.MutableRefObject<IChartApi | null>).current = chart;
    candleRef.current = candleSeries;
    if (candleSeriesRef) {
      (candleSeriesRef as React.MutableRefObject<ISeriesApi<"Candlestick"> | null>).current = candleSeries;
    }
    volumeRef.current = volumeSeries;

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        try { chart.applyOptions({ width: entry.contentRect.width }); } catch { /* disposed */ }
      }
    });
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      // Null refs immediately so other effects early-return
      chartRef.current = null;
      candleRef.current = null;
      volumeRef.current = null;
      (chartApiRef as React.MutableRefObject<IChartApi | null>).current = null;
      if (candleSeriesRef) {
        (candleSeriesRef as React.MutableRefObject<ISeriesApi<"Candlestick"> | null>).current = null;
      }
      // Defer removal to let pending lightweight-charts paint frames complete
      requestAnimationFrame(() => {
        try { chart.remove(); } catch { /* already disposed */ }
      });
    };
  }, [height, chartApiRef, candleSeriesRef, colorTheme]);

  // Update candle & volume data
  useEffect(() => {
    if (!candleRef.current || !volumeRef.current || !data.length) return;

    const prev = prevDataRef.current;
    const isPrepend =
      prev.length > 0 &&
      data.length > prev.length &&
      data[0].time < prev[0].time;
    const prependCount = isPrepend ? data.length - prev.length : 0;

    // Save visible range before setData if prepending
    let savedRange: { from: number; to: number } | null = null;
    if (isPrepend && chartRef.current) {
      try {
        const lr = chartRef.current.timeScale().getVisibleLogicalRange();
        if (lr) savedRange = { from: lr.from, to: lr.to };
      } catch { /* disposed */ }
    }

    const candles: CandlestickData<Time>[] = data.map((d) => ({
      time: d.time as Time,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
    }));

    const volumes: HistogramData<Time>[] = data.map((d) => ({
      time: d.time as Time,
      value: d.volume,
      color: d.close >= d.open ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)",
    }));

    try {
      candleRef.current.setData(candles);
      volumeRef.current.setData(volumes);
    } catch {
      return; // chart disposed during setData
    }

    if (isPrepend && savedRange && chartRef.current) {
      // Shift visible range by the number of prepended candles
      try {
        chartRef.current.timeScale().setVisibleLogicalRange({
          from: savedRange.from + prependCount,
          to: savedRange.to + prependCount,
        } as import("lightweight-charts").LogicalRange);
      } catch { /* disposed */ }
    } else {
      try { chartRef.current?.timeScale().fitContent(); } catch { /* disposed */ }
    }

    prevDataRef.current = data;
  }, [data, colorTheme]);

  // Helper: remove all overlay series
  const clearOverlays = useCallback(() => {
    const chart = chartRef.current;
    if (!chart) return;
    for (const s of overlaySeriesRef.current) {
      try { chart.removeSeries(s); } catch { /* already removed */ }
    }
    overlaySeriesRef.current = [];
  }, []);

  // Helper: remove all price lines
  const clearPriceLines = useCallback(() => {
    const candle = candleRef.current;
    if (!candle) return;
    for (const pl of priceLineIdsRef.current) {
      try { candle.removePriceLine(pl); } catch { /* already removed */ }
    }
    priceLineIdsRef.current = [];
  }, []);

  // EMA overlay
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || !emaLines) {
      return;
    }

    const series: ISeriesApi<"Line">[] = [];

    try {
      if (emaLines.ema_fast) {
        const s = chart.addSeries(LineSeries, {
          color: colors.EMA.fast,
          lineWidth: 1,
          priceScaleId: "right",
          lastValueVisible: false,
          priceLineVisible: false,
        });
        s.setData(toLineData(emaLines.ema_fast));
        series.push(s);
      }
      if (emaLines.ema_slow) {
        const s = chart.addSeries(LineSeries, {
          color: colors.EMA.slow,
          lineWidth: 1,
          priceScaleId: "right",
          lastValueVisible: false,
          priceLineVisible: false,
        });
        s.setData(toLineData(emaLines.ema_slow));
        series.push(s);
      }
    } catch {
      return;
    }

    return () => {
      for (const s of series) {
        try { chart.removeSeries(s); } catch { /* disposed */ }
      }
    };
  }, [emaLines, colorTheme]);

  // Bollinger Bands overlay
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || !bbandsLines) return;

    const series: ISeriesApi<"Line">[] = [];
    const lineConfigs: { key: string; color: string; style?: number }[] = [
      { key: "upper", color: colors.BBANDS.upper, style: LineStyle.Dashed },
      { key: "middle", color: colors.BBANDS.middle },
      { key: "lower", color: colors.BBANDS.lower, style: LineStyle.Dashed },
    ];

    try {
      for (const cfg of lineConfigs) {
        const pts = bbandsLines[cfg.key];
        if (!pts) continue;
        const s = chart.addSeries(LineSeries, {
          color: cfg.color,
          lineWidth: 1,
          lineStyle: cfg.style ?? LineStyle.Solid,
          priceScaleId: "right",
          lastValueVisible: false,
          priceLineVisible: false,
        });
        s.setData(toLineData(pts));
        series.push(s);
      }
    } catch {
      return;
    }

    return () => {
      for (const s of series) {
        try { chart.removeSeries(s); } catch { /* disposed */ }
      }
    };
  }, [bbandsLines, colorTheme]);

  // Support / Resistance price lines
  useEffect(() => {
    const candle = candleRef.current;
    if (!candle || !srLevels) return;

    clearPriceLines();

    try {
      const pls: ReturnType<typeof candle.createPriceLine>[] = [];
      for (const level of srLevels) {
        const isSupport = level.label.startsWith("S");
        const isPivot = level.label === "PP";
        const color = isPivot ? colors.SR.pivot : isSupport ? colors.SR.support : colors.SR.resistance;
        const pl = candle.createPriceLine({
          price: level.price,
          color,
          lineWidth: 1,
          lineStyle: LineStyle.Dotted,
          axisLabelVisible: true,
          title: level.label,
        });
        pls.push(pl);
      }
      priceLineIdsRef.current = pls;
    } catch {
      return;
    }

    return () => {
      clearPriceLines();
    };
  }, [srLevels, clearPriceLines, colorTheme]);

  // Load more historical data when scrolling near the left edge
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    const handler = () => {
      try {
        const range = chart.timeScale().getVisibleLogicalRange();
        if (range && range.from < 10) {
          onLoadMoreRef.current?.();
        }
      } catch { /* disposed */ }
    };

    try {
      chart.timeScale().subscribeVisibleLogicalRangeChange(handler);
    } catch { return; }

    return () => {
      try { chart.timeScale().unsubscribeVisibleLogicalRangeChange(handler); } catch { /* disposed */ }
    };
  }, [colorTheme]);

  return <div ref={containerRef} className="w-full" />;
}
