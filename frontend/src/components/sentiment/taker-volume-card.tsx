"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SignalBadge } from "@/components/indicators/signal-badge";
import { InfoTooltip } from "@/components/indicators/info-tooltip";
import { useTakerVolume } from "@/lib/hooks/use-derivatives";
import { formatLargeNumber } from "@/lib/utils/format";
import { sentimentInfo } from "@/lib/utils/indicator-info";
import { MiniAreaChart } from "./mini-area-chart";

const pressureLabels: Record<string, string> = {
  buying: "買壓",
  selling: "賣壓",
  balanced: "均衡",
};

export function TakerVolumeCard({ symbol = "BTC" }: { symbol?: string }) {
  const { data, isLoading } = useTakerVolume(symbol);

  if (isLoading) return <Skeleton className="h-48 w-full" />;
  if (!data) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-1.5 text-base">
            主動買賣量
            <InfoTooltip info={sentimentInfo.takerVolume} />
          </CardTitle>
          <SignalBadge signal={data.signal} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p className="text-lg font-semibold tabular-nums">
            {data.current_ratio.toFixed(4)}
          </p>
          <div className="flex gap-4 text-sm">
            <div>
              <span className="text-emerald-500 font-medium">
                {formatLargeNumber(data.buy_vol)}
              </span>
              <span className="text-muted-foreground ml-1">買入</span>
            </div>
            <div>
              <span className="text-red-500 font-medium">
                {formatLargeNumber(data.sell_vol)}
              </span>
              <span className="text-muted-foreground ml-1">賣出</span>
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            <p>
              壓力方向:{" "}
              <span className="text-foreground font-medium">
                {pressureLabels[data.pressure] ?? data.pressure}
              </span>
            </p>
          </div>
          {data.history.length > 0 && (
            <MiniAreaChart
              data={data.history.map((h) => ({
                time: h.timestamp,
                value: h.buy_sell_ratio,
              }))}
              color="#8b5cf6"
              height={80}
              referenceY={1.0}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
