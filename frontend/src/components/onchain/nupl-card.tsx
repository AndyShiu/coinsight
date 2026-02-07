"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SignalBadge } from "@/components/indicators/signal-badge";
import { InfoTooltip } from "@/components/indicators/info-tooltip";
import { useNupl } from "@/lib/hooks/use-onchain";
import { onchainInfo } from "@/lib/utils/indicator-info";

const phaseLabels: Record<string, { label: string; color: string }> = {
  capitulation: { label: "投降", color: "text-red-500" },
  hope: { label: "希望", color: "text-emerald-400" },
  optimism: { label: "樂觀", color: "text-yellow-400" },
  belief: { label: "信念", color: "text-orange-400" },
  euphoria: { label: "狂熱", color: "text-red-500" },
};

export function NuplCard({ asset }: { asset: string }) {
  const { data, isLoading } = useNupl(asset);

  if (isLoading) return <Skeleton className="h-32 w-full" />;
  if (!data) return null;

  const isEmpty = data.current_nupl === 0;
  const phase = phaseLabels[data.phase];

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-1.5 text-base">
            NUPL
            <InfoTooltip info={onchainInfo.nupl} />
          </CardTitle>
          {!isEmpty && <SignalBadge signal={data.signal} />}
        </div>
      </CardHeader>
      <CardContent>
        {isEmpty ? (
          <p className="text-sm text-muted-foreground">需要 Glassnode API key</p>
        ) : (
          <div className="space-y-1">
            <p className="text-2xl font-bold tabular-nums">{data.current_nupl.toFixed(4)}</p>
            {phase && <p className={`text-sm ${phase.color}`}>{phase.label}</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
