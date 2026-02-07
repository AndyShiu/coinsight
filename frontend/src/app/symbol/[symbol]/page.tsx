"use client";

import { use, useRef, useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { SignalGauge } from "@/components/charts/signal-gauge";
import { IndicatorGrid } from "@/components/indicators/indicator-grid";
import { SrCard } from "@/components/indicators/sr-card";
import { ScoringMethod } from "@/components/indicators/scoring-method";
import { ShareButton } from "@/components/share/share-button";
import { FundingRateTable } from "@/components/sentiment/funding-rate-table";
import { OpenInterestCard } from "@/components/sentiment/open-interest-card";
import { LongShortRatioCard } from "@/components/sentiment/long-short-ratio-card";
import { TakerVolumeCard } from "@/components/sentiment/taker-volume-card";
import { ExchangeFlowCard } from "@/components/onchain/exchange-flow-card";
import { MvrvCard } from "@/components/onchain/mvrv-card";
import { NuplCard } from "@/components/onchain/nupl-card";
import { usePrices } from "@/lib/hooks/use-prices";
import { useOhlcv } from "@/lib/hooks/use-ohlcv";
import { useTechnical } from "@/lib/hooks/use-technical";
import { useSupportResistance } from "@/lib/hooks/use-indicator-series";
import { useFundingRates } from "@/lib/hooks/use-funding-rates";
import { useOpenInterest, useLongShortRatio, useTakerVolume } from "@/lib/hooks/use-derivatives";
import { useUpdateWatchlist } from "@/lib/hooks/use-watchlist";
import { useQuery } from "@tanstack/react-query";
import { useAppStore } from "@/lib/stores/app-store";
import { useMarketOverview } from "@/lib/hooks/use-market-overview";
import { searchCoins } from "@/lib/api/market";
import { formatPrice, formatLargeNumber } from "@/lib/utils/format";
import type { DerivativeSummary } from "@/components/share/summary-card-canvas";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";

const ChartContainer = dynamic(
  () => import("@/components/charts/chart-container").then((m) => m.ChartContainer),
  { ssr: false, loading: () => <Skeleton className="h-[400px] w-full" /> },
);

const TF_GROUPS = [
  { label: "短線", tfs: ["15m", "30m", "1h"] },
  { label: "波段", tfs: ["2h", "4h", "12h"] },
  { label: "中長線", tfs: ["1d", "3d", "1w"] },
] as const;

const ALL_TFS = TF_GROUPS.flatMap((g) => g.tfs) as unknown as string[];

export default function SymbolPage({
  params,
  searchParams,
}: {
  params: Promise<{ symbol: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { symbol } = use(params);
  const { tf } = use(searchParams);
  const upperSymbol = symbol.toUpperCase();
  const pageContainerRef = useRef<HTMLDivElement>(null);

  const timeframe = useAppStore((s) => s.timeframe);
  const setTimeframe = useAppStore((s) => s.setTimeframe);

  // On mount: set timeframe from URL ?tf= param, or reset to "1d"
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const target = typeof tf === "string" && ALL_TFS.includes(tf) ? tf : "1d";
    setTimeframe(target);
  }, []); // run once on mount

  const watchlist = useAppStore((s) => s.watchlist);
  const updateWatchlist = useUpdateWatchlist();
  const isInWatchlist = watchlist.includes(upperSymbol);
  const toggleWatchlist = () => {
    if (isInWatchlist) {
      if (watchlist.length > 1) {
        updateWatchlist.mutate(watchlist.filter((s) => s !== upperSymbol));
      }
    } else {
      updateWatchlist.mutate([...watchlist, upperSymbol]);
    }
  };

  const { data: priceData } = usePrices([upperSymbol]);
  const { data: ohlcvData, isLoading: ohlcvLoading } = useOhlcv(upperSymbol, timeframe);
  const { data: techData, isLoading: techLoading } = useTechnical(upperSymbol, timeframe);
  const { data: srData } = useSupportResistance(upperSymbol, timeframe, true);
  const { data: fundingData } = useFundingRates(upperSymbol);
  const { data: oiData } = useOpenInterest(upperSymbol);
  const { data: lsData } = useLongShortRatio(upperSymbol);
  const { data: tvData } = useTakerVolume(upperSymbol);
  const { data: market } = useMarketOverview(100);

  const price = priceData?.[0]?.price;
  const marketImage = market?.coins?.find((c) => c.symbol.toUpperCase() === upperSymbol)?.image;

  // Fallback: search API for coins not in top 100
  const { data: searchData } = useQuery({
    queryKey: ["coin-icon-fallback", upperSymbol],
    queryFn: () => searchCoins(upperSymbol, 1),
    enabled: !marketImage,
    staleTime: 10 * 60_000,
  });
  const coinImage = marketImage ?? searchData?.[0]?.thumb ?? null;

  // Detect scroll → show compact sticky bar
  const headerRef = useRef<HTMLDivElement>(null);
  const [isStuck, setIsStuck] = useState(false);
  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    const scrollRoot = header.closest("main");
    if (!scrollRoot) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsStuck(!entry.isIntersecting),
      { root: scrollRoot, threshold: 0 },
    );
    observer.observe(header);
    return () => observer.disconnect();
  }, []);

  // Build derivatives summary for share card
  const derivativeSummaries: DerivativeSummary[] = [];
  if (oiData) {
    derivativeSummaries.push({
      name: "OI",
      signal: oiData.signal,
      strength: oiData.strength,
      label: "未平倉合約",
      value: formatLargeNumber(oiData.current_oi_value),
    });
  }
  if (lsData) {
    derivativeSummaries.push({
      name: "LS_Ratio",
      signal: lsData.signal,
      strength: lsData.strength,
      label: "多空比",
      value: lsData.current_ratio.toFixed(2),
    });
  }
  if (tvData) {
    derivativeSummaries.push({
      name: "Taker",
      signal: tvData.signal,
      strength: tvData.strength,
      label: "主動買賣量",
      value: tvData.current_ratio.toFixed(2),
    });
  }

  // Compute 24h change from OHLCV
  const dailyChange = (() => {
    if (!ohlcvData || ohlcvData.length < 2) return null;
    const last = ohlcvData[ohlcvData.length - 1];
    const prev = ohlcvData[ohlcvData.length - 2];
    if (!prev.close) return null;
    return ((last.close - prev.close) / prev.close) * 100;
  })();

  return (
    <div ref={pageContainerRef}>
      {/* Compact Sticky Bar — appears when full header scrolls out */}
      <div
        className={`sticky -top-4 md:-top-6 z-20 -mx-4 md:-mx-6 px-4 md:px-6 transition-all duration-200 ${
          isStuck
            ? "py-2 bg-background/80 backdrop-blur-sm border-b border-border/50 opacity-100"
            : "h-0 py-0 overflow-hidden opacity-0"
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {coinImage && (
              <img src={coinImage} alt={upperSymbol} className="h-6 w-6 rounded-full shrink-0" />
            )}
            <span className="text-sm font-bold text-primary shrink-0">{upperSymbol}</span>
            {price != null && (
              <span className="text-sm font-semibold tabular-nums shrink-0">{formatPrice(price)}</span>
            )}
            {dailyChange != null && (
              <span className={`text-xs font-medium tabular-nums shrink-0 ${dailyChange >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                {dailyChange >= 0 ? "+" : ""}{dailyChange.toFixed(2)}%
              </span>
            )}
          </div>
          <Tabs value={timeframe} onValueChange={setTimeframe}>
            <TabsList className="h-7">
              {TF_GROUPS.flatMap((group, gi) => [
                ...(gi > 0 ? [<div key={`sep-${gi}`} className="w-px h-3.5 bg-border/60 mx-0.5 shrink-0" />] : []),
                ...group.tfs.map((tf) => (
                  <TabsTrigger key={tf} value={tf} className="text-[11px] px-2 py-0.5">
                    {tf}
                  </TabsTrigger>
                )),
              ])}
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="space-y-6">
        {/* Full Header — scrolls normally */}
        <div ref={headerRef} className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {coinImage && (
              <img src={coinImage} alt={upperSymbol} className="h-10 w-10 rounded-full" />
            )}
            <div>
              <h1 className="text-2xl font-bold text-primary">{upperSymbol}</h1>
              {price != null && (
                <div className="flex items-baseline gap-3 mt-1">
                  <p className="text-3xl font-semibold tabular-nums">{formatPrice(price)}</p>
                  {dailyChange != null && (
                    <span className={`text-sm font-medium tabular-nums ${dailyChange >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                      {dailyChange >= 0 ? "+" : ""}{dailyChange.toFixed(2)}%
                    </span>
                  )}
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 px-2.5"
              onClick={toggleWatchlist}
            >
              <Star
                className={`h-4 w-4 transition-colors ${
                  isInWatchlist
                    ? "fill-amber-400 text-amber-400"
                    : "text-muted-foreground"
                }`}
              />
              <span className="text-xs">
                {isInWatchlist ? "已關注" : "加入關注"}
              </span>
            </Button>
            <ShareButton
              symbol={upperSymbol}
              price={price}
              score={techData?.overall_score}
              signal={techData?.overall_signal}
              indicators={techData?.indicators}
              srLevels={srData?.levels}
              fundingAvgRate={fundingData?.avg_rate}
              fundingSignal={fundingData?.signal}
              derivatives={derivativeSummaries.length > 0 ? derivativeSummaries : undefined}
              timeframe={timeframe}
              pageContainerRef={pageContainerRef}
            />
          </div>
          <Tabs value={timeframe} onValueChange={setTimeframe}>
            <TabsList>
              {TF_GROUPS.flatMap((group, gi) => [
                ...(gi > 0 ? [<div key={`sep-${gi}`} className="w-px h-4 bg-border/60 mx-0.5 shrink-0" />] : []),
                ...group.tfs.map((tf) => (
                  <TabsTrigger key={tf} value={tf} className="text-xs">
                    {tf}
                  </TabsTrigger>
                )),
              ])}
            </TabsList>
            <div className="flex mt-1">
              {TF_GROUPS.map((group) => (
                <span key={group.label} className="flex-1 text-center text-[9px] text-muted-foreground/60">
                  {group.label}
                </span>
              ))}
            </div>
          </Tabs>
        </div>

        {/* K-line Chart */}
      <Card>
        <CardContent className="p-2 pt-2">
          {ohlcvLoading ? (
            <Skeleton className="h-[400px] w-full" />
          ) : ohlcvData && ohlcvData.length > 0 ? (
            <ChartContainer data={ohlcvData} symbol={upperSymbol} timeframe={timeframe} />
          ) : (
            <div className="h-[400px] flex items-center justify-center text-muted-foreground">
              無法載入 K 線數據
            </div>
          )}
        </CardContent>
      </Card>

      {/* Overall Score */}
      {techData && (
        <>
          <SignalGauge
            score={techData.overall_score}
            signal={techData.overall_signal}
            consensus={techData.consensus}
          />
          <ScoringMethod />
        </>
      )}

      {/* Technical Indicators */}
      <div>
        <h2 className="text-lg font-semibold mb-3">
          <span className="border-l-2 border-primary pl-2">技術指標</span>
        </h2>
        {techLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-28" />
            ))}
          </div>
        ) : techData ? (
          <IndicatorGrid indicators={techData.indicators} />
        ) : (
          <p className="text-muted-foreground">無法載入技術分析</p>
        )}
      </div>

      {/* Support / Resistance */}
      {srData && srData.levels.length > 0 && (
        <SrCard levels={srData.levels} currentPrice={price} />
      )}

      <Separator />

      {/* Funding Rate */}
      <FundingRateTable symbol={upperSymbol} />

      {/* 衍生品指標 */}
      <div>
        <h2 className="text-lg font-semibold mb-3">
          <span className="border-l-2 border-primary pl-2">衍生品指標</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <OpenInterestCard symbol={upperSymbol} />
          <LongShortRatioCard symbol={upperSymbol} />
          <TakerVolumeCard symbol={upperSymbol} />
        </div>
      </div>

      <Separator />

      {/* On-chain Data */}
      <div>
        <h2 className="text-lg font-semibold mb-3">
          <span className="border-l-2 border-primary pl-2">鏈上數據</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <ExchangeFlowCard asset={upperSymbol} />
          <MvrvCard asset={upperSymbol} />
          <NuplCard asset={upperSymbol} />
        </div>
      </div>
      </div>
    </div>
  );
}
