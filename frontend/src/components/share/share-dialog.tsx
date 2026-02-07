"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useTheme } from "next-themes";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Copy, Download, Check } from "lucide-react";
import type { IndicatorSignal, SupportResistanceLevel } from "@/lib/types/technical";
import { SHARE_THEMES, type ShareThemeId } from "./share-themes";
import {
  SummaryCardCanvas,
  type SummaryCardCanvasRef,
  type DerivativeSummary,
} from "./summary-card-canvas";
import { captureFullScreenshot } from "./full-screenshot";
import { copyCanvasToClipboard, downloadCanvasAsPng } from "@/lib/utils/image-export";

type ShareMode = "summary" | "full";

export interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  symbol: string;
  price?: number;
  score?: number;
  signal?: string;
  indicators?: IndicatorSignal[];
  srLevels?: SupportResistanceLevel[];
  fundingAvgRate?: number;
  fundingSignal?: string;
  derivatives?: DerivativeSummary[];
  timeframe: string;
  pageContainerRef: React.RefObject<HTMLDivElement | null>;
}

export function ShareDialog({
  open,
  onOpenChange,
  symbol,
  price,
  score,
  signal,
  indicators,
  srLevels,
  fundingAvgRate,
  fundingSignal,
  derivatives,
  timeframe,
  pageContainerRef,
}: ShareDialogProps) {
  const [mode, setMode] = useState<ShareMode>("summary");
  const [themeId, setThemeId] = useState<ShareThemeId>("dark-tech");
  const [copied, setCopied] = useState(false);
  const [fullLoading, setFullLoading] = useState(false);
  const [fullPreviewUrl, setFullPreviewUrl] = useState<string | null>(null);
  const fullCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const summaryRef = useRef<SummaryCardCanvasRef>(null);

  const { resolvedTheme } = useTheme();

  // 精簡摘要卡用使用者選的主題；完整截圖依目前深淺色自動決定
  const summaryTheme = SHARE_THEMES[themeId];
  const fullTheme = useMemo(
    () => SHARE_THEMES[resolvedTheme === "light" ? "light" : "dark-tech"],
    [resolvedTheme],
  );
  const theme = mode === "full" ? fullTheme : summaryTheme;

  // Reset full screenshot preview when dialog opens or summary theme changes
  useEffect(() => {
    if (open) {
      setFullPreviewUrl(null);
      fullCanvasRef.current = null;
    }
  }, [open, themeId]);

  // Capture full screenshot when switching to full mode
  useEffect(() => {
    if (mode !== "full" || !open) return;
    if (fullPreviewUrl) return;

    const container = pageContainerRef.current;
    if (!container) return;

    let cancelled = false;
    setFullLoading(true);

    captureFullScreenshot(container, theme)
      .then((canvas) => {
        if (cancelled) return;
        fullCanvasRef.current = canvas;
        setFullPreviewUrl(canvas.toDataURL("image/png"));
      })
      .catch((err) => {
        console.error("[ShareDialog] Full screenshot capture failed:", err);
      })
      .finally(() => {
        if (!cancelled) setFullLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [mode, open, fullPreviewUrl, pageContainerRef, theme]);

  const getActiveCanvas = useCallback((): HTMLCanvasElement | null => {
    if (mode === "summary") {
      return summaryRef.current?.getCanvas() ?? null;
    }
    return fullCanvasRef.current;
  }, [mode]);

  const handleCopy = useCallback(async () => {
    const canvas = getActiveCanvas();
    if (!canvas) return;
    const ok = await copyCanvasToClipboard(canvas);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [getActiveCanvas]);

  const handleDownload = useCallback(() => {
    const canvas = getActiveCanvas();
    if (!canvas) return;
    const date = new Date()
      .toISOString()
      .slice(0, 10)
      .replace(/-/g, "");
    downloadCanvasAsPng(canvas, `${symbol}-analysis-${date}.png`);
  }, [getActiveCanvas, symbol]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>分享分析圖片</DialogTitle>
        </DialogHeader>

        {/* Mode selector */}
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">模式</span>
          <Tabs value={mode} onValueChange={(v) => setMode(v as ShareMode)}>
            <TabsList>
              <TabsTrigger value="summary" className="text-xs">
                精簡摘要卡
              </TabsTrigger>
              <TabsTrigger value="full" className="text-xs">
                完整截圖
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Theme selector (summary only) / hint (full) */}
        {mode === "summary" ? (
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">主題</span>
            <div className="flex gap-2">
              {Object.values(SHARE_THEMES).map((t) => (
                <button
                  key={t.id}
                  onClick={() => setThemeId(t.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md border text-sm transition-colors ${
                    themeId === t.id
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span
                    className="w-3 h-3 rounded-full border border-border"
                    style={{
                      background:
                        t.canvas.backgroundGradient
                          ? `linear-gradient(135deg, ${t.canvas.backgroundGradient[0]}, ${t.canvas.backgroundGradient[1]})`
                          : t.canvas.background,
                    }}
                  />
                  {t.name}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            截圖風格依目前{resolvedTheme === "light" ? "淺色" : "深色"}模式自動套用
          </p>
        )}

        {/* Preview area */}
        <div className="border border-border rounded-lg overflow-hidden bg-muted/30">
          {mode === "summary" ? (
            <SummaryCardCanvas
              ref={summaryRef}
              symbol={symbol}
              price={price}
              score={score}
              signal={signal}
              indicators={indicators}
              srLevels={srLevels}
              fundingAvgRate={fundingAvgRate}
              fundingSignal={fundingSignal}
              derivatives={derivatives}
              timeframe={timeframe}
              theme={theme}
            />
          ) : fullLoading ? (
            <div className="p-8">
              <Skeleton className="h-64 w-full" />
              <p className="text-center text-sm text-muted-foreground mt-3">
                截圖中...
              </p>
            </div>
          ) : fullPreviewUrl ? (
            <img
              src={fullPreviewUrl}
              alt="Full screenshot preview"
              className="w-full h-auto"
            />
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
              無法生成截圖
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleCopy}
            disabled={mode === "full" && fullLoading}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                已複製
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2" />
                複製到剪貼簿
              </>
            )}
          </Button>
          <Button
            className="flex-1"
            onClick={handleDownload}
            disabled={mode === "full" && fullLoading}
          >
            <Download className="w-4 h-4 mr-2" />
            下載 PNG
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
