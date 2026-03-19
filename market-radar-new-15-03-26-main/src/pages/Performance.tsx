import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Activity, TrendingUp, Database, BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip, CartesianGrid } from "recharts";

interface PerformanceData {
  totalPredictions: number;
  avgEdge: number;
  avgConfidence: number;
  confidenceTrend: { timestamp: string; confidence: number; asset: string }[];
  assetStats: Record<string, { predictions: number; avgEdge: number; avgConfidence: number }>;
}

const ASSET_LABELS: Record<string, string> = {
  BTC: "Bitcoin",
  SPX: "S&P 500",
  XAU: "Gold",
  OIL: "WTI Oil",
};

const ASSET_COLORS: Record<string, string> = {
  BTC: "hsl(38 90% 55%)",
  SPX: "hsl(142 70% 45%)",
  XAU: "hsl(45 90% 55%)",
  OIL: "hsl(0 72% 55%)",
};

export default function Performance() {
  const [data, setData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const { data: result, error } = await supabase.functions.invoke('oracle-performance');
        if (!error && result) setData(result as PerformanceData);
      } catch (e) {
        console.error('Failed to load performance data:', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Transform confidence trend for chart
  const chartData = data?.confidenceTrend
    ? data.confidenceTrend.reduce<Record<string, any>[]>((acc, item) => {
        const time = new Date(item.timestamp).toLocaleTimeString('en-US', {
          hour: '2-digit', minute: '2-digit', hour12: false,
        });
        const existing = acc.find(a => a.time === time);
        if (existing) {
          existing[item.asset] = item.confidence;
        } else {
          acc.push({ time, [item.asset]: item.confidence });
        }
        return acc;
      }, [])
    : [];

  return (
    <div className="min-h-screen bg-background px-4 py-6 md:px-8">
      {/* Header */}
      <header className="mb-8">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
        <div className="flex items-center gap-3">
          <Activity className="w-6 h-6 text-bullish" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">ORACLE PERFORMANCE</h1>
            <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">Historical Accuracy Engine</p>
          </div>
        </div>
      </header>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-muted-foreground border-t-foreground rounded-full animate-spin" />
        </div>
      ) : !data ? (
        <div className="text-center py-20 text-muted-foreground text-sm">Failed to load performance data</div>
      ) : (
        <>
          {/* Stats cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}
              className="bg-card rounded-xl border border-border p-5">
              <div className="flex items-center gap-2 mb-3">
                <Database className="w-4 h-4 text-muted-foreground" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total Predictions</span>
              </div>
              <span className="text-3xl font-black text-foreground font-mono tabular-nums">
                {data.totalPredictions.toLocaleString()}
              </span>
              <p className="text-[9px] text-muted-foreground mt-1">predictions processed</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="bg-card rounded-xl border border-border p-5">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Average Edge (Alpha)</span>
              </div>
              <span className={`text-3xl font-black font-mono tabular-nums ${data.avgEdge > 0 ? 'text-bullish' : data.avgEdge < 0 ? 'text-bearish' : 'text-foreground'}`}>
                {data.avgEdge > 0 ? '+' : ''}{(data.avgEdge * 100).toFixed(1)}%
              </span>
              <p className="text-[9px] text-muted-foreground mt-1">oracle vs market probability</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="bg-card rounded-xl border border-border p-5">
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="w-4 h-4 text-muted-foreground" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Avg Confidence</span>
              </div>
              <span className="text-3xl font-black text-foreground font-mono tabular-nums">
                {data.avgConfidence}%
              </span>
              <p className="text-[9px] text-muted-foreground mt-1">model confidence score</p>
            </motion.div>
          </div>

          {/* Confidence Trend Chart */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="bg-card rounded-xl border border-border p-5 mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-4 h-4 text-muted-foreground" />
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Model Confidence Trend</span>
            </div>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={chartData}>
                  <CartesianGrid stroke="hsl(220 14% 18%)" strokeDasharray="3 3" />
                  <XAxis dataKey="time" tick={{ fontSize: 9, fill: 'hsl(215 15% 55%)' }} />
                  <YAxis domain={[30, 90]} tick={{ fontSize: 9, fill: 'hsl(215 15% 55%)' }} />
                  <RechartsTooltip
                    contentStyle={{
                      background: 'hsl(220 18% 10%)',
                      border: '1px solid hsl(220 14% 18%)',
                      borderRadius: '8px',
                      fontSize: '11px',
                    }}
                  />
                  {Object.keys(ASSET_LABELS).map(asset => (
                    <Line
                      key={asset}
                      type="monotone"
                      dataKey={asset}
                      stroke={ASSET_COLORS[asset]}
                      strokeWidth={2}
                      dot={false}
                      name={ASSET_LABELS[asset]}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
                <div className="text-center">
                  <Database className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p>Gathering data — snapshots will populate this chart</p>
                </div>
              </div>
            )}
          </motion.div>

          {/* Per-asset breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(data.assetStats).map(([asset, stats], i) => (
              <motion.div key={asset} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + i * 0.05 }}
                className="bg-card rounded-xl border border-border p-4">
                <div className="text-xs font-bold text-foreground mb-3">{ASSET_LABELS[asset] || asset}</div>
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-muted-foreground">Predictions</span>
                    <span className="font-bold font-mono text-foreground">{stats.predictions.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-muted-foreground">Avg Edge</span>
                    <span className={`font-bold font-mono ${stats.avgEdge > 0 ? 'text-bullish' : stats.avgEdge < 0 ? 'text-bearish' : 'text-foreground'}`}>
                      {stats.avgEdge > 0 ? '+' : ''}{(stats.avgEdge * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-muted-foreground">Avg Confidence</span>
                    <span className="font-bold font-mono text-foreground">{stats.avgConfidence}%</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </>
      )}

      {/* Footer */}
      <footer className="text-center text-xs text-muted-foreground py-6 mt-8 border-t border-border">
        <p className="text-[9px] font-mono">Oracle Historical Accuracy Engine · Snapshot-based verification</p>
      </footer>
    </div>
  );
}
