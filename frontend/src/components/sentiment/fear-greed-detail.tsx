"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SignalBadge } from "@/components/indicators/signal-badge";
import { InfoTooltip } from "@/components/indicators/info-tooltip";
import { useFearGreed } from "@/lib/hooks/use-fear-greed";
import { fearGreedColor } from "@/lib/utils/signal-colors";
import { sentimentInfo } from "@/lib/utils/indicator-info";

export function FearGreedDetail() {
  const { data, isLoading } = useFearGreed(30);

  if (isLoading) return <Skeleton className="h-40 w-full" />;
  if (!data) return null;

  const color = fearGreedColor(data.current_value);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-1.5">
            恐懼貪婪指數
            <InfoTooltip info={sentimentInfo.fearGreed} />
          </CardTitle>
          <SignalBadge signal={data.signal} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          <div>
            <p className={`text-5xl font-bold ${color}`}>{data.current_value}</p>
            <p className={`text-sm ${color} mt-1`}>{data.current_class}</p>
          </div>
          <div className="text-sm space-y-1 text-muted-foreground">
            <p>7 日均值: <span className="text-foreground font-medium">{data.avg_7d.toFixed(1)}</span></p>
            <p>30 日均值: <span className="text-foreground font-medium">{data.avg_30d.toFixed(1)}</span></p>
            <p>趨勢: <span className="text-foreground font-medium">{data.trend}</span></p>
            <p>強度: <span className="text-foreground font-medium">{(data.strength * 100).toFixed(0)}%</span></p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
