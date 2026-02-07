"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { FearGreedDetail } from "@/components/sentiment/fear-greed-detail";
import { FearGreedChart } from "@/components/charts/fear-greed-chart";
import { FundingRateTable } from "@/components/sentiment/funding-rate-table";
import { OpenInterestCard } from "@/components/sentiment/open-interest-card";
import { LongShortRatioCard } from "@/components/sentiment/long-short-ratio-card";
import { TakerVolumeCard } from "@/components/sentiment/taker-volume-card";
import { NetworkStatsCard } from "@/components/onchain/network-stats-card";
import { useFearGreed } from "@/lib/hooks/use-fear-greed";
import { Skeleton } from "@/components/ui/skeleton";

export default function SentimentPage() {
  const { data: fgData, isLoading: fgLoading } = useFearGreed(30);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">
        <span className="border-l-2 border-primary pl-2">市場情緒</span>
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <FearGreedDetail />
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>恐懼貪婪走勢 (30 天)</CardTitle>
          </CardHeader>
          <CardContent>
            {fgLoading ? (
              <Skeleton className="h-[250px] w-full" />
            ) : fgData ? (
              <FearGreedChart history={fgData.history} />
            ) : (
              <p className="text-muted-foreground">無法載入數據</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Separator />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <FundingRateTable symbol="BTC" />
        <FundingRateTable symbol="ETH" />
      </div>

      <Separator />

      <h2 className="text-lg font-semibold">
        <span className="border-l-2 border-primary pl-2">衍生品指標 (BTC)</span>
      </h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <OpenInterestCard symbol="BTC" />
        <LongShortRatioCard symbol="BTC" />
        <TakerVolumeCard symbol="BTC" />
      </div>

      <Separator />

      <NetworkStatsCard />
    </div>
  );
}
