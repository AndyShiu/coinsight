import { Card, CardContent } from "@/components/ui/card";
import { SignalBadge } from "./signal-badge";
import { InfoTooltip } from "./info-tooltip";
import type { IndicatorSignal } from "@/lib/types/technical";
import { technicalIndicatorInfo, sentimentInfo } from "@/lib/utils/indicator-info";

const indicatorLabels: Record<string, string> = {
  RSI: "RSI",
  KD: "KD",
  MACD: "MACD",
  EMA: "EMA",
  BBANDS: "布林通道",
  Volume: "成交量",
  OI: "未平倉合約",
  LS_Ratio: "多空比",
  Taker: "主動買賣量",
};

// API 回傳 name → sentimentInfo key 的對應
const derivInfoMap: Record<string, string> = {
  OI: "openInterest",
  LS_Ratio: "longShortRatio",
  Taker: "takerVolume",
};

export function IndicatorCard({ indicator }: { indicator: IndicatorSignal }) {
  const label = indicatorLabels[indicator.name] ?? indicator.name;
  const strengthPct = (indicator.strength * 100).toFixed(0);
  const info =
    technicalIndicatorInfo[indicator.name] ??
    sentimentInfo[derivInfoMap[indicator.name] ?? ""];

  const mainValue = Object.entries(indicator.latest_values).find(
    ([, v]) => v != null,
  );

  return (
    <Card>
      <CardContent className="py-3 px-4">
        <div className="flex items-center justify-between mb-2">
          <span className="flex items-center gap-1.5 text-sm font-medium">
            {label}
            {info && <InfoTooltip info={info} />}
          </span>
          <SignalBadge signal={indicator.signal} />
        </div>

        {mainValue && (
          <p className="text-lg font-semibold tabular-nums mb-2">
            {typeof mainValue[1] === "number"
              ? mainValue[1].toFixed(2)
              : String(mainValue[1])}
            <span className="text-xs text-muted-foreground ml-1">{mainValue[0]}</span>
          </p>
        )}

        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${strengthPct}%` }}
            />
          </div>
          <span className="text-[10px] text-muted-foreground w-8 text-right">{strengthPct}%</span>
        </div>
      </CardContent>
    </Card>
  );
}
