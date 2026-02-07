"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTechnical } from "@/lib/hooks/use-technical";
import { usePrices } from "@/lib/hooks/use-prices";
import { SignalBadge } from "@/components/indicators/signal-badge";
import { formatPrice } from "@/lib/utils/format";
export function QuickSignalCard({ symbol, timeframe = "1d" }: { symbol: string; timeframe?: string }) {
  const { data: techData, isLoading: techLoading } = useTechnical(symbol, timeframe);
  const { data: priceData, isLoading: priceLoading } = usePrices([symbol]);

  if (techLoading || priceLoading) {
    return <Skeleton className="h-28 w-full" />;
  }

  const price = priceData?.[0]?.price;
  const score = techData?.overall_score ?? 0;
  const signal = techData?.overall_signal ?? "neutral";

  const barWidth = Math.abs(score) * 50;
  const barLeft = score >= 0 ? 50 : 50 - barWidth;
  const barColor = score >= 0 ? "bg-emerald-500" : "bg-red-500";

  return (
    <Link href={`/symbol/${symbol}${timeframe !== "1d" ? `?tf=${timeframe}` : ""}`}>
      <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
        <CardContent className="py-4 px-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-lg font-bold text-primary">{symbol}</span>
            <SignalBadge signal={signal} />
          </div>
          {price != null && (
            <p className="text-xl font-semibold mb-3">{formatPrice(price)}</p>
          )}
          <div className="relative h-2 rounded-full bg-muted overflow-hidden">
            <div className="absolute top-0 left-1/2 w-px h-full bg-muted-foreground/30" />
            <div
              className={`absolute top-0 h-full rounded-full ${barColor} transition-all`}
              style={{ left: `${barLeft}%`, width: `${barWidth}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>看空</span>
            <span>評分: {score.toFixed(2)} ({timeframe})</span>
            <span>看多</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
