export interface ShareThemeCanvas {
  background: string;
  backgroundGradient?: [string, string];
  cardBg: string;
  text: string;
  textSecondary: string;
  border: string;
  accent: string;
  bullish: string;
  bearish: string;
  neutral: string;
  brandGradient?: [string, string];
}

export interface ShareTheme {
  id: "dark-tech" | "clean-modern" | "light";
  name: string;
  canvas: ShareThemeCanvas;
  screenshotBg: string;
}

export const SHARE_THEMES: Record<string, ShareTheme> = {
  "dark-tech": {
    id: "dark-tech",
    name: "深色科技風",
    canvas: {
      background: "#0a0e14",
      backgroundGradient: ["#0a0e14", "#0d1a0f"],
      cardBg: "rgba(255,255,255,0.06)",
      text: "#ffffff",
      textSecondary: "#7d8590",
      border: "rgba(16,185,129,0.35)",
      accent: "#10b981",
      bullish: "#34d399",
      bearish: "#f87171",
      neutral: "#9ca3af",
      brandGradient: ["#10b981", "#eab308"],
    },
    screenshotBg: "#0d1117",
  },
  "clean-modern": {
    id: "clean-modern",
    name: "簡約深色",
    canvas: {
      background: "#0d1117",
      cardBg: "rgba(255,255,255,0.08)",
      text: "#e6edf3",
      textSecondary: "#7d8590",
      border: "rgba(255,255,255,0.08)",
      accent: "#10b981",
      bullish: "#10b981",
      bearish: "#ef4444",
      neutral: "#71717a",
    },
    screenshotBg: "#0d1117",
  },
  light: {
    id: "light",
    name: "淺色簡約",
    canvas: {
      background: "#ffffff",
      cardBg: "#f3f4f6",
      text: "#1f2937",
      textSecondary: "#6b7280",
      border: "#e5e7eb",
      accent: "#059669",
      bullish: "#059669",
      bearish: "#dc2626",
      neutral: "#6b7280",
    },
    screenshotBg: "#ffffff",
  },
};

export type ShareThemeId = keyof typeof SHARE_THEMES;
