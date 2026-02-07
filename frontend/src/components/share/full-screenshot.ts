import { toCanvas } from "html-to-image";
import type { ShareTheme } from "./share-themes";

/**
 * 檢查元素是否可見（排除 opacity:0、display:none、visibility:hidden 的祖先）
 */
function isElementVisible(el: HTMLElement): boolean {
  let node: HTMLElement | null = el;
  while (node) {
    const style = window.getComputedStyle(node);
    if (style.opacity === "0" || style.display === "none" || style.visibility === "hidden") {
      return false;
    }
    node = node.parentElement;
  }
  return true;
}

/**
 * 透過 Next.js image proxy 下載外部圖片為 ImageBitmap，繞過 CORS 限制。
 */
async function fetchImageBitmap(src: string): Promise<ImageBitmap | null> {
  try {
    // 用 Next.js /_next/image 代理取得同源圖片，避免 CORS
    const proxyUrl = `/_next/image?url=${encodeURIComponent(src)}&w=96&q=75`;
    const resp = await fetch(proxyUrl);
    if (!resp.ok) return null;
    const blob = await resp.blob();
    return await createImageBitmap(blob);
  } catch {
    return null;
  }
}

/**
 * 截取整個頁面容器為 Canvas，並合併 lightweight-charts 的 Canvas 元素。
 * html-to-image 預設無法正確擷取原生 Canvas 內容（如圖表）和跨域圖片，
 * 因此需要手動合併。
 *
 * 策略：
 * 1. 收集外部圖片位置，截圖時跳過（避免 CORS 失敗）
 * 2. 用 fetch 單獨下載外部圖片
 * 3. 截圖後手動繪製圖片和 chart canvas 到結果上
 */
export async function captureFullScreenshot(
  container: HTMLElement,
  theme: ShareTheme,
): Promise<HTMLCanvasElement> {
  const rect = container.getBoundingClientRect();
  const ratio = 2; // pixelRatio

  // 收集所有 canvas 元素及其位置
  const chartCanvases: { canvas: HTMLCanvasElement; offsetX: number; offsetY: number }[] = [];
  container.querySelectorAll("canvas").forEach((c) => {
    const cr = c.getBoundingClientRect();
    chartCanvases.push({
      canvas: c,
      offsetX: cr.left - rect.left,
      offsetY: cr.top - rect.top,
    });
  });

  // 收集外部圖片的位置和尺寸，同時開始 fetch
  const externalImgs: {
    offsetX: number;
    offsetY: number;
    width: number;
    height: number;
    bitmapPromise: Promise<ImageBitmap | null>;
  }[] = [];

  container.querySelectorAll("img").forEach((img) => {
    const src = img.src || "";
    if (!src.startsWith("http") || src.startsWith(window.location.origin)) return;
    if (src.startsWith("data:")) return;
    if (!isElementVisible(img)) return;
    const cr = img.getBoundingClientRect();
    if (cr.width === 0 || cr.height === 0) return;
    externalImgs.push({
      offsetX: cr.left - rect.left,
      offsetY: cr.top - rect.top,
      width: cr.width,
      height: cr.height,
      bitmapPromise: fetchImageBitmap(src),
    });
  });

  // 1×1 transparent PNG — 外部圖片 CORS 失敗時的 placeholder（保留版面空間）
  const TRANSPARENT_PIXEL =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQI12NgAAIABQABNjN9GQAAAABJRU5ErkJggg==";

  // 用 html-to-image 截取 DOM（外部圖片 CORS 失敗時用透明 placeholder 保留空間）
  const domCanvas = await toCanvas(container, {
    backgroundColor: theme.screenshotBg,
    width: rect.width,
    height: rect.height,
    pixelRatio: ratio,
    skipFonts: true,
    imagePlaceholder: TRANSPARENT_PIXEL,
    style: {
      transform: "none",
      transformOrigin: "top left",
    },
  });

  const ctx = domCanvas.getContext("2d");
  if (!ctx) return domCanvas;

  // 手動繪製外部圖片
  for (const ei of externalImgs) {
    const bitmap = await ei.bitmapPromise;
    if (!bitmap) continue;
    try {
      ctx.drawImage(
        bitmap,
        ei.offsetX * ratio,
        ei.offsetY * ratio,
        ei.width * ratio,
        ei.height * ratio,
      );
      bitmap.close();
    } catch {
      // skip
    }
  }

  // 合併 chart canvas 內容
  for (const { canvas, offsetX, offsetY } of chartCanvases) {
    if (canvas.width === 0 || canvas.height === 0) continue;
    try {
      ctx.drawImage(
        canvas,
        offsetX * ratio,
        offsetY * ratio,
        canvas.getBoundingClientRect().width * ratio,
        canvas.getBoundingClientRect().height * ratio,
      );
    } catch {
      // Cross-origin or tainted canvas — skip
    }
  }

  // === 外框 + Footer ===
  const t = theme.canvas;
  const FONT = '"Geist Sans", "Inter", -apple-system, "Helvetica Neue", sans-serif';
  const padX = 20 * ratio;   // 左右邊距
  const padTop = 20 * ratio; // 上邊距
  const padBot = 6 * ratio;  // 下邊距（截圖到 footer 間距）
  const footerH = 48 * ratio;
  const finalW = domCanvas.width + padX * 2;
  const finalH = domCanvas.height + padTop + padBot + footerH;

  const finalCanvas = document.createElement("canvas");
  finalCanvas.width = finalW;
  finalCanvas.height = finalH;
  const fCtx = finalCanvas.getContext("2d");
  if (!fCtx) return domCanvas;

  // 背景（邊框色）
  if (t.backgroundGradient) {
    const grad = fCtx.createLinearGradient(0, 0, finalW, finalH);
    grad.addColorStop(0, t.backgroundGradient[0]);
    grad.addColorStop(1, t.backgroundGradient[1]);
    fCtx.fillStyle = grad;
  } else {
    fCtx.fillStyle = t.background;
  }
  fCtx.fillRect(0, 0, finalW, finalH);

  // 邊框線
  const borderColor = theme.id === "dark-tech" ? "rgba(16,185,129,0.5)" : t.border;
  fCtx.strokeStyle = borderColor;
  fCtx.lineWidth = 2 * ratio;
  fCtx.strokeRect(ratio, ratio, finalW - 2 * ratio, finalH - 2 * ratio);

  // 截圖內容
  fCtx.drawImage(domCanvas, padX, padTop);

  // Footer 區域
  const footerY = padTop + domCanvas.height + 4 * ratio;

  // 分隔線
  fCtx.beginPath();
  fCtx.moveTo(padX, footerY);
  fCtx.lineTo(finalW - padX, footerY);
  fCtx.strokeStyle = borderColor;
  fCtx.lineWidth = ratio;
  fCtx.stroke();

  // 品牌文字 (左側)
  const textY = footerY + footerH / 2 - 2 * ratio;
  const pad = padX + 16 * ratio;

  // 左側: 品牌 · 作者
  if (theme.id === "dark-tech" && t.brandGradient) {
    const grad = fCtx.createLinearGradient(pad, textY, pad + 300 * ratio, textY);
    grad.addColorStop(0, t.brandGradient[0]);
    grad.addColorStop(1, t.brandGradient[1]);
    fCtx.font = `bold ${16 * ratio}px ${FONT}`;
    fCtx.fillStyle = grad;
    fCtx.textAlign = "left";
    fCtx.textBaseline = "middle";
    fCtx.fillText("CoinSight 幣析", pad, textY);
  } else {
    fCtx.font = `bold ${16 * ratio}px ${FONT}`;
    fCtx.fillStyle = t.accent;
    fCtx.textAlign = "left";
    fCtx.textBaseline = "middle";
    fCtx.fillText("CoinSight 幣析", pad, textY);
  }

  // 品牌名稱寬度
  fCtx.font = `bold ${16 * ratio}px ${FONT}`;
  const brandW = fCtx.measureText("CoinSight 幣析").width;

  fCtx.font = `${12 * ratio}px ${FONT}`;
  fCtx.fillStyle = t.textSecondary;
  fCtx.textAlign = "left";
  fCtx.textBaseline = "middle";
  fCtx.fillText(" · github.com/AndyShiu", pad + brandW, textY);

  // 右側: 日期 + 免責聲明
  const now = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const rightPad = finalW - padX - 16 * ratio;

  fCtx.font = `${12 * ratio}px ${FONT}`;
  fCtx.fillStyle = t.textSecondary;
  fCtx.textAlign = "right";
  fCtx.textBaseline = "middle";
  fCtx.fillText(`${dateStr}  |  資料僅供參考，不構成投資建議`, rightPad, textY);

  return finalCanvas;
}
