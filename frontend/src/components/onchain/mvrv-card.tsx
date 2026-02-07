"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SignalBadge } from "@/components/indicators/signal-badge";
import { InfoTooltip } from "@/components/indicators/info-tooltip";
import { useMvrv } from "@/lib/hooks/use-onchain";
import { onchainInfo } from "@/lib/utils/indicator-info";

const zoneLabels: Record<string, { label: string; color: string }> = {
  undervalued: { label: "低估區", color: "text-emerald-400" },
  fair: { label: "合理區間", color: "text-yellow-400" },
  overvalued: { label: "高估區", color: "text-red-400" },
  extreme: { label: "極度過熱", color: "text-red-500" },
};

export function MvrvCard({ asset }: { asset: string }) {
  const { data, isLoading } = useMvrv(asset);

  if (isLoading) return <Skeleton className="h-32 w-full" />;
  if (!data) return null;

  const isEmpty = data.current_mvrv === 0;
  const zone = zoneLabels[data.zone];

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-1.5 text-base">
            MVRV
            <InfoTooltip info={onchainInfo.mvrv} />
          </CardTitle>
          {!isEmpty && <SignalBadge signal={data.signal} />}
        </div>
      </CardHeader>
      <CardContent>
        {isEmpty ? (
          <p className="text-sm text-muted-foreground">需要 Glassnode API key</p>
        ) : (
          <div className="space-y-1">
            <p className="text-2xl font-bold tabular-nums">{data.current_mvrv.toFixed(4)}</p>
            {zone && <p className={`text-sm ${zone.color}`}>{zone.label}</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
