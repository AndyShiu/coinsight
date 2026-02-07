"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { FearGreedEntry } from "@/lib/types/sentiment";

interface FearGreedChartProps {
  history: FearGreedEntry[];
}

export function FearGreedChart({ history }: FearGreedChartProps) {
  const data = history.map((h) => ({
    date: h.timestamp.slice(0, 10),
    value: h.value,
  }));

  return (
    <ResponsiveContainer width="100%" height={250}>
      <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <defs>
          <linearGradient id="fgGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#eab308" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#eab308" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#9ca3af" }} tickLine={false} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "#9ca3af" }} tickLine={false} width={30} />
        <Tooltip
          contentStyle={{
            backgroundColor: "#1f2937",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "6px",
            fontSize: "12px",
          }}
        />
        <ReferenceLine y={25} stroke="rgba(239,68,68,0.3)" strokeDasharray="3 3" />
        <ReferenceLine y={75} stroke="rgba(16,185,129,0.3)" strokeDasharray="3 3" />
        <Area
          type="monotone"
          dataKey="value"
          stroke="#eab308"
          fill="url(#fgGradient)"
          strokeWidth={2}
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
