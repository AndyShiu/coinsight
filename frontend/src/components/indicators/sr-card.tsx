"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InfoTooltip } from "./info-tooltip";
import { chartOverlayInfo } from "@/lib/utils/indicator-info";
import { formatPrice } from "@/lib/utils/format";
import type { SupportResistanceLevel } from "@/lib/types/technical";

interface SrCardProps {
  levels: SupportResistanceLevel[];
  currentPrice?: number;
}

const LEVEL_ORDER = ["R2", "R1", "PP", "S1", "S2"];

const LEVEL_LABELS: Record<string, string> = {
  R2: "壓力 2",
  R1: "壓力 1",
  PP: "樞軸點",
  S1: "支撐 1",
  S2: "支撐 2",
};

function getTrend(price: number, levels: SupportResistanceLevel[]) {
  const pp = levels.find((l) => l.label === "PP");
  const r1 = levels.find((l) => l.label === "R1");
  const s1 = levels.find((l) => l.label === "S1");
  if (!pp) return { signal: "neutral" as const, text: "無法判斷" };

  if (r1 && price > r1.price) return { signal: "bullish" as const, text: "強勢偏多 (突破 R1)" };
  if (price > pp.price) return { signal: "bullish" as const, text: "偏多 (位於 PP 上方)" };
  if (s1 && price < s1.price) return { signal: "bearish" as const, text: "弱勢偏空 (跌破 S1)" };
  if (price < pp.price) return { signal: "bearish" as const, text: "偏空 (位於 PP 下方)" };
  return { signal: "neutral" as const, text: "接近樞軸點" };
}

const SIGNAL_STYLES = {
  bullish: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30" },
  bearish: { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/30" },
  neutral: { bg: "bg-zinc-500/10", text: "text-zinc-400", border: "border-zinc-500/30" },
};

export function SrCard({ levels, currentPrice }: SrCardProps) {
  const sortedLevels = LEVEL_ORDER
    .map((label) => levels.find((l) => l.label === label))
    .filter(Boolean) as SupportResistanceLevel[];

  const trend = currentPrice != null ? getTrend(currentPrice, levels) : null;
  const style = trend ? SIGNAL_STYLES[trend.signal] : null;

  return (
    <Card>
      <CardContent className="py-3 px-4">
        <div className="flex items-center justify-between mb-3">
          <span className="flex items-center gap-1.5 text-sm font-medium">
            支撐 / 壓力位
            <InfoTooltip info={chartOverlayInfo.sr} />
          </span>
          {trend && style && (
            <Badge variant="outline" className={`${style.bg} ${style.text} ${style.border}`}>
              {trend.text}
            </Badge>
          )}
        </div>

        <div className="space-y-1.5">
          {sortedLevels.map((level) => {
            const isResistance = level.label.startsWith("R");
            const isPP = level.label === "PP";
            const colorClass = isPP
              ? "text-amber-400"
              : isResistance
                ? "text-red-400"
                : "text-emerald-400";

            // Highlight the zone the price is in
            const isNearby =
              currentPrice != null &&
              Math.abs(currentPrice - level.price) / level.price < 0.02;

            return (
              <div
                key={level.label}
                className={`flex items-center justify-between py-1 px-2 rounded text-sm ${
                  isNearby ? "bg-muted/60" : ""
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`font-mono text-xs w-6 ${colorClass}`}>{level.label}</span>
                  <span className="text-muted-foreground text-xs">
                    {LEVEL_LABELS[level.label] ?? level.label}
                  </span>
                </div>
                <span className={`font-semibold tabular-nums ${colorClass}`}>
                  {formatPrice(level.price)}
                </span>
              </div>
            );
          })}
        </div>

        {currentPrice != null && (
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-border text-xs text-muted-foreground">
            <span>目前價格</span>
            <span className="font-semibold text-foreground tabular-nums">
              {formatPrice(currentPrice)}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
