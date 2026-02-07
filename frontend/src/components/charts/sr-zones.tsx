"use client";

import { useEffect, useRef } from "react";
import type { IChartApi, ISeriesApi } from "lightweight-charts";
import type { SupportResistanceLevel } from "@/lib/types/technical";
import { SR } from "./chart-colors";

interface SrZonesProps {
  chartApi: IChartApi | null;
  candleSeries: ISeriesApi<"Candlestick"> | null;
  srLevels?: SupportResistanceLevel[];
  enabled: boolean;
}

/**
 * S/R 區間色塊 — 在各支撐壓力位之間繪製半透明背景色
 * R2↑ 強壓力(深紅) | R1~R2 壓力(紅) | PP~R1 弱壓力(淡紅)
 * S1~PP 弱支撐(淡綠) | S2~S1 支撐(綠) | ↓S2 強支撐(深綠)
 */
export function SrZones({ chartApi, candleSeries, srLevels, enabled }: SrZonesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !chartApi || !candleSeries || !enabled || !srLevels?.length) {
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      return;
    }

    // Build level map: { S2, S1, PP, R1, R2 }
    const levelMap: Record<string, number> = {};
    for (const l of srLevels) {
      levelMap[l.label] = l.price;
    }

    const { S2, S1, PP, R1, R2 } = levelMap;
    if (S2 == null || S1 == null || PP == null || R1 == null || R2 == null) return;

    // Zone definitions: [topPrice, bottomPrice, color]
    const zones: [number | null, number, number, string][] = [
      // [topPrice (null=chart top), bottomPrice, alpha-multiplier, baseColor]
      [null, R2, 0.12, SR.resistance],  // above R2 — strong resistance
      [R2, R1, 0.08, SR.resistance],    // R1~R2 — resistance
      [R1, PP, 0.04, SR.resistance],    // PP~R1 — mild resistance
      [PP, S1, 0.04, SR.support],       // S1~PP — mild support
      [S1, S2, 0.08, SR.support],       // S2~S1 — support
      [S2, null as unknown as number, 0.12, SR.support], // below S2 — strong support
    ];

    const draw = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      let chartEl: HTMLElement;
      let rect: DOMRect;
      try {
        chartEl = chartApi.chartElement();
        rect = chartEl.getBoundingClientRect();
      } catch {
        return;
      }

      canvas.width = rect.width;
      canvas.height = rect.height;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      try {
        for (const [topPrice, botPrice, alpha, baseColor] of zones) {
          // Convert prices to Y coordinates
          const topY = topPrice != null
            ? candleSeries.priceToCoordinate(topPrice)
            : 0;
          const botY = botPrice != null
            ? candleSeries.priceToCoordinate(botPrice)
            : canvas.height;

          if (topY == null || botY == null) continue;

          const y1 = Math.max(0, Math.min(topY, botY));
          const y2 = Math.min(canvas.height, Math.max(topY, botY));
          const h = y2 - y1;
          if (h <= 0) continue;

          // Parse hex color to rgba
          ctx.fillStyle = hexToRgba(baseColor, alpha);
          ctx.fillRect(0, y1, canvas.width - 55, h); // offset from right price scale
        }
      } catch {
        return;
      }
    };

    draw();

    const handler = () => {
      requestAnimationFrame(draw);
    };
    try {
      chartApi.timeScale().subscribeVisibleLogicalRangeChange(handler);
    } catch {
      return;
    }

    return () => {
      try {
        chartApi.timeScale().unsubscribeVisibleLogicalRangeChange(handler);
      } catch {
        /* disposed */
      }
    };
  }, [chartApi, candleSeries, srLevels, enabled]);

  if (!enabled) return null;

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}

/** Hex (#rrggbb) → rgba string */
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
