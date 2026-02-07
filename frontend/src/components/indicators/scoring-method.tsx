"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const GROUPS = [
  { name: "動量", indicators: "RSI, KD, MACD", weight: "25%", note: "三者皆衡量動量，高度相關，共享一組權重避免重複投票" },
  { name: "趨勢", indicators: "EMA", weight: "20%", note: "快慢均線交叉判斷趨勢方向" },
  { name: "波動", indicators: "BB (布林通道)", weight: "15%", note: "價格波動範圍與突破訊號" },
  { name: "量能", indicators: "Volume / OBV", weight: "10%", note: "成交量驗證價格走勢" },
  { name: "衍生品", indicators: "OI, 多空比, 主動買賣量", weight: "30%", note: "市場結構與資金流向，獨立於價格走勢的補充資訊" },
];

export function ScoringMethod() {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-lg border border-border bg-card/50">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <span>評分計算方法</span>
        <ChevronDown
          className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 text-sm">
          <p className="text-muted-foreground leading-relaxed">
            綜合評分採用<strong className="text-foreground">連續分數 + 分組加權法</strong>。
            每個指標根據原始數值計算 -1.0 ~ +1.0 的連續分數（而非簡單的看多/看空分類），
            再按分析維度分為 5 組。同組指標取平均後乘以群組權重，避免相關指標重複投票。
          </p>

          <div className="text-xs font-mono bg-muted/50 rounded-md p-3 leading-relaxed text-muted-foreground">
            <p>每個指標的連續分數：</p>
            <p className="ml-2">RSI: 分段線性映射 (50→0, 30→+0.4, 70→-0.4)</p>
            <p className="ml-2">MACD/EMA: tanh 平滑映射 (相對價格百分比)</p>
            <p className="ml-2">BB: %B 值映射 (0.5→0, 0→+0.5, 1→-0.5)</p>
            <p className="ml-2">衍生品: tanh 映射 + 弱訊號區壓縮</p>
            <p className="mt-2">組內平均 = Σ(連續分數) ÷ 組內指標數</p>
            <p>綜合評分 = Σ(組內平均 × 群組權重)</p>
            <p className="mt-2">一致性 = 1 − std(所有連續分數)</p>
            <p className="mt-2">範圍：-1.0 ~ +1.0</p>
            <p>&gt; 0.2 → 偏多 | &lt; -0.2 → 偏空 | 其餘 → 中性</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left py-1.5 pr-3 font-medium">分析維度</th>
                  <th className="text-left py-1.5 pr-3 font-medium">指標</th>
                  <th className="text-right py-1.5 pr-3 font-medium">權重</th>
                  <th className="text-left py-1.5 font-medium">說明</th>
                </tr>
              </thead>
              <tbody>
                {GROUPS.map((g) => (
                  <tr key={g.name} className="border-b border-border/50">
                    <td className="py-1.5 pr-3 font-medium text-foreground">{g.name}</td>
                    <td className="py-1.5 pr-3 text-muted-foreground">{g.indicators}</td>
                    <td className="py-1.5 pr-3 text-right font-mono text-foreground">{g.weight}</td>
                    <td className="py-1.5 text-muted-foreground">{g.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-[11px] text-muted-foreground/70">
            技術指標合計 70%、衍生品指標合計 30%。連續分數取代離散信號，使 RSI=31 與 RSI=15
            有不同權重（而非都歸類為「看多」）。一致性指標衡量各指標方向的分歧程度，
            幫助判斷評分結果的可信度。
          </p>
        </div>
      )}
    </div>
  );
}
