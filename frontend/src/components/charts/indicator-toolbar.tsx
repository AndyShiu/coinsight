"use client";

import { Button } from "@/components/ui/button";
import { InfoTooltip } from "@/components/indicators/info-tooltip";
import { useAppStore } from "@/lib/stores/app-store";
import { chartOverlayInfo, chartSubChartInfo } from "@/lib/utils/indicator-info";
import type { OverlayIndicator, SubChartIndicator } from "@/lib/types/technical";

const overlayButtons: { id: OverlayIndicator; label: string }[] = [
  { id: "ema", label: "EMA" },
  { id: "bbands", label: "BB" },
  { id: "sr", label: "S/R" },
  { id: "vpvr", label: "VPVR" },
];

const subChartButtons: { id: SubChartIndicator; label: string }[] = [
  { id: "rsi", label: "RSI" },
  { id: "kd", label: "KD" },
  { id: "macd", label: "MACD" },
];

export function IndicatorToolbar() {
  const enabledOverlays = useAppStore((s) => s.enabledOverlays);
  const enabledSubCharts = useAppStore((s) => s.enabledSubCharts);
  const toggleOverlay = useAppStore((s) => s.toggleOverlay);
  const toggleSubChart = useAppStore((s) => s.toggleSubChart);

  return (
    <div className="flex items-center gap-1.5 px-2 py-1.5 flex-wrap">
      <span className="text-xs text-muted-foreground mr-1">Overlays</span>
      {overlayButtons.map((btn) => (
        <span key={btn.id} className="inline-flex items-center gap-0.5">
          <Button
            variant={enabledOverlays.has(btn.id) ? "secondary" : "ghost"}
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={() => toggleOverlay(btn.id)}
          >
            {btn.label}
          </Button>
          {chartOverlayInfo[btn.id] && (
            <InfoTooltip info={chartOverlayInfo[btn.id]} />
          )}
        </span>
      ))}
      <span className="text-xs text-muted-foreground ml-2 mr-1">Sub</span>
      {subChartButtons.map((btn) => (
        <span key={btn.id} className="inline-flex items-center gap-0.5">
          <Button
            variant={enabledSubCharts.has(btn.id) ? "secondary" : "ghost"}
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={() => toggleSubChart(btn.id)}
          >
            {btn.label}
          </Button>
          {chartSubChartInfo[btn.id] && (
            <InfoTooltip info={chartSubChartInfo[btn.id]} />
          )}
        </span>
      ))}
    </div>
  );
}
