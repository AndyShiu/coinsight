"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Search, Loader2, Menu, LayoutDashboard, Activity, Settings } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useMarketOverview } from "@/lib/hooks/use-market-overview";
import { searchCoins } from "@/lib/api/market";
import { useAppStore } from "@/lib/stores/app-store";
import type { MarketCoinResponse } from "@/lib/types/market";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/sentiment", label: "市場情緒", icon: Activity },
  { href: "/settings", label: "設定", icon: Settings },
];

// ── Debounce hook ──
function useDebouncedValue(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

// ── Helpers ──
function formatPrice(price: number) {
  if (price >= 1) return "$" + price.toLocaleString(undefined, { maximumFractionDigits: 2 });
  return "$" + price.toPrecision(4);
}

function formatChange(change: number | null) {
  if (change == null) return null;
  const sign = change >= 0 ? "+" : "";
  return `${sign}${change.toFixed(2)}%`;
}

// ── Shared row component (market overview coins with price) ──
function MarketRow({
  coin,
  active,
  onClick,
}: {
  coin: MarketCoinResponse;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group/row flex w-full items-center gap-3 px-3 py-2 text-sm transition-colors ${
        active ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"
      }`}
    >
      {coin.image && (
        <img src={coin.image} alt="" className="h-5 w-5 rounded-full shrink-0 grayscale group-hover/row:grayscale-0 transition-all duration-300" />
      )}
      <span className="font-medium text-primary min-w-[52px] text-left">
        {coin.symbol.toUpperCase()}
      </span>
      <span className="flex-1 text-left text-xs text-muted-foreground truncate">
        {coin.name}
      </span>
      <span className="text-xs text-muted-foreground tabular-nums">
        {formatPrice(coin.price)}
      </span>
      {coin.change_24h != null && (
        <span
          className={`text-xs tabular-nums min-w-[52px] text-right ${
            coin.change_24h >= 0 ? "text-emerald-500" : "text-red-500"
          }`}
        >
          {formatChange(coin.change_24h)}
        </span>
      )}
    </button>
  );
}

// ── Search result row (from CoinGecko search, no price) ──
function SearchRow({
  symbol,
  name,
  rank,
  thumb,
  active,
  onClick,
}: {
  symbol: string;
  name: string;
  rank: number | null;
  thumb: string | null;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group/row flex w-full items-center gap-3 px-3 py-2 text-sm transition-colors ${
        active ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"
      }`}
    >
      {thumb && (
        <img src={thumb} alt="" className="h-5 w-5 rounded-full shrink-0 grayscale group-hover/row:grayscale-0 transition-all duration-300" />
      )}
      <span className="font-medium text-primary min-w-[52px] text-left">
        {symbol.toUpperCase()}
      </span>
      <span className="flex-1 text-left text-xs text-muted-foreground truncate">
        {name}
      </span>
      {rank != null && (
        <span className="text-[11px] text-muted-foreground tabular-nums">
          #{rank}
        </span>
      )}
    </button>
  );
}

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: market } = useMarketOverview(100);
  const watchlist = useAppStore((s) => s.watchlist);
  const [sheetOpen, setSheetOpen] = useState(false);

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const debouncedQuery = useDebouncedValue(query.trim(), 300);

  // Remote search via CoinGecko
  const { data: searchResults, isFetching: isSearching } = useQuery({
    queryKey: ["coin-search", debouncedQuery],
    queryFn: () => searchCoins(debouncedQuery, 20),
    enabled: debouncedQuery.length >= 1,
    staleTime: 5 * 60_000,
  });

  // Build watchlist coins from market data
  const watchlistCoins = useMemo(() => {
    if (!market?.coins) return [];
    const map = new Map(market.coins.map((c) => [c.symbol.toUpperCase(), c]));
    return watchlist
      .map((s) => map.get(s.toUpperCase()))
      .filter((c): c is MarketCoinResponse => c != null);
  }, [market, watchlist]);

  // Top movers: top 10 by absolute 24h change
  const topMovers = useMemo(() => {
    if (!market?.coins) return [];
    return [...market.coins]
      .filter((c) => c.change_24h != null)
      .sort((a, b) => Math.abs(b.change_24h!) - Math.abs(a.change_24h!))
      .slice(0, 10);
  }, [market]);

  const hasQuery = query.trim().length > 0;
  const displayResults = searchResults ?? [];

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // "/" shortcut to focus search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "/" && !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Reset active index
  useEffect(() => {
    setActiveIdx(0);
  }, [debouncedQuery, open]);

  const navigate = (symbol: string) => {
    router.push(`/symbol/${symbol.toUpperCase()}`);
    setQuery("");
    setOpen(false);
    inputRef.current?.blur();
  };

  // Total navigable items
  const totalItems = hasQuery
    ? displayResults.length
    : watchlistCoins.length + topMovers.length;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || totalItems === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => (i + 1) % totalItems);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => (i - 1 + totalItems) % totalItems);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (hasQuery) {
        if (displayResults[activeIdx]) navigate(displayResults[activeIdx].symbol);
      } else {
        const allDefault = [...watchlistCoins, ...topMovers];
        if (allDefault[activeIdx]) navigate(allDefault[activeIdx].symbol);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  return (
    <header className="relative flex items-center border-b border-border bg-card px-4 py-3 md:px-6">
      {/* Left: mobile nav */}
      <div className="flex items-center gap-2">
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden h-9 w-9">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <div className="px-4 py-4">
              <h1 className="text-lg font-bold tracking-tight">
                <span className="text-primary">幣析</span>{" "}
                <span className="text-amber-500 dark:text-amber-400">CoinSight</span>
              </h1>
              <p className="text-xs text-amber-600/70 dark:text-amber-400/60">技術分析與市場洞察</p>
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
                      onClick={() => setSheetOpen(false)}
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
              <div className="h-px bg-border my-3" />
              <p className="text-xs font-medium text-muted-foreground px-3 mb-2">關注清單</p>
              <nav className="space-y-1">
                {watchlist.map((symbol) => {
                  const href = `/symbol/${symbol}`;
                  const active = pathname === href;
                  return (
                    <Link
                      key={symbol}
                      href={href}
                      onClick={() => setSheetOpen(false)}
                      className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                        active
                          ? "bg-primary/10 text-primary font-medium border-l-2 border-primary"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      }`}
                    >
                      <span className="w-5 text-center text-xs">$</span>
                      {symbol}
                    </Link>
                  );
                })}
              </nav>
            </ScrollArea>
          </SheetContent>
        </Sheet>
        <Link href="/" className="md:hidden text-lg font-bold">
          <span className="text-primary">幣析</span>{" "}
          <span className="text-amber-500 dark:text-amber-400">CS</span>
        </Link>
      </div>

      {/* Center: search bar */}
      <div className="flex-1 flex justify-center">
        <div ref={wrapperRef} className="relative w-full max-w-xl hidden sm:block">
          {/* Glow border wrapper */}
          <div className="relative group/search">
            <div className="absolute -inset-[1px] rounded-md bg-gradient-to-r from-emerald-500/40 via-amber-400/40 to-emerald-500/40 opacity-50 group-focus-within/search:opacity-100 blur-[2px] transition-opacity" />
            <div className="relative flex items-center rounded-md border border-emerald-500/30 dark:border-emerald-500/20 bg-background/80 dark:bg-muted/50 backdrop-blur-sm group-focus-within/search:border-emerald-500/60 transition-all">
              {isSearching ? (
                <Loader2 className="absolute left-3.5 h-4 w-4 text-emerald-500 animate-spin" />
              ) : (
                <Search className="absolute left-3.5 h-4 w-4 text-emerald-500/70 group-focus-within/search:text-emerald-500 transition-colors" />
              )}
              <Input
                ref={inputRef}
                placeholder="搜尋幣種名稱或代號..."
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setOpen(true);
                }}
                onFocus={() => setOpen(true)}
                onKeyDown={handleKeyDown}
                className="h-12 w-full pl-11 pr-4 text-sm rounded-md border-0 bg-transparent shadow-none placeholder:text-muted-foreground/50 focus-visible:ring-0"
              />
              <kbd className="absolute right-3.5 hidden md:inline-flex h-5 items-center gap-0.5 rounded border border-emerald-500/20 bg-emerald-500/5 px-1.5 font-mono text-[10px] text-emerald-600/60 dark:text-emerald-400/50">
                /
              </kbd>
            </div>
          </div>

          {open && (
            <div className="absolute top-full left-0 right-0 z-50 mt-1.5 rounded-lg border border-emerald-500/20 bg-popover shadow-xl shadow-emerald-500/5 overflow-hidden">
              <ScrollArea className="max-h-[420px]">
                {hasQuery ? (
                  /* ── Search results from API ── */
                  displayResults.length > 0 ? (
                    <div>
                      <div className="px-3 py-1.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider bg-muted/50">
                        搜尋結果
                      </div>
                      {displayResults.map((coin, idx) => (
                        <SearchRow
                          key={`${coin.symbol}-${coin.name}-${idx}`}
                          symbol={coin.symbol}
                          name={coin.name}
                          rank={coin.market_cap_rank}
                          thumb={coin.thumb}
                          active={idx === activeIdx}
                          onClick={() => navigate(coin.symbol)}
                        />
                      ))}
                    </div>
                  ) : isSearching ? (
                    <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                      搜尋中...
                    </div>
                  ) : (
                    <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                      找不到符合「{query}」的幣種
                    </div>
                  )
                ) : (
                  /* ── Default: Watchlist + Top Movers ── */
                  <>
                    {watchlistCoins.length > 0 && (
                      <div>
                        <div className="px-3 py-1.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider bg-muted/50">
                          關注清單
                        </div>
                        {watchlistCoins.map((coin, idx) => (
                          <MarketRow
                            key={coin.symbol}
                            coin={coin}
                            active={idx === activeIdx}
                            onClick={() => navigate(coin.symbol)}
                          />
                        ))}
                      </div>
                    )}
                    {topMovers.length > 0 && watchlistCoins.length > 0 && (
                      <div className="h-px bg-border mx-2" />
                    )}
                    {topMovers.length > 0 && (
                      <div>
                        <div className="px-3 py-1.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider bg-muted/50">
                          漲跌幅排行
                        </div>
                        {topMovers.map((coin, idx) => (
                          <MarketRow
                            key={coin.symbol}
                            coin={coin}
                            active={idx + watchlistCoins.length === activeIdx}
                            onClick={() => navigate(coin.symbol)}
                          />
                        ))}
                      </div>
                    )}
                  </>
                )}
              </ScrollArea>
            </div>
          )}
        </div>
      </div>

      {/* Right spacer for layout balance */}
      <div className="hidden sm:block w-16" />
    </header>
  );
}
