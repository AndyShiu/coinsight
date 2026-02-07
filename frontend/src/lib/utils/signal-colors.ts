import type { Signal } from "../types/technical";

export const signalConfig: Record<Signal, { bg: string; text: string; border: string; label: string }> = {
  bullish: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30", label: "看多" },
  bearish: { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/30", label: "看空" },
  neutral: { bg: "bg-zinc-500/10", text: "text-zinc-400", border: "border-zinc-500/30", label: "中性" },
};

export function getSignalConfig(signal: string) {
  return signalConfig[(signal as Signal)] ?? signalConfig.neutral;
}

export function changeColor(value: number | null): string {
  if (value == null) return "text-zinc-400";
  return value >= 0 ? "text-emerald-400" : "text-red-400";
}

export function fearGreedColor(value: number): string {
  if (value <= 25) return "text-red-500";
  if (value <= 45) return "text-orange-400";
  if (value <= 55) return "text-yellow-400";
  if (value <= 75) return "text-emerald-400";
  return "text-emerald-300";
}

export function fearGreedBg(value: number): string {
  if (value <= 25) return "bg-red-500/20";
  if (value <= 45) return "bg-orange-500/20";
  if (value <= 55) return "bg-yellow-500/20";
  if (value <= 75) return "bg-emerald-500/20";
  return "bg-emerald-500/20";
}
