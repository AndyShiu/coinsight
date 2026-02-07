"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SignalBadge } from "@/components/indicators/signal-badge";
import { InfoTooltip } from "@/components/indicators/info-tooltip";
import { useLongShortRatio } from "@/lib/hooks/use-derivatives";
import { sentimentInfo } from "@/lib/utils/indicator-info";
import { MiniAreaChart } from "./mini-area-chart";

const trendLabels: Record<string, string> = {
  more_longs: "偏多",
  more_shorts: "偏空",
  balanced: "均衡",
};

export function LongShortRatioCard({ symbol = "BTC" }: { symbol?: string }) {
  const { data, isLoading } = useLongShortRatio(symbol);

  if (isLoading) return <Skeleton className="h-48 w-full" />;
  if (!data) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-1.5 text-base">
            多空比
            <InfoTooltip info={sentimentInfo.longShortRatio} />
          </CardTitle>
          <SignalBadge signal={data.signal} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p className="text-lg font-semibold tabular-nums">
            {data.current_ratio.toFixed(2)}
          </p>
          <div className="flex gap-4 text-sm">
            <div>
              <span className="text-emerald-500 font-medium">
                {(data.long_pct * 100).toFixed(1)}%
              </span>
              <span className="text-muted-foreground ml-1">做多</span>
            </div>
            <div>
              <span className="text-red-500 font-medium">
                {(data.short_pct * 100).toFixed(1)}%
              </span>
              <span className="text-muted-foreground ml-1">做空</span>
            </div>
          </div>
          {/* 多空比色條 */}
          <div className="h-2 rounded-full bg-red-500/30 overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all"
              style={{ width: `${data.long_pct * 100}%` }}
            />
          </div>
          <div className="text-sm text-muted-foreground">
            <p>
              趨勢:{" "}
              <span className="text-foreground font-medium">
                {trendLabels[data.trend] ?? data.trend}
              </span>
            </p>
          </div>
          {data.history.length > 0 && (
            <MiniAreaChart
              data={data.history.map((h) => ({
                time: h.timestamp,
                value: h.long_short_ratio,
              }))}
              color="#eab308"
              height={80}
              referenceY={1.0}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
