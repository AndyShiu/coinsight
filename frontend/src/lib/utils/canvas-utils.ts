import type { ShareThemeCanvas } from "@/components/share/share-themes";

/* ------------------------------------------------------------------ */
/*  Canvas 2D 繪圖輔助函式                                              */
/* ------------------------------------------------------------------ */

/** 圓角矩形 */
export function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  fill?: string,
  stroke?: string,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

/** 文字繪製 */
export function drawText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  opts: {
    font?: string;
    size?: number;
    color?: string;
    align?: CanvasTextAlign;
    baseline?: CanvasTextBaseline;
    bold?: boolean;
    maxWidth?: number;
  } = {},
) {
  const {
    font = "sans-serif",
    size = 14,
    color = "#fff",
    align = "left",
    baseline = "top",
    bold = false,
    maxWidth,
  } = opts;
  ctx.font = `${bold ? "bold " : ""}${size}px ${font}`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  if (maxWidth) {
    ctx.fillText(text, x, y, maxWidth);
  } else {
    ctx.fillText(text, x, y);
  }
}

/** 信號色圓點 */
export function drawSignalDot(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  signal: string,
  theme: ShareThemeCanvas,
) {
  const color =
    signal === "bullish"
      ? theme.bullish
      : signal === "bearish"
        ? theme.bearish
        : theme.neutral;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}

/** Score Gauge 長條 (漸層紅→黃→綠 + 指標圓點) */
export function drawGaugeBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  score: number,
  theme: ShareThemeCanvas,
) {
  // 背景
  drawRoundRect(ctx, x, y, w, h, h / 2, "rgba(255,255,255,0.08)");

  // 漸層條
  const grad = ctx.createLinearGradient(x, y, x + w, y);
  grad.addColorStop(0, theme.bearish);
  grad.addColorStop(0.5, "#eab308");
  grad.addColorStop(1, theme.bullish);
  ctx.globalAlpha = 0.3;
  drawRoundRect(ctx, x, y, w, h, h / 2, undefined);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.globalAlpha = 1;

  // 中線
  const midX = x + w / 2;
  ctx.beginPath();
  ctx.moveTo(midX, y);
  ctx.lineTo(midX, y + h);
  ctx.strokeStyle = "rgba(255,255,255,0.2)";
  ctx.lineWidth = 1;
  ctx.stroke();

  // 指標圓點
  const pct = (score + 1) / 2; // -1~1 → 0~1
  const dotX = x + pct * w;
  const dotY = y + h / 2;
  const dotR = h / 2 + 2;
  const dotColor =
    score > 0.2
      ? theme.bullish
      : score < -0.2
        ? theme.bearish
        : "#eab308";
  ctx.beginPath();
  ctx.arc(dotX, dotY, dotR, 0, Math.PI * 2);
  ctx.fillStyle = dotColor;
  ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,0.5)";
  ctx.lineWidth = 2;
  ctx.stroke();
}

/** 水平分隔線 */
export function drawDivider(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.stroke();
}

/** 信號中文標籤 */
export function signalLabel(signal: string): string {
  if (signal === "bullish") return "看多";
  if (signal === "bearish") return "看空";
  return "中性";
}

/** 信號顏色 */
export function signalColor(signal: string, theme: ShareThemeCanvas): string {
  if (signal === "bullish") return theme.bullish;
  if (signal === "bearish") return theme.bearish;
  return theme.neutral;
}
