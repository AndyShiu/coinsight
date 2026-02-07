import { IndicatorCard } from "./indicator-card";
import type { IndicatorSignal } from "@/lib/types/technical";

export function IndicatorGrid({ indicators }: { indicators: IndicatorSignal[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {indicators.map((ind) => (
        <IndicatorCard key={ind.name} indicator={ind} />
      ))}
    </div>
  );
}
