import { useState } from "react";
import { Link } from "react-router-dom";
import satelliteDish from "@/assets/satellite-dish.png";
import { RefreshCw, Clock, ArrowUpDown, Activity, AlertCircle } from "lucide-react";
import { ForecastCard } from "@/components/ForecastCard";
import { ForecastCardSkeleton } from "@/components/ForecastCardSkeleton";
import { DataSourcesTable } from "@/components/DataSourcesTable";
import { LivePredictionFeed } from "@/components/LivePredictionFeed";
import { OpportunitiesPanel } from "@/components/OpportunitiesPanel";
import { StatusBar } from "@/components/StatusBar";
import { LiquidityShockAlert } from "@/components/LiquidityShockAlert";
import { SentimentDonut } from "@/components/SentimentDonut";
import { TooltipProvider } from "@/components/ui/tooltip";
import { usePredictionMarkets } from "@/hooks/usePredictionMarkets";

const ASSETS = [
  { key: "btc" as const, label: "Bitcoin", variant: "btc" as const },
  { key: "sp500" as const, label: "S&P 500", variant: "sp500" as const },
  { key: "gold" as const, label: "XAU/USD", variant: "gold" as const },
  { key: "oil" as const, label: "WTI Oil", variant: "oil" as const },
];

function formatLastUpdated(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: 'UTC' }) + ' UTC';
  } catch { return '—'; }
}

const Index = () => {
  const { data, loading, error, isStale, refresh } = usePredictionMarkets();
  const [refreshing, setRefreshing] = useState(false);
  const [sortByEdge, setSortByEdge] = useState(false);
  const showSkeletons = loading && !data;

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  if (showSkeletons) {
    return (
      <div className="min-h-screen bg-background px-4 py-6 md:px-8">
        <header className="mb-6">
          <div className="flex items-center gap-4">
            <img src={satelliteDish} alt="Radar" className="h-12 w-12 md:h-14 md:w-14 drop-shadow-lg" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">MARKET RADAR</h1>
              <p className="text-sm font-medium tracking-widest text-muted-foreground uppercase">Signal Intelligence</p>
            </div>
          </div>
        </header>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <ForecastCardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-2">
          <AlertCircle className="h-8 w-8 text-bearish mx-auto" />
          <p className="text-sm text-bearish">Data unavailable</p>
          <p className="text-xs text-muted-foreground max-w-xs">{error}</p>
          <button onClick={handleRefresh} className="text-sm text-muted-foreground underline mt-2">Retry</button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const sentimentCounts = (() => {
    let bullish = 0, bearish = 0, neutral = 0;
    for (const asset of ASSETS) {
      const price = data.prices[asset.key];
      if (price.current === null) continue;
      const move = price.move ?? 0;
      if (move > 0.05) bullish++;
      else if (move < -0.05) bearish++;
      else neutral++;
    }
    return { bullish, bearish, neutral };
  })();

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background px-4 py-6 md:px-8">
        {/* Header */}
        <header className="mb-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <img src={satelliteDish} alt="Radar" className="h-9 w-9 md:h-10 md:w-10" />
              <div>
                <h1 className="text-xl font-bold tracking-tight text-foreground md:text-2xl">MARKET RADAR</h1>
                <p className="text-[10px] font-medium tracking-widest text-muted-foreground uppercase">Signal Intelligence</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <SentimentDonut
                bullishCount={sentimentCounts.bullish}
                bearishCount={sentimentCounts.bearish}
                neutralCount={sentimentCounts.neutral}
              />
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-1.5 rounded-lg border border-border bg-secondary px-2.5 py-1.5 text-[10px] text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
              >
                <RefreshCw className={`h-3 w-3 ${refreshing ? "animate-spin" : ""}`} />
                {refreshing ? "…" : "Refresh"}
              </button>
            </div>
          </div>

          {/* Merged status row: sources + platforms + LIVE indicator */}
          <StatusBar
            sources={data.sources}
            availableSources={data.dataQuality?.availableSources}
            totalSources={data.dataQuality?.totalSources}
            report={data.dataStatusReport}
            lastUpdated={data.lastUpdated}
            signalsProcessed={data.signalsProcessedCount}
          />

          {isStale && (
            <div className="mt-2 text-[10px] font-mono text-neutral animate-pulse text-center">Refreshing stale data…</div>
          )}
        </header>

        {/* Liquidity Shocks */}
        <LiquidityShockAlert shocks={data.liquidityShocks} />

        {/* Feed + Opportunities side by side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          <LivePredictionFeed data={data.globalMarketPulse} />
          <OpportunitiesPanel data={data} />
        </div>

        {/* Forecast Cards */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Asset Forecasts</span>
          <button
            onClick={() => setSortByEdge(!sortByEdge)}
            className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded border transition-colors ${sortByEdge ? "bg-accent text-foreground border-accent" : "bg-secondary text-muted-foreground border-border hover:text-foreground"}`}
          >
            <ArrowUpDown className="w-3 h-3" />
            {sortByEdge ? "Sorted by opportunity" : "Sort by opportunity"}
          </button>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          {(() => {
            const sorted = sortByEdge
              ? [...ASSETS].sort((a, b) => {
                  const confA = (data.prediction[`${a.key}Confidence` as keyof typeof data.prediction] as number) / 100;
                  const confB = (data.prediction[`${b.key}Confidence` as keyof typeof data.prediction] as number) / 100;
                  const mktA = data.marketProbability?.[a.key] ?? confA;
                  const mktB = data.marketProbability?.[b.key] ?? confB;
                  return Math.abs(confB - mktB) - Math.abs(confA - mktA);
                })
              : ASSETS;
            return sorted.map((asset) => {
              const dbAssetKey: Record<string, string> = { btc: 'BTC', sp500: 'SPX', gold: 'XAU', oil: 'OIL' };
              const liveAcc = data.liveAccuracy?.[dbAssetKey[asset.key]];
              const priceData = data.prices[asset.key];
              return (
                <ForecastCard
                  key={asset.key}
                  label={asset.label}
                  variant={asset.variant}
                  expectedMove={priceData.move}
                  confidence={data.prediction[`${asset.key}Confidence` as keyof typeof data.prediction] as number}
                  currentPrice={priceData.current}
                  predictedPrice={priceData.predicted}
                  liveSources={data.sources.polymarket + data.sources.kalshi + data.sources.manifold}
                  sources={data.sources}
                  signalsProcessed={data.signalsProcessedCount}
                  reliability="high"
                  regime={data.regime}
                  accuracyByTimeframe={data.accuracyByTimeframe?.[asset.key]}
                  liveAccuracy={liveAcc}
                  priceSource={priceData.source}
                  marketProbability={data.marketProbability?.[asset.key]}
                  backtestPredictions={data.backtestStats?.[asset.key]?.predictions}
                  backtestAccuracy={data.backtestStats?.[asset.key]?.accuracy}
                  activeSources={data.dataQuality?.availableSources}
                  totalSources={data.dataQuality?.totalSources}
                  predictionData={data}
                />
              );
            });
          })()}
        </div>

        {/* Data Sources Table */}
        {data.dataSources && (
          <div className="mb-6">
            <DataSourcesTable sources={data.dataSources} />
          </div>
        )}

        {/* Footer */}
        <footer className="text-center text-xs text-muted-foreground py-4 border-t border-border space-y-1">
          <div className="flex items-center justify-center gap-1.5">
            <Clock className="w-3 h-3" />
            <p>Last updated: {formatLastUpdated(data.lastUpdated)}</p>
          </div>
          <p className="text-[9px] font-mono">
            API v{data.apiVersion || '?'} · Model: {data.modelVersion || '?'} · Sources: {data.dataQuality?.availableSources ?? '?'}/{data.dataQuality?.totalSources ?? '?'} active
          </p>
          <Link to="/performance" className="inline-flex items-center gap-1.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors mt-1">
            <Activity className="w-3 h-3" />
            View Oracle Performance →
          </Link>
        </footer>
      </div>
    </TooltipProvider>
  );
};

export default Index;
