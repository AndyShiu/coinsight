"use client";

import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useFearGreed } from "@/lib/hooks/use-fear-greed";
import { fearGreedColor } from "@/lib/utils/signal-colors";
import { InfoTooltip } from "@/components/indicators/info-tooltip";
import { sentimentInfo } from "@/lib/utils/indicator-info";

/** 0-100 → SVG 半圓儀表角度 (180°) */
function GaugeMeter({ value, color }: { value: number; color: string }) {
  const r = 36;
  const cx = 44;
  const cy = 42;
  const circumference = Math.PI * r;
  const pct = Math.max(0, Math.min(value, 100)) / 100;
  const offset = circumference * (1 - pct);

  return (
    <svg width={88} height={50} viewBox="0 0 88 50" className="shrink-0">
      {/* track */}
      <path
        d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        fill="none"
        stroke="currentColor"
        strokeWidth={6}
        className="text-muted/40"
      />
      {/* value arc */}
      <path
        d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        fill="none"
        stroke="currentColor"
        strokeWidth={6}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className={color}
      />
      <text x={cx} y={cy - 4} textAnchor="middle" className={`text-lg font-bold fill-current ${color}`}>
        {value}
      </text>
    </svg>
  );
}

/** 迷你走勢折線 (30 天 sparkline) */
function Sparkline({ data, color }: { data: number[]; color: string }) {
  const h = 36;
  const w = 120;
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * (h - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="shrink-0">
      {/* 50 參考線 */}
      <line
        x1={0} y1={h - ((50 - min) / range) * (h - 4) - 2}
        x2={w} y2={h - ((50 - min) / range) * (h - 4) - 2}
        stroke="currentColor"
        strokeWidth={0.5}
        strokeDasharray="3 3"
        className="text-muted-foreground/30"
      />
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinejoin="round"
        className={color}
      />
    </svg>
  );
}

export function FearGreedBanner() {
  const { data, isLoading } = useFearGreed();

  const historyValues = useMemo(() => {
    if (!data?.history) return [];
    return [...data.history].reverse().map((e) => e.value);
  }, [data?.history]);

  if (isLoading) {
    return <Skeleton className="h-16 w-full" />;
  }

  if (!data) return null;

  const color = fearGreedColor(data.current_value);

  return (
    <Card>
      <CardContent className="flex items-center gap-4 py-3 px-5">
        {/* 左: 儀表 */}
        <GaugeMeter value={data.current_value} color={color} />

        {/* 中: 標籤 + 統計 */}
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
            恐懼貪婪指數
            <InfoTooltip info={sentimentInfo.fearGreed} />
          </p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className={`text-sm font-semibold ${color}`}>{data.current_class}</span>
            <span>7d: <span className="text-foreground">{data.avg_7d.toFixed(0)}</span></span>
            <span>30d: <span className="text-foreground">{data.avg_30d.toFixed(0)}</span></span>
            <span>趨勢: <span className="text-foreground">{data.trend}</span></span>
          </div>
        </div>

        {/* 右: 30 天走勢 */}
        <div className="hidden sm:flex flex-col items-end gap-0.5">
          <span className="text-[9px] text-muted-foreground/50">30 天走勢</span>
          <Sparkline data={historyValues} color={color} />
        </div>
      </CardContent>
    </Card>
  );
}
