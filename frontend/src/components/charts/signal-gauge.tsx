import { Card, CardContent } from "@/components/ui/card";
import { SignalBadge } from "@/components/indicators/signal-badge";
import { InfoTooltip } from "@/components/indicators/info-tooltip";
import { overallScoreInfo, consensusInfo } from "@/lib/utils/indicator-info";

interface SignalGaugeProps {
  score: number;
  signal: string;
  consensus?: number;
}

export function SignalGauge({ score, signal, consensus }: SignalGaugeProps) {
  const pct = ((score + 1) / 2) * 100;

  const consensusPct = consensus != null ? Math.round(consensus * 100) : null;
  const consensusLabel =
    consensusPct != null
      ? consensusPct >= 80
        ? "高度一致"
        : consensusPct >= 50
          ? "中等一致"
          : "分歧較大"
      : null;
  const consensusColor =
    consensusPct != null
      ? consensusPct >= 80
        ? "text-emerald-500"
        : consensusPct >= 50
          ? "text-yellow-500"
          : "text-red-500"
      : "";
  const consensusBarColor =
    consensusPct != null
      ? consensusPct >= 80
        ? "bg-emerald-500"
        : consensusPct >= 50
          ? "bg-yellow-500"
          : "bg-red-500"
      : "";

  return (
    <Card>
      <CardContent className="py-4 px-5">
        <div className="flex items-center justify-between mb-3">
          <p className="flex items-center gap-1.5 text-sm font-medium">
            綜合評分
            <InfoTooltip info={overallScoreInfo} />
          </p>
          <SignalBadge signal={signal} />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold tabular-nums">{score.toFixed(2)}</span>
          <div className="flex-1">
            <div className="relative h-3 rounded-full bg-muted overflow-hidden">
              <div className="absolute top-0 left-1/2 w-px h-full bg-muted-foreground/30" />
              <div
                className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-emerald-500 opacity-20"
                style={{ width: "100%" }}
              />
              <div
                className="absolute top-0 h-3 w-3 rounded-full border-2 border-background shadow-md transition-all"
                style={{
                  left: `calc(${pct}% - 6px)`,
                  backgroundColor:
                    score > 0.2 ? "#10b981" : score < -0.2 ? "#ef4444" : "#eab308",
                }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
              <span>-1.0</span>
              <span>0</span>
              <span>+1.0</span>
            </div>
          </div>
        </div>

        {/* 一致性指標 */}
        {consensusPct != null && (
          <div className="mt-3 pt-3 border-t border-border/50">
            <div className="flex items-center justify-between mb-1.5">
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                指標一致性
                <InfoTooltip info={consensusInfo} />
              </p>
              <span className={`text-xs font-medium ${consensusColor}`}>
                {consensusLabel} ({consensusPct}%)
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${consensusBarColor}`}
                style={{ width: `${consensusPct}%` }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
