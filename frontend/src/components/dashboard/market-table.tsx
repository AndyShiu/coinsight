"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useMarketOverview } from "@/lib/hooks/use-market-overview";
import { formatPrice, formatPercent, formatLargeNumber } from "@/lib/utils/format";
import { changeColor } from "@/lib/utils/signal-colors";
import type { MarketCoinResponse } from "@/lib/types/market";

type SortKey = "rank" | "price" | "change_24h" | "volume_24h" | "market_cap";
type SortDir = "asc" | "desc";

type ViewTab = "market_cap" | "gainers" | "losers" | "volume";

const VIEW_PRESETS: Record<ViewTab, { sortKey: SortKey; sortDir: SortDir }> = {
  market_cap: { sortKey: "rank", sortDir: "asc" },
  gainers: { sortKey: "change_24h", sortDir: "desc" },
  losers: { sortKey: "change_24h", sortDir: "asc" },
  volume: { sortKey: "volume_24h", sortDir: "desc" },
};

function getSortValue(coin: MarketCoinResponse, key: SortKey, idx: number): number {
  switch (key) {
    case "rank":
      return idx;
    case "price":
      return coin.price;
    case "change_24h":
      return coin.change_24h ?? 0;
    case "volume_24h":
      return coin.volume_24h ?? 0;
    case "market_cap":
      return coin.market_cap ?? 0;
  }
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ArrowUpDown className="h-3 w-3 opacity-40" />;
  return dir === "asc"
    ? <ArrowUp className="h-3 w-3" />
    : <ArrowDown className="h-3 w-3" />;
}

const DISPLAY_LIMIT = 20;

export function MarketTable() {
  const { data, isLoading } = useMarketOverview(250);
  const [view, setView] = useState<ViewTab>("market_cap");
  const [sortKey, setSortKey] = useState<SortKey>("rank");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const handleViewChange = (v: string) => {
    const tab = v as ViewTab;
    setView(tab);
    const preset = VIEW_PRESETS[tab];
    setSortKey(preset.sortKey);
    setSortDir(preset.sortDir);
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "rank" ? "asc" : "desc");
    }
  };

  const coins = data?.coins ?? [];

  const sorted = useMemo(() => {
    if (coins.length === 0) return [];
    const indexed = coins.map((c, i) => ({ coin: c, idx: i }));
    indexed.sort((a, b) => {
      const va = getSortValue(a.coin, sortKey, a.idx);
      const vb = getSortValue(b.coin, sortKey, b.idx);
      return sortDir === "asc" ? va - vb : vb - va;
    });
    return indexed.slice(0, DISPLAY_LIMIT);
  }, [coins, sortKey, sortDir]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader><CardTitle>市場總覽</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 gap-3">
        <CardTitle>市場總覽</CardTitle>
        <Tabs value={view} onValueChange={handleViewChange}>
          <TabsList className="h-7">
            <TabsTrigger value="market_cap" className="text-[11px] px-2.5 py-0.5">市值排行</TabsTrigger>
            <TabsTrigger value="gainers" className="text-[11px] px-2.5 py-0.5">漲幅榜</TabsTrigger>
            <TabsTrigger value="losers" className="text-[11px] px-2.5 py-0.5">跌幅榜</TabsTrigger>
            <TabsTrigger value="volume" className="text-[11px] px-2.5 py-0.5">成交量</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent className="px-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className="w-12 text-center cursor-pointer select-none hover:text-foreground transition-colors"
                onClick={() => toggleSort("rank")}
              >
                <span className="inline-flex items-center gap-1">
                  # <SortIcon active={sortKey === "rank"} dir={sortDir} />
                </span>
              </TableHead>
              <TableHead>幣種</TableHead>
              <TableHead
                className="text-right cursor-pointer select-none hover:text-foreground transition-colors"
                onClick={() => toggleSort("price")}
              >
                <span className="inline-flex items-center justify-end gap-1 w-full">
                  價格 <SortIcon active={sortKey === "price"} dir={sortDir} />
                </span>
              </TableHead>
              <TableHead
                className="text-right cursor-pointer select-none hover:text-foreground transition-colors"
                onClick={() => toggleSort("change_24h")}
              >
                <span className="inline-flex items-center justify-end gap-1 w-full">
                  24h <SortIcon active={sortKey === "change_24h"} dir={sortDir} />
                </span>
              </TableHead>
              <TableHead
                className="text-right hidden sm:table-cell cursor-pointer select-none hover:text-foreground transition-colors"
                onClick={() => toggleSort("volume_24h")}
              >
                <span className="inline-flex items-center justify-end gap-1 w-full">
                  成交量 <SortIcon active={sortKey === "volume_24h"} dir={sortDir} />
                </span>
              </TableHead>
              <TableHead
                className="text-right hidden md:table-cell cursor-pointer select-none hover:text-foreground transition-colors"
                onClick={() => toggleSort("market_cap")}
              >
                <span className="inline-flex items-center justify-end gap-1 w-full">
                  市值 <SortIcon active={sortKey === "market_cap"} dir={sortDir} />
                </span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map(({ coin, idx }) => (
              <TableRow key={coin.symbol} className="group/row cursor-pointer hover:bg-accent/50 transition-colors">
                <TableCell className="text-center text-muted-foreground">{idx + 1}</TableCell>
                <TableCell>
                  <Link
                    href={`/symbol/${coin.symbol}`}
                    className="flex items-center gap-2 font-medium hover:underline"
                  >
                    {coin.image && (
                      <img src={coin.image} alt={coin.symbol} className="h-5 w-5 rounded-full shrink-0 grayscale group-hover/row:grayscale-0 transition-all duration-300" />
                    )}
                    <span>{coin.symbol}</span>
                    <span className="text-xs text-muted-foreground truncate">{coin.name}</span>
                  </Link>
                </TableCell>
                <TableCell className="text-right font-mono">
                  {formatPrice(coin.price)}
                </TableCell>
                <TableCell className={`text-right font-mono ${changeColor(coin.change_24h)}`}>
                  {formatPercent(coin.change_24h)}
                </TableCell>
                <TableCell className="text-right font-mono hidden sm:table-cell">
                  {formatLargeNumber(coin.volume_24h)}
                </TableCell>
                <TableCell className="text-right font-mono hidden md:table-cell">
                  {formatLargeNumber(coin.market_cap)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
