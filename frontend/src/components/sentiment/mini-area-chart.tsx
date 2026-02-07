"use client";

import { useId } from "react";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

interface MiniAreaChartProps {
  data: { time: number; value: number }[];
  color: string;
  height?: number;
  referenceY?: number;
}

export function MiniAreaChart({
  data,
  color,
  height = 80,
  referenceY,
}: MiniAreaChartProps) {
  const gradientId = useId();

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        {referenceY != null && (
          <ReferenceLine
            y={referenceY}
            stroke="rgba(255,255,255,0.15)"
            strokeDasharray="3 3"
          />
        )}
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          fill={`url(#${gradientId})`}
          strokeWidth={1.5}
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
