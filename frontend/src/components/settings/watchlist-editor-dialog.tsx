"use client";

import { useState, useMemo, useRef } from "react";
import { Pencil, Plus, X, Search, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAppStore } from "@/lib/stores/app-store";
import { useUpdateWatchlist } from "@/lib/hooks/use-watchlist";
import { useMarketOverview } from "@/lib/hooks/use-market-overview";

export function WatchlistEditorDialog() {
  const watchlist = useAppStore((s) => s.watchlist);
  const updateMutation = useUpdateWatchlist();
  const { data: market } = useMarketOverview(100);

  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const dragIdx = useRef<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) {
      setDraft([...watchlist]);
      setSearch("");
    }
    setOpen(isOpen);
  };

  const addSymbol = (symbol: string) => {
    const upper = symbol.toUpperCase();
    if (!draft.includes(upper)) {
      setDraft((prev) => [...prev, upper]);
    }
  };

  const removeSymbol = (symbol: string) => {
    if (draft.length <= 1) return;
    setDraft((prev) => prev.filter((s) => s !== symbol));
  };

  const handleDragStart = (idx: number) => {
    dragIdx.current = idx;
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    setDragOverIdx(idx);
  };

  const handleDrop = (idx: number) => {
    const from = dragIdx.current;
    if (from == null || from === idx) {
      dragIdx.current = null;
      setDragOverIdx(null);
      return;
    }
    setDraft((prev) => {
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(idx, 0, item);
      return next;
    });
    dragIdx.current = null;
    setDragOverIdx(null);
  };

  const handleDragEnd = () => {
    dragIdx.current = null;
    setDragOverIdx(null);
  };

  const handleSave = () => {
    updateMutation.mutate(draft, {
      onSuccess: () => setOpen(false),
    });
  };

  const filteredCoins = useMemo(() => {
    if (!market?.coins) return [];
    const q = search.toLowerCase();
    return market.coins
      .filter(
        (c) =>
          !draft.includes(c.symbol.toUpperCase()) &&
          (c.symbol.toLowerCase().includes(q) ||
            c.name.toLowerCase().includes(q))
      )
      .slice(0, 20);
  }, [market, draft, search]);

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-5 w-5">
          <Pencil className="h-3 w-3" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>編輯關注清單</DialogTitle>
        </DialogHeader>

        {/* Current watchlist — draggable list */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">目前關注（拖拽排序）</p>
          <div className="max-h-48 overflow-y-auto rounded-md">
          <div className="space-y-0.5">
            {draft.map((symbol, idx) => (
              <div
                key={symbol}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDrop={() => handleDrop(idx)}
                onDragEnd={handleDragEnd}
                className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors cursor-grab active:cursor-grabbing ${
                  dragOverIdx === idx
                    ? "bg-primary/10 border border-primary/30"
                    : "bg-muted/50 hover:bg-muted"
                }`}
              >
                <GripVertical className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                <span className="font-medium flex-1">{symbol}</span>
                <button
                  type="button"
                  onClick={() => removeSymbol(symbol)}
                  disabled={draft.length <= 1}
                  className="rounded-full p-0.5 hover:bg-destructive/20 hover:text-destructive text-muted-foreground transition-colors disabled:opacity-30"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
          </div>
        </div>

        {/* Search to add */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">搜尋新增</p>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜尋幣種..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <ScrollArea className="h-40">
            <div className="space-y-0.5">
              {filteredCoins.map((coin) => (
                <button
                  key={coin.symbol}
                  type="button"
                  onClick={() => addSymbol(coin.symbol)}
                  className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-accent transition-colors"
                >
                  <span>
                    <span className="font-medium">{coin.symbol.toUpperCase()}</span>
                    <span className="ml-2 text-muted-foreground text-xs">{coin.name}</span>
                  </span>
                  <Plus className="h-4 w-4 text-muted-foreground" />
                </button>
              ))}
              {filteredCoins.length === 0 && search && (
                <p className="px-2 py-3 text-xs text-muted-foreground text-center">
                  找不到符合的幣種
                </p>
              )}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={updateMutation.isPending}
          >
            取消
          </Button>
          <Button
            onClick={handleSave}
            disabled={updateMutation.isPending || draft.length === 0}
          >
            {updateMutation.isPending ? "儲存中..." : "儲存"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
