/** 將 Canvas 圖片複製到剪貼簿 */
export async function copyCanvasToClipboard(
  canvas: HTMLCanvasElement,
): Promise<boolean> {
  try {
    // Safari 需要用 Promise<Blob> 寫法
    const item = new ClipboardItem({
      "image/png": new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Failed to create blob"));
        }, "image/png");
      }),
    });
    await navigator.clipboard.write([item]);
    return true;
  } catch {
    return false;
  }
}

/** 將 Canvas 下載為 PNG 檔案 */
export function downloadCanvasAsPng(
  canvas: HTMLCanvasElement,
  filename: string,
): void {
  const url = canvas.toDataURL("image/png");
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
