"use client";

import { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import type { IndicatorSignal, SupportResistanceLevel } from "@/lib/types/technical";
import type { ShareTheme } from "./share-themes";
import {
  drawRoundRect,
  drawText,
  drawSignalDot,
  drawGaugeBar,
  drawDivider,
  signalLabel,
  signalColor,
} from "@/lib/utils/canvas-utils";
import { formatPrice, formatRate } from "@/lib/utils/format";

const W = 1200;
const H = 750;
const PAD = 40;
const FONT = '"Geist Sans", "Inter", -apple-system, "Helvetica Neue", sans-serif';

const INDICATOR_LABELS: Record<string, string> = {
  RSI: "RSI",
  KD: "KD",
  MACD: "MACD",
  EMA: "EMA",
  BBANDS: "BB",
  Volume: "Vol",
};

const DERIV_LABELS: Record<string, string> = {
  OI: "未平倉合約",
  LS_Ratio: "多空比",
  Taker: "主動買賣量",
};

function tfCategory(tf: string): string {
  if (["15m", "30m", "1h"].includes(tf)) return "短線";
  if (["2h", "4h", "12h"].includes(tf)) return "波段";
  return "中長線";
}

export interface DerivativeSummary {
  name: string;
  signal: string;
  strength: number;
  label: string;
  value: string;
}

export interface SummaryCardProps {
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
  theme: ShareTheme;
}

export interface SummaryCardCanvasRef {
  getCanvas: () => HTMLCanvasElement | null;
}

export const SummaryCardCanvas = forwardRef<SummaryCardCanvasRef, SummaryCardProps>(
  function SummaryCardCanvas(props, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useImperativeHandle(ref, () => ({
      getCanvas: () => canvasRef.current,
    }));

    const {
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
      theme,
    } = props;

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const t = theme.canvas;

      async function render() {
        // Wait for fonts
        await document.fonts.ready;

        // --- Background ---
        if (t.backgroundGradient) {
          const grad = ctx!.createLinearGradient(0, 0, W, H);
          grad.addColorStop(0, t.backgroundGradient[0]);
          grad.addColorStop(1, t.backgroundGradient[1]);
          ctx!.fillStyle = grad;
        } else {
          ctx!.fillStyle = t.background;
        }
        ctx!.fillRect(0, 0, W, H);

        // Dark tech: subtle grid pattern
        if (theme.id === "dark-tech") {
          ctx!.strokeStyle = "rgba(129,140,248,0.06)";
          ctx!.lineWidth = 1;
          for (let gx = 0; gx < W; gx += 40) {
            ctx!.beginPath();
            ctx!.moveTo(gx, 0);
            ctx!.lineTo(gx, H);
            ctx!.stroke();
          }
          for (let gy = 0; gy < H; gy += 40) {
            ctx!.beginPath();
            ctx!.moveTo(0, gy);
            ctx!.lineTo(W, gy);
            ctx!.stroke();
          }
        }

        // Outer border (dark-tech: glow, clean: subtle)
        if (theme.id === "dark-tech") {
          ctx!.shadowColor = "rgba(129,140,248,0.4)";
          ctx!.shadowBlur = 20;
          drawRoundRect(ctx!, 2, 2, W - 4, H - 4, 16, undefined, "rgba(129,140,248,0.5)");
          ctx!.shadowColor = "transparent";
          ctx!.shadowBlur = 0;
        } else {
          drawRoundRect(ctx!, 1, 1, W - 2, H - 2, 12, undefined, t.border);
        }

        // === ROW 1: Brand bar (y: 0~50) ===
        const brandY = 16;
        if (theme.id === "dark-tech" && t.brandGradient) {
          const grad = ctx!.createLinearGradient(PAD, brandY, PAD + 200, brandY);
          grad.addColorStop(0, t.brandGradient[0]);
          grad.addColorStop(1, t.brandGradient[1]);
          ctx!.font = `bold 18px ${FONT}`;
          ctx!.fillStyle = grad;
          ctx!.textAlign = "left";
          ctx!.textBaseline = "top";
          ctx!.fillText("COINSIGHT 幣析", PAD, brandY);
        } else {
          drawText(ctx!, "COINSIGHT 幣析", PAD, brandY, {
            font: FONT,
            size: 18,
            color: t.accent,
            bold: true,
          });
        }

        // Right: timeframe pill + date
        const now = new Date();
        const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

        // Timeframe pill badge
        const tfLabel = `${timeframe}  ${tfCategory(timeframe)}`;
        ctx!.font = `bold 14px ${FONT}`;
        const tfTextW = ctx!.measureText(tfLabel).width;
        const pillW = tfTextW + 20;
        const pillH = 24;
        const pillX = W - PAD - pillW;
        const pillY = brandY - 2;
        drawRoundRect(ctx!, pillX, pillY, pillW, pillH, pillH / 2, t.accent + "22", t.accent + "66");
        drawText(ctx!, tfLabel, pillX + pillW / 2, pillY + 5, {
          font: FONT,
          size: 14,
          color: t.accent,
          align: "center",
          bold: true,
        });

        // Date left of pill
        drawText(ctx!, dateStr, pillX - 12, brandY + 3, {
          font: FONT,
          size: 13,
          color: t.textSecondary,
          align: "right",
        });

        drawDivider(ctx!, PAD, 50, W - PAD, 50, t.border);

        // === ROW 2: Symbol + Price / Score Gauge (y: 55~195) ===
        drawText(ctx!, symbol, PAD, 68, {
          font: FONT,
          size: 42,
          color: t.text,
          bold: true,
        });

        if (price != null) {
          drawText(ctx!, formatPrice(price), PAD, 120, {
            font: FONT,
            size: 32,
            color: t.text,
          });
        }

        // Score gauge area (right side)
        if (score != null && signal) {
          const gaugeX = 600;
          const gaugeW = W - PAD - gaugeX;

          drawRoundRect(ctx!, gaugeX, 60, gaugeW, 130, 12, t.cardBg, t.border);

          drawText(ctx!, "綜合評分", gaugeX + 20, 75, {
            font: FONT,
            size: 16,
            color: t.textSecondary,
          });

          // Score number
          const scoreStr = (score >= 0 ? "+" : "") + score.toFixed(2);
          drawText(ctx!, scoreStr, gaugeX + gaugeW - 20, 75, {
            font: FONT,
            size: 22,
            color: signalColor(signal, t),
            align: "right",
            bold: true,
          });

          // Gauge bar
          drawGaugeBar(ctx!, gaugeX + 20, 115, gaugeW - 40, 16, score, t);

          // Labels under gauge
          drawText(ctx!, "-1.0", gaugeX + 20, 140, {
            font: FONT,
            size: 11,
            color: t.textSecondary,
          });
          drawText(ctx!, "0", gaugeX + gaugeW / 2, 140, {
            font: FONT,
            size: 11,
            color: t.textSecondary,
            align: "center",
          });
          drawText(ctx!, "+1.0", gaugeX + gaugeW - 20, 140, {
            font: FONT,
            size: 11,
            color: t.textSecondary,
            align: "right",
          });

          // Signal label
          drawText(ctx!, signalLabel(signal), gaugeX + gaugeW / 2, 160, {
            font: FONT,
            size: 18,
            color: signalColor(signal, t),
            align: "center",
            bold: true,
          });
        }

        drawDivider(ctx!, PAD, 200, W - PAD, 200, t.border);

        // === ROW 3: 6 Indicator cells (y: 205~355) ===
        const indList = indicators ?? [];
        const cellW = (W - PAD * 2 - 5 * 16) / 6; // 6 cells with 16px gap
        const cellH = 130;
        const cellY = 215;

        for (let i = 0; i < 6; i++) {
          const ind = indList[i];
          const cx = PAD + i * (cellW + 16);

          drawRoundRect(ctx!, cx, cellY, cellW, cellH, 10, t.cardBg, t.border);

          if (!ind) continue;

          const label = INDICATOR_LABELS[ind.name] ?? ind.name;

          // Indicator name
          drawText(ctx!, label, cx + cellW / 2, cellY + 14, {
            font: FONT,
            size: 16,
            color: t.textSecondary,
            align: "center",
            bold: true,
          });

          // Signal dot + label
          const sigY = cellY + 48;
          drawSignalDot(ctx!, cx + cellW / 2 - 30, sigY + 6, 5, ind.signal, t);
          drawText(ctx!, signalLabel(ind.signal), cx + cellW / 2 - 18, sigY, {
            font: FONT,
            size: 14,
            color: signalColor(ind.signal, t),
          });

          // Main value
          const mainEntry = Object.entries(ind.latest_values).find(
            ([, v]) => v != null,
          );
          if (mainEntry && mainEntry[1] != null) {
            drawText(ctx!, mainEntry[1].toFixed(2), cx + cellW / 2, cellY + 78, {
              font: FONT,
              size: 18,
              color: t.text,
              align: "center",
              bold: true,
            });
          }

          // Strength bar
          const barY = cellY + cellH - 18;
          const barW = cellW - 24;
          const barH = 4;
          drawRoundRect(ctx!, cx + 12, barY, barW, barH, 2, "rgba(255,255,255,0.08)");
          const fillW = barW * ind.strength;
          if (fillW > 0) {
            drawRoundRect(ctx!, cx + 12, barY, fillW, barH, 2, t.accent);
          }
        }

        drawDivider(ctx!, PAD, 365, W - PAD, 365, t.border);

        // === ROW 3.5: Derivatives indicators (y: 370~470) ===
        const derivList = derivatives ?? [];
        if (derivList.length > 0) {
          const dCellW = (W - PAD * 2 - (derivList.length - 1) * 16) / derivList.length;
          const dCellH = 85;
          const dY = 375;

          for (let i = 0; i < derivList.length; i++) {
            const d = derivList[i];
            const dx = PAD + i * (dCellW + 16);

            drawRoundRect(ctx!, dx, dY, dCellW, dCellH, 10, t.cardBg, t.border);

            // Label
            drawText(ctx!, d.label, dx + dCellW / 2, dY + 12, {
              font: FONT,
              size: 14,
              color: t.textSecondary,
              align: "center",
              bold: true,
            });

            // Signal dot + label
            drawSignalDot(ctx!, dx + dCellW / 2 - 30, dY + 42, 5, d.signal, t);
            drawText(ctx!, signalLabel(d.signal), dx + dCellW / 2 - 18, dY + 36, {
              font: FONT,
              size: 13,
              color: signalColor(d.signal, t),
            });

            // Value
            drawText(ctx!, d.value, dx + dCellW / 2, dY + 62, {
              font: FONT,
              size: 16,
              color: t.text,
              align: "center",
              bold: true,
            });
          }

          drawDivider(ctx!, PAD, dY + dCellH + 10, W - PAD, dY + dCellH + 10, t.border);
        }

        const row4Y = derivList.length > 0 ? 480 : 375;

        // === ROW 4: S/R Levels (left) + Funding Rate (right) ===
        const halfW = (W - PAD * 2 - 20) / 2;

        // Left: S/R
        drawRoundRect(ctx!, PAD, row4Y, halfW, 180, 10, t.cardBg, t.border);
        drawText(ctx!, "支撐 / 壓力位", PAD + 16, row4Y + 15, {
          font: FONT,
          size: 15,
          color: t.textSecondary,
          bold: true,
        });

        const levelOrder = ["R2", "R1", "PP", "S1", "S2"];
        const levels = srLevels ?? [];
        for (let i = 0; i < levelOrder.length; i++) {
          const lbl = levelOrder[i];
          const lvl = levels.find((l) => l.label === lbl);
          const ly = row4Y + 43 + i * 28;

          const isR = lbl.startsWith("R");
          const isPP = lbl === "PP";
          const lColor = isPP
            ? "#eab308"
            : isR
              ? t.bearish
              : t.bullish;

          drawText(ctx!, lbl, PAD + 20, ly, {
            font: FONT,
            size: 14,
            color: lColor,
            bold: true,
          });

          if (lvl) {
            drawText(ctx!, formatPrice(lvl.price), PAD + halfW - 20, ly, {
              font: FONT,
              size: 14,
              color: lColor,
              align: "right",
              bold: true,
            });
          } else {
            drawText(ctx!, "—", PAD + halfW - 20, ly, {
              font: FONT,
              size: 14,
              color: t.textSecondary,
              align: "right",
            });
          }
        }

        // Right: Funding Rate
        const rightX = PAD + halfW + 20;
        drawRoundRect(ctx!, rightX, row4Y, halfW, 180, 10, t.cardBg, t.border);
        drawText(ctx!, "資金費率", rightX + 16, row4Y + 15, {
          font: FONT,
          size: 15,
          color: t.textSecondary,
          bold: true,
        });

        if (fundingAvgRate != null) {
          drawText(ctx!, "平均費率", rightX + 20, row4Y + 55, {
            font: FONT,
            size: 14,
            color: t.textSecondary,
          });
          drawText(ctx!, formatRate(fundingAvgRate), rightX + halfW - 20, row4Y + 55, {
            font: FONT,
            size: 18,
            color: fundingAvgRate >= 0 ? t.bearish : t.bullish,
            align: "right",
            bold: true,
          });
        }

        if (fundingSignal) {
          drawText(ctx!, "信號", rightX + 20, row4Y + 95, {
            font: FONT,
            size: 14,
            color: t.textSecondary,
          });
          drawSignalDot(ctx!, rightX + halfW - 78, row4Y + 102, 5, fundingSignal, t);
          drawText(ctx!, signalLabel(fundingSignal), rightX + halfW - 66, row4Y + 95, {
            font: FONT,
            size: 14,
            color: signalColor(fundingSignal, t),
          });
        }

        // Current price reference
        if (price != null) {
          drawDivider(ctx!, rightX + 16, row4Y + 130, rightX + halfW - 16, row4Y + 130, t.border);
          drawText(ctx!, "目前價格", rightX + 20, row4Y + 140, {
            font: FONT,
            size: 13,
            color: t.textSecondary,
          });
          drawText(ctx!, formatPrice(price), rightX + halfW - 20, row4Y + 140, {
            font: FONT,
            size: 15,
            color: t.text,
            align: "right",
            bold: true,
          });
        }

        // === ROW 5: Disclaimer footer ===
        const footerY = row4Y + 195;
        drawDivider(ctx!, PAD, footerY, W - PAD, footerY, t.border);

        drawText(ctx!, "資料僅供參考，不構成投資建議", PAD, footerY + 18, {
          font: FONT,
          size: 12,
          color: t.textSecondary,
        });

        // Right: brand + author
        const authorStr = "github.com/AndyShiu";
        ctx!.font = `13px ${FONT}`;
        const authorW = ctx!.measureText(authorStr).width;
        const dotW = ctx!.measureText(" · ").width;
        const brandStr = "CoinSight 幣析";

        // Author (rightmost, secondary color)
        drawText(ctx!, authorStr, W - PAD, footerY + 18, {
          font: FONT,
          size: 13,
          color: t.textSecondary,
          align: "right",
        });

        // Dot separator
        drawText(ctx!, " · ", W - PAD - authorW, footerY + 18, {
          font: FONT,
          size: 13,
          color: t.textSecondary,
          align: "right",
        });

        // Brand name (accent/gradient)
        const brandX = W - PAD - authorW - dotW;
        if (theme.id === "dark-tech" && t.brandGradient) {
          const grad = ctx!.createLinearGradient(brandX - 140, footerY + 16, brandX, footerY + 16);
          grad.addColorStop(0, t.brandGradient[0]);
          grad.addColorStop(1, t.brandGradient[1]);
          ctx!.font = `bold 14px ${FONT}`;
          ctx!.fillStyle = grad;
          ctx!.textAlign = "right";
          ctx!.textBaseline = "top";
          ctx!.fillText(brandStr, brandX, footerY + 18);
        } else {
          drawText(ctx!, brandStr, brandX, footerY + 18, {
            font: FONT,
            size: 14,
            color: t.accent,
            align: "right",
            bold: true,
          });
        }
      }

      render();
    }, [symbol, price, score, signal, indicators, srLevels, fundingAvgRate, fundingSignal, derivatives, timeframe, theme]);

    return (
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        style={{ width: "100%", height: "auto", borderRadius: 8 }}
      />
    );
  },
);
