"use client";

import { useState } from "react";
import { Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAppStore } from "@/lib/stores/app-store";
import { useUpdateDashboardPins } from "@/lib/hooks/use-dashboard-pins";

export function DashboardPinsEditor() {
  const watchlist = useAppStore((s) => s.watchlist);
  const dashboardPins = useAppStore((s) => s.dashboardPins);
  const updateMutation = useUpdateDashboardPins();

  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<string[]>([]);

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) {
      setDraft([...dashboardPins]);
    }
    setOpen(isOpen);
  };

  const togglePin = (symbol: string) => {
    setDraft((prev) =>
      prev.includes(symbol)
        ? prev.filter((s) => s !== symbol)
        : [...prev, symbol]
    );
  };

  const handleSave = () => {
    updateMutation.mutate(draft, {
      onSuccess: () => setOpen(false),
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-muted-foreground">
          <Settings2 className="h-3.5 w-3.5" />
          編輯
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Dashboard 置頂幣種</DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            從關注清單中選擇要在 Dashboard 顯示的幣種
          </p>
          <div className="flex flex-wrap gap-2">
            {watchlist.map((symbol) => {
              const selected = draft.includes(symbol);
              return (
                <Badge
                  key={symbol}
                  variant={selected ? "default" : "outline"}
                  className="cursor-pointer select-none"
                  onClick={() => togglePin(symbol)}
                >
                  {symbol}
                </Badge>
              );
            })}
          </div>
          {watchlist.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">
              關注清單為空，請先新增幣種
            </p>
          )}
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
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? "儲存中..." : "儲存"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
