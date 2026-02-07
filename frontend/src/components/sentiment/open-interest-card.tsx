"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SignalBadge } from "@/components/indicators/signal-badge";
import { InfoTooltip } from "@/components/indicators/info-tooltip";
import { useOpenInterest } from "@/lib/hooks/use-derivatives";
import { formatLargeNumber } from "@/lib/utils/format";
import { sentimentInfo } from "@/lib/utils/indicator-info";
import { MiniAreaChart } from "./mini-area-chart";

const trendLabels: Record<string, string> = {
  rising: "上升",
  falling: "下降",
  stable: "穩定",
};

export function OpenInterestCard({ symbol = "BTC" }: { symbol?: string }) {
  const { data, isLoading } = useOpenInterest(symbol);

  if (isLoading) return <Skeleton className="h-48 w-full" />;
  if (!data) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-1.5 text-base">
            未平倉合約
            <InfoTooltip info={sentimentInfo.openInterest} />
          </CardTitle>
          <SignalBadge signal={data.signal} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p className="text-lg font-semibold tabular-nums">
            ${formatLargeNumber(data.current_oi_value)}
          </p>
          <div className="text-sm space-y-1 text-muted-foreground">
            <p>
              變化:{" "}
              <span
                className={`font-medium tabular-nums ${
                  data.change_pct >= 0 ? "text-emerald-500" : "text-red-500"
                }`}
              >
                {data.change_pct >= 0 ? "+" : ""}
                {data.change_pct.toFixed(2)}%
              </span>
            </p>
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
                value: h.open_interest_value,
              }))}
              color="#3b82f6"
              height={80}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
