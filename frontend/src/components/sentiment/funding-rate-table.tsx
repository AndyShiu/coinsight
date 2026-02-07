"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { SignalBadge } from "@/components/indicators/signal-badge";
import { InfoTooltip } from "@/components/indicators/info-tooltip";
import { useFundingRates } from "@/lib/hooks/use-funding-rates";
import { formatRate } from "@/lib/utils/format";
import { sentimentInfo } from "@/lib/utils/indicator-info";

export function FundingRateTable({ symbol = "BTC" }: { symbol?: string }) {
  const { data, isLoading } = useFundingRates(symbol);

  if (isLoading) return <Skeleton className="h-48 w-full" />;
  if (!data) return null;

  const hasExchanges = data.exchanges.length > 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-1.5 text-base">
            資金費率 ({symbol})
            <InfoTooltip info={sentimentInfo.fundingRate} />
          </CardTitle>
          <SignalBadge signal={data.signal} />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-lg font-semibold mb-3">
          平均: <span className="tabular-nums">{formatRate(data.avg_rate)}</span>
        </p>
        {hasExchanges ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>交易所</TableHead>
                <TableHead className="text-right">費率</TableHead>
                <TableHead className="text-right">預估下次</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.exchanges.map((ex) => (
                <TableRow key={ex.exchange}>
                  <TableCell className="text-sm">{ex.exchange}</TableCell>
                  <TableCell className={`text-right font-mono text-sm ${ex.rate > 0 ? "text-red-400" : "text-emerald-400"}`}>
                    {formatRate(ex.rate)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm text-muted-foreground">
                    {ex.predicted_rate != null ? formatRate(ex.predicted_rate) : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-sm text-muted-foreground">需要 CoinGlass API key 取得交易所數據</p>
        )}
      </CardContent>
    </Card>
  );
}
