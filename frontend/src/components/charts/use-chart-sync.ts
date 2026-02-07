import { useEffect, useRef, type RefObject } from "react";
import type { IChartApi, LogicalRangeChangeEventHandler } from "lightweight-charts";

/**
 * 同步主圖與子圖的可見時間範圍。
 * 使用 time range (而非 logical range) 同步，確保數據量不同時仍能對齊。
 * 防止無限迴圈：用 isSyncing guard。
 */
export function useChartSync(
  mainChartRef: RefObject<IChartApi | null>,
  subChartRefs: RefObject<Map<string, IChartApi>>,
) {
  const isSyncing = useRef(false);
  // Poll interval to pick up sub chart changes
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevSubKeysRef = useRef("");

  useEffect(() => {
    let disposed = false;

    const setup = () => {
      const mainChart = mainChartRef.current;
      const subs = subChartRefs.current;
      if (!mainChart || !subs || subs.size === 0) return null;

      const syncFromMain = () => {
        if (isSyncing.current || disposed) return;
        isSyncing.current = true;
        try {
          const timeRange = mainChart.timeScale().getVisibleRange();
          if (timeRange) {
            for (const sub of subs.values()) {
              try { sub.timeScale().setVisibleRange(timeRange); } catch { /* disposed */ }
            }
          }
        } catch { /* disposed */ }
        requestAnimationFrame(() => { isSyncing.current = false; });
      };

      const mainHandler: LogicalRangeChangeEventHandler = () => syncFromMain();
      try {
        mainChart.timeScale().subscribeVisibleLogicalRangeChange(mainHandler);
      } catch { return null; }

      const subHandlers: { chart: IChartApi; handler: LogicalRangeChangeEventHandler }[] = [];
      for (const [key, subChart] of subs.entries()) {
        const handler: LogicalRangeChangeEventHandler = () => {
          if (isSyncing.current || disposed) return;
          isSyncing.current = true;
          try {
            const timeRange = subChart.timeScale().getVisibleRange();
            if (timeRange) {
              try { mainChart.timeScale().setVisibleRange(timeRange); } catch { /* disposed */ }
              for (const [otherKey, other] of subs.entries()) {
                if (otherKey !== key) {
                  try { other.timeScale().setVisibleRange(timeRange); } catch { /* disposed */ }
                }
              }
            }
          } catch { /* disposed */ }
          requestAnimationFrame(() => { isSyncing.current = false; });
        };
        try {
          subChart.timeScale().subscribeVisibleLogicalRangeChange(handler);
          subHandlers.push({ chart: subChart, handler });
        } catch { /* disposed */ }
      }

      return { mainChart, mainHandler, subHandlers };
    };

    let current = setup();

    // Re-setup when sub charts change (added/removed)
    intervalRef.current = setInterval(() => {
      const subs = subChartRefs.current;
      const keys = subs ? [...subs.keys()].sort().join(",") : "";
      if (keys !== prevSubKeysRef.current) {
        prevSubKeysRef.current = keys;
        // Cleanup old
        if (current) {
          try { current.mainChart.timeScale().unsubscribeVisibleLogicalRangeChange(current.mainHandler); } catch { /* disposed */ }
          for (const { chart, handler } of current.subHandlers) {
            try { chart.timeScale().unsubscribeVisibleLogicalRangeChange(handler); } catch { /* disposed */ }
          }
        }
        // Setup new
        current = setup();
      }
    }, 500);

    return () => {
      disposed = true;
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (current) {
        try { current.mainChart.timeScale().unsubscribeVisibleLogicalRangeChange(current.mainHandler); } catch { /* disposed */ }
        for (const { chart, handler } of current.subHandlers) {
          try { chart.timeScale().unsubscribeVisibleLogicalRangeChange(handler); } catch { /* disposed */ }
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
