"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { IndicatorInfo } from "@/lib/utils/indicator-info";

export function InfoTooltip({ info }: { info: IndicatorInfo }) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-muted text-muted-foreground text-[10px] leading-none hover:bg-accent hover:text-accent-foreground transition-colors cursor-help"
          >
            ?
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p className="font-medium text-sm mb-1">{info.name}</p>
          <p className="text-xs text-muted-foreground mb-1">{info.description}</p>
          <p className="text-xs text-primary">{info.interpretation}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function SimpleTooltip({ text, children }: { text: string; children: React.ReactNode }) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p className="text-xs">{text}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
