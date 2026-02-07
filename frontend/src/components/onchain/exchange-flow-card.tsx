"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SignalBadge } from "@/components/indicators/signal-badge";
import { InfoTooltip } from "@/components/indicators/info-tooltip";
import { useExchangeFlow } from "@/lib/hooks/use-onchain";
import { onchainInfo } from "@/lib/utils/indicator-info";

const trendLabels: Record<string, string> = {
  accumulation: "囤幣",
  distribution: "拋售",
  neutral: "中性",
};

export function ExchangeFlowCard({ asset }: { asset: string }) {
  const { data, isLoading } = useExchangeFlow(asset);

  if (isLoading) return <Skeleton className="h-32 w-full" />;
  if (!data) return null;

  const isEmpty = data.latest_netflow === 0 && data.avg_netflow_7d === 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-1.5 text-base">
            交易所流入流出
            <InfoTooltip info={onchainInfo.exchangeFlow} />
          </CardTitle>
          {!isEmpty && <SignalBadge signal={data.signal} />}
        </div>
      </CardHeader>
      <CardContent>
        {isEmpty ? (
          <p className="text-sm text-muted-foreground">需要 Glassnode API key</p>
        ) : (
          <div className="space-y-1 text-sm">
            <p>淨流量: <span className="font-semibold tabular-nums">{data.latest_netflow.toFixed(2)}</span></p>
            <p>7 日均值: <span className="tabular-nums">{data.avg_netflow_7d.toFixed(2)}</span></p>
            <p>趨勢: {trendLabels[data.trend] ?? data.trend}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
