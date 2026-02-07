"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useBtcNetwork } from "@/lib/hooks/use-onchain";
import { InfoTooltip, SimpleTooltip } from "@/components/indicators/info-tooltip";
import { formatLargeNumber } from "@/lib/utils/format";
import { onchainInfo, networkStatInfo } from "@/lib/utils/indicator-info";

const statLabels: Record<string, string> = {
  hash_rate: "Hash Rate",
  difficulty: "難度",
  active_addresses: "活躍地址",
  transaction_count: "交易數",
  mempool_size: "記憶體池",
};

export function NetworkStatsCard() {
  const { data, isLoading } = useBtcNetwork();

  if (isLoading) return <Skeleton className="h-48 w-full" />;
  if (!data) return null;

  const entries = Object.entries(data).filter(([, v]) => v != null) as [string, number][];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-1.5">
          BTC 網路統計
          <InfoTooltip info={onchainInfo.network} />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {entries.map(([key, value]) => (
            <div key={key}>
              <p className="text-xs text-muted-foreground">
                {networkStatInfo[key] ? (
                  <SimpleTooltip text={networkStatInfo[key]}>
                    <span className="cursor-help border-b border-dotted border-muted-foreground/50">
                      {statLabels[key] ?? key}
                    </span>
                  </SimpleTooltip>
                ) : (
                  statLabels[key] ?? key
                )}
              </p>
              <p className="text-sm font-semibold tabular-nums">{formatLargeNumber(value)}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
