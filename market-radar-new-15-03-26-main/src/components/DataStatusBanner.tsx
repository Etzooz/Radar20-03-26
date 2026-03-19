import { AlertTriangle, Wifi, WifiOff, Activity } from "lucide-react";

interface DataStatusReport {
  status: 'ONLINE' | 'OFFLINE';
  message: string;
  indicatorsActive: boolean;
  tradingSignalsEnabled: boolean;
  failedSources: string[];
  lastOnline: string | null;
  logs: string[];
}

interface DataStatusBannerProps {
  report?: DataStatusReport;
}

export function DataStatusBanner({ report }: DataStatusBannerProps) {
  if (!report) return null;

  const isOnline = report.status === 'ONLINE';

  if (isOnline) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-bullish/30 bg-bullish/10 px-3 py-2 mb-4">
        <Wifi className="h-4 w-4 text-bullish shrink-0" />
        <span className="text-xs font-mono font-bold text-bullish">DATA STATUS: ONLINE</span>
        <span className="text-xs text-muted-foreground">– indicators active</span>
        <Activity className="h-3 w-3 text-bullish ml-auto animate-pulse" />
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-bearish/40 bg-bearish/10 px-3 py-3 mb-4 space-y-2">
      <div className="flex items-center gap-2">
        <WifiOff className="h-4 w-4 text-bearish shrink-0" />
        <span className="text-xs font-mono font-bold text-bearish">DATA STATUS: OFFLINE</span>
        <span className="text-xs text-muted-foreground">– waiting for valid market data</span>
      </div>
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-3 w-3 text-neutral shrink-0" />
        <span className="text-[10px] font-mono text-muted-foreground">
          INDICATORS PAUSED · TRADING SIGNALS DISABLED
        </span>
      </div>
      {report.failedSources.length > 0 && (
        <div className="text-[10px] text-muted-foreground font-mono">
          Failed: {report.failedSources.slice(0, 5).join(', ')}
          {report.failedSources.length > 5 && ` +${report.failedSources.length - 5} more`}
        </div>
      )}
      {report.lastOnline && (
        <div className="text-[10px] text-muted-foreground font-mono">
          Last online: {new Date(report.lastOnline).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: 'UTC' })} UTC
        </div>
      )}
    </div>
  );
}
