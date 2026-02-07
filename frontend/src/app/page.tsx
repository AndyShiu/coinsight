"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FearGreedBanner } from "@/components/dashboard/fear-greed-banner";
import { QuickSignalCard } from "@/components/dashboard/quick-signal-card";
import { MarketTable } from "@/components/dashboard/market-table";
import { DashboardPinsEditor } from "@/components/settings/dashboard-pins-editor";
import { useAppStore } from "@/lib/stores/app-store";

const TF_GROUPS = [
  { label: "短線", tfs: ["15m", "30m", "1h"] },
  { label: "波段", tfs: ["2h", "4h", "12h"] },
  { label: "中長線", tfs: ["1d", "3d", "1w"] },
] as const;

const TF_LABELS: Record<string, string> = {
  "15m": "15 分鐘", "30m": "30 分鐘", "1h": "1 小時",
  "2h": "2 小時", "4h": "4 小時", "12h": "12 小時",
  "1d": "日線", "3d": "3 日線", "1w": "週線",
};

export default function DashboardPage() {
  const dashboardPins = useAppStore((s) => s.dashboardPins);
  const [signalTf, setSignalTf] = useState("1d");

  return (
    <div className="space-y-6">
      <FearGreedBanner />

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-medium text-muted-foreground shrink-0">快速訊號</h2>
          <div className="flex items-center gap-2">
            <Tabs value={signalTf} onValueChange={setSignalTf}>
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
            <DashboardPinsEditor />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {dashboardPins.map((symbol) => (
            <QuickSignalCard key={`${symbol}-${signalTf}`} symbol={symbol} timeframe={signalTf} />
          ))}
        </div>
      </div>

      <MarketTable />
    </div>
  );
}
