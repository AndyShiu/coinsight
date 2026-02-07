"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Sun, Moon, LayoutDashboard, Activity, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useAppStore } from "@/lib/stores/app-store";
import { useUpdateWatchlist } from "@/lib/hooks/use-watchlist";
import { useMarketOverview } from "@/lib/hooks/use-market-overview";
import { WatchlistEditorDialog } from "@/components/settings/watchlist-editor-dialog";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/sentiment", label: "市場情緒", icon: Activity },
  { href: "/settings", label: "設定", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const watchlist = useAppStore((s) => s.watchlist);
  const { resolvedTheme, setTheme } = useTheme();
  const updateWatchlist = useUpdateWatchlist();
  const { data: market } = useMarketOverview(100);
  const [mounted, setMounted] = useState(false);

  // Build image map from market data
  const imageMap = new Map<string, string>();
  if (market?.coins) {
    for (const c of market.coins) {
      if (c.image) imageMap.set(c.symbol.toUpperCase(), c.image);
    }
  }

  useEffect(() => setMounted(true), []);

  return (
    <aside className="hidden md:flex w-56 flex-col border-r border-border bg-card">
      <div className="flex items-center justify-between px-4 py-4">
        <div>
          <h1 className="text-lg font-bold tracking-tight">
            <span className="text-primary">幣析</span>{" "}
            <span className="text-amber-500 dark:text-amber-400">CoinSight</span>
          </h1>
          <p className="text-xs text-amber-600/70 dark:text-amber-400/60">技術分析與市場洞察</p>
        </div>
        {mounted && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          >
            {resolvedTheme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>
      <div className="h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent mx-2" />
      <ScrollArea className="flex-1 px-2 py-2">
        <nav className="space-y-1">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                  active
                    ? "bg-primary/10 text-primary font-medium border-l-2 border-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <Separator className="my-3" />

        <div className="flex items-center justify-between px-3 pb-1">
          <p className="text-xs font-medium text-muted-foreground">關注清單</p>
          <WatchlistEditorDialog />
        </div>
        <nav className="space-y-1">
          {watchlist.map((symbol) => {
            const href = `/symbol/${symbol}`;
            const active = pathname === href;
            return (
              <div key={symbol} className="group group/item relative flex items-center">
                <Link
                  href={href}
                  className={`flex flex-1 items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                    active
                      ? "bg-primary/10 text-primary font-medium border-l-2 border-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  {imageMap.get(symbol) ? (
                    <img src={imageMap.get(symbol)} alt={symbol} className="h-4 w-4 rounded-full shrink-0 grayscale group-hover/item:grayscale-0 transition-all duration-300" />
                  ) : (
                    <span className="w-4 text-center text-xs">$</span>
                  )}
                  {symbol}
                </Link>
                {watchlist.length > 1 && (
                  <button
                    type="button"
                    onClick={() =>
                      updateWatchlist.mutate(
                        watchlist.filter((s) => s !== symbol)
                      )
                    }
                    className="absolute right-2 hidden group-hover:flex items-center justify-center h-5 w-5 rounded-full hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <span className="text-xs">✕</span>
                  </button>
                )}
              </div>
            );
          })}
        </nav>
      </ScrollArea>
    </aside>
  );
}
