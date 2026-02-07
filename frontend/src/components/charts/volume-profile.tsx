"use client";

import { useEffect, useRef } from "react";
import type { IChartApi, ISeriesApi } from "lightweight-charts";
import type { OhlcvEntry } from "@/lib/types/market";
import { VOLUME_PROFILE } from "./chart-colors";

interface VolumeProfileProps {
  chartApi: IChartApi | null;
  candleSeries: ISeriesApi<"Candlestick"> | null;
  data: OhlcvEntry[];
  enabled: boolean;
}

const NUM_BINS = 40;
const MAX_BAR_WIDTH_RATIO = 0.25; // max 25% of chart width

export function VolumeProfile({ chartApi, candleSeries, data, enabled }: VolumeProfileProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !chartApi || !candleSeries || !enabled || !data.length) {
      // Clear canvas if disabled
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      return;
    }

    const draw = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Size canvas to match chart
      let chartEl: HTMLElement;
      let rect: DOMRect;
      try {
        chartEl = chartApi.chartElement();
        rect = chartEl.getBoundingClientRect();
      } catch {
        return; // chart disposed
      }
      canvas.width = rect.width;
      canvas.height = rect.height;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Get visible time range
      let visibleRange;
      try {
        visibleRange = chartApi.timeScale().getVisibleRange();
      } catch {
        return; // chart disposed
      }
      if (!visibleRange) return;

      const startTime = visibleRange.from as number;
      const endTime = visibleRange.to as number;

      // Filter data to visible range
      const visible = data.filter((d) => d.time >= startTime && d.time <= endTime);
      if (visible.length === 0) return;

      // Calculate price range
      let minPrice = Infinity;
      let maxPrice = -Infinity;
      for (const d of visible) {
        if (d.low < minPrice) minPrice = d.low;
        if (d.high > maxPrice) maxPrice = d.high;
      }

      if (maxPrice <= minPrice) return;

      const binSize = (maxPrice - minPrice) / NUM_BINS;
      const bins = new Float64Array(NUM_BINS);

      // Distribute volume to bins
      for (const d of visible) {
        const lo = Math.max(0, Math.floor((d.low - minPrice) / binSize));
        const hi = Math.min(NUM_BINS - 1, Math.floor((d.high - minPrice) / binSize));
        const span = hi - lo + 1;
        const volPerBin = d.volume / span;
        for (let i = lo; i <= hi; i++) {
          bins[i] += volPerBin;
        }
      }

      // Find max volume (POC)
      let maxVol = 0;
      let pocIdx = 0;
      for (let i = 0; i < NUM_BINS; i++) {
        if (bins[i] > maxVol) {
          maxVol = bins[i];
          pocIdx = i;
        }
      }
      if (maxVol === 0) return;

      const maxBarWidth = canvas.width * MAX_BAR_WIDTH_RATIO;

      // Draw bins from right edge
      try {
        for (let i = 0; i < NUM_BINS; i++) {
          const price = minPrice + (i + 0.5) * binSize;
          const y = candleSeries.priceToCoordinate(price);
          if (y == null) continue;

          const barWidth = (bins[i] / maxVol) * maxBarWidth;
          const barHeight = Math.max(2, (canvas.height / NUM_BINS) * 0.8);
          const x = canvas.width - barWidth - 55; // offset from right price scale

          ctx.fillStyle = i === pocIdx ? VOLUME_PROFILE.poc : VOLUME_PROFILE.bar;
          ctx.fillRect(x, y - barHeight / 2, barWidth, barHeight);
        }
      } catch {
        return; // chart disposed
      }
    };

    draw();

    // Redraw on range change
    const handler = () => { requestAnimationFrame(draw); };
    try {
      chartApi.timeScale().subscribeVisibleLogicalRangeChange(handler);
    } catch {
      return; // chart disposed
    }

    return () => {
      try { chartApi.timeScale().unsubscribeVisibleLogicalRangeChange(handler); } catch { /* disposed */ }
    };
  }, [chartApi, candleSeries, data, enabled]);

  if (!enabled) return null;

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 1 }}
    />
  );
}
