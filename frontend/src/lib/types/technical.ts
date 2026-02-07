export type Signal = "bullish" | "bearish" | "neutral";

export interface IndicatorSignal {
  name: string;
  signal: Signal;
  strength: number;
  continuous_score: number;
  latest_values: Record<string, number | null>;
  metadata: Record<string, unknown>;
}

export interface TechnicalAnalysisResponse {
  symbol: string;
  timeframe: string;
  indicators: IndicatorSignal[];
  overall_signal: Signal;
  overall_score: number;
  consensus: number;
}

export interface SingleIndicatorResponse {
  symbol: string;
  timeframe: string;
  indicator: IndicatorSignal;
}

// --- 指標時間序列 (圖表覆蓋用) ---

export interface TimeSeriesPoint {
  time: number;
  value: number | null;
}

export interface IndicatorSeriesData {
  name: string;
  lines: Record<string, TimeSeriesPoint[]>;
}

export interface IndicatorSeriesResponse {
  symbol: string;
  timeframe: string;
  indicator: IndicatorSeriesData;
}

export interface SupportResistanceLevel {
  price: number;
  label: string;
}

export interface SupportResistanceResponse {
  symbol: string;
  timeframe: string;
  levels: SupportResistanceLevel[];
}

export type OverlayIndicator = "ema" | "bbands" | "sr" | "vpvr";
export type SubChartIndicator = "rsi" | "kd" | "macd";
