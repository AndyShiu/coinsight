import { Badge } from "@/components/ui/badge";
import { getSignalConfig } from "@/lib/utils/signal-colors";

export function SignalBadge({ signal }: { signal: string }) {
  const config = getSignalConfig(signal);
  return (
    <Badge variant="outline" className={`${config.bg} ${config.text} ${config.border}`}>
      {config.label}
    </Badge>
  );
}
