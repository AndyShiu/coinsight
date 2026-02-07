// 指標顏色常數

export const CANDLE = {
  up: "#10b981",
  down: "#ef4444",
} as const;

export const EMA = {
  fast: "#f59e0b",   // amber
  slow: "#8b5cf6",   // purple
} as const;

export const BBANDS = {
  upper: "#3b82f6",  // blue
  middle: "#60a5fa", // lighter blue
  lower: "#3b82f6",  // blue
} as const;

export const SR = {
  support: "#06b6d4",    // cyan — 區隔 candle 漲色 green
  resistance: "#fb923c", // orange — 區隔 candle 跌色 red
  pivot: "#a78bfa",      // violet
} as const;

export const RSI = {
  line: "#f59e0b",   // amber
} as const;

export const KD = {
  k: "#f59e0b",      // amber (K line)
  d: "#3b82f6",      // blue (D line)
} as const;

export const MACD_COLORS = {
  macd: "#3b82f6",   // blue
  signal: "#f59e0b", // amber
  histUp: "rgba(16,185,129,0.6)",
  histDown: "rgba(239,68,68,0.6)",
} as const;

export const VOLUME_PROFILE = {
  bar: "rgba(99,102,241,0.3)",  // indigo with opacity
  poc: "rgba(99,102,241,0.6)",  // Point of Control brighter
} as const;

// 圖表背景 / 格線 / 文字顏色 (深淺模式)
export interface ChartThemeColors {
  text: string;
  grid: string;
  border: string;
  crosshair: string;
  volumeUp: string;
  volumeDown: string;
}

export const CHART_THEME: Record<string, ChartThemeColors> = {
  dark: {
    text: "#7d8590",
    grid: "rgba(255,255,255,0.04)",
    border: "rgba(255,255,255,0.08)",
    crosshair: "#374151",
    volumeUp: "rgba(16,185,129,0.3)",
    volumeDown: "rgba(239,68,68,0.3)",
  },
  light: {
    text: "#6b7280",
    grid: "rgba(0,0,0,0.06)",
    border: "rgba(0,0,0,0.1)",
    crosshair: "#e5e7eb",
    volumeUp: "rgba(16,185,129,0.25)",
    volumeDown: "rgba(239,68,68,0.25)",
  },
};
