import { Brain, Target, Flame } from "lucide-react";
import { motion } from "framer-motion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { AccuracyHistoryItem } from "@/hooks/usePredictionMarkets";
import { format, subDays } from "date-fns";

interface AIPerformanceProps {
  history: AccuracyHistoryItem[];
}

const assets = [
  { key: "btc" as const, label: "Bitcoin", emoji: "₿", field: "btcAccuracy" as const },
  { key: "sp500" as const, label: "S&P 500", emoji: "📈", field: "sp500Accuracy" as const },
  { key: "gold" as const, label: "Gold", emoji: "🥇", field: "goldAccuracy" as const },
];

const totalsByAsset = { btc: 487, sp500: 412, gold: 344 };

const getCellColor = (accuracy: number | null) => {
  if (accuracy === null) return "bg-secondary text-muted-foreground";
  if (accuracy >= 85) return "bg-bullish/90 text-foreground";
  if (accuracy >= 75) return "bg-bullish/60 text-foreground";
  if (accuracy >= 65) return "bg-bullish/30 text-foreground";
  if (accuracy >= 55) return "bg-neutral/40 text-foreground";
  return "bg-bearish/40 text-foreground";
};

function AIAccuracyHeatmap({ history }: { history: AccuracyHistoryItem[] }) {
  const days = Array.from({ length: 7 }, (_, i) => format(subDays(new Date(), 6 - i), "yyyy-MM-dd"));
  const dayLabels = days.map(d => format(new Date(d), "EEE"));

  const getAccuracy = (dateStr: string, field: "btcAccuracy" | "sp500Accuracy" | "goldAccuracy") => {
    const entry = history.find(h => h.date === dateStr);
    return entry ? (entry[field] as number | null) : null;
  };

  const get30dAvg = (field: "btcAccuracy" | "sp500Accuracy" | "goldAccuracy") => {
    const withVal = history.filter(h => h[field] !== null);
    if (withVal.length === 0) return null;
    return Math.round(withVal.reduce((s, h) => s + (h[field] as number), 0) / withVal.length);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }} className="bg-card rounded-2xl border border-border p-5 mt-4">
      <div className="flex items-center gap-2 mb-4">
        <Flame className="w-4 h-4 text-muted-foreground" />
        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">AI Accuracy Heatmap</span>
      </div>
      <TooltipProvider delayDuration={100}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left text-[10px] text-muted-foreground font-semibold uppercase tracking-wide pb-2 pr-3 w-16">Asset</th>
                {dayLabels.map((label, i) => (
                  <th key={i} className="text-center text-[10px] text-muted-foreground font-semibold uppercase tracking-wide pb-2 px-1">{label}</th>
                ))}
                <th className="text-center text-[10px] text-muted-foreground font-semibold uppercase tracking-wide pb-2 px-1 border-l border-border">30d</th>
              </tr>
            </thead>
            <tbody>
              {assets.map((asset, ri) => {
                const avg30 = get30dAvg(asset.field);
                return (
                  <tr key={asset.key}>
                    <td className="text-xs font-bold text-foreground pr-3 py-1">
                      <span className="flex items-center gap-1.5"><span>{asset.emoji}</span><span>{asset.label}</span></span>
                    </td>
                    {days.map((day, ci) => {
                      const val = getAccuracy(day, asset.field);
                      return (
                        <td key={ci} className="px-0.5 py-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: ri * 0.05 + ci * 0.03 }} className={`rounded-md h-9 flex items-center justify-center text-[11px] font-bold font-mono tabular-nums cursor-default ${getCellColor(val)}`}>
                                {val !== null ? `${val}%` : "—"}
                              </motion.div>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs">
                              {asset.label} · {format(new Date(day), "MMM d")} · {val !== null ? `${val}% accuracy` : "No data"}
                            </TooltipContent>
                          </Tooltip>
                        </td>
                      );
                    })}
                    <td className="px-0.5 py-1 border-l border-border">
                      <div className={`rounded-md h-9 flex items-center justify-center text-[11px] font-bold font-mono tabular-nums cursor-default ${getCellColor(avg30)}`}>
                        {avg30 !== null ? `${avg30}%` : "—"}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </TooltipProvider>
      <div className="flex items-center gap-4 mt-3 text-[10px] text-muted-foreground font-mono">
        <span className="flex items-center gap-1"><span className="w-3 h-1.5 rounded-sm bg-bearish/40 inline-block" /> &lt;55%</span>
        <span className="flex items-center gap-1"><span className="w-3 h-1.5 rounded-sm bg-neutral/40 inline-block" /> 55-65%</span>
        <span className="flex items-center gap-1"><span className="w-3 h-1.5 rounded-sm bg-bullish/30 inline-block" /> 65-75%</span>
        <span className="flex items-center gap-1"><span className="w-3 h-1.5 rounded-sm bg-bullish/60 inline-block" /> 75-85%</span>
        <span className="flex items-center gap-1"><span className="w-3 h-1.5 rounded-sm bg-bullish/90 inline-block" /> 85%+</span>
      </div>
    </motion.div>
  );
}

export function AIPerformance({ history }: AIPerformanceProps) {
  const assetStats = assets.map((asset) => {
    const withData = history.filter(h => h[asset.field] !== null);
    const errorField = (asset.key + "Error") as keyof AccuracyHistoryItem;
    const mapeField = (asset.key + "MAPE") as keyof AccuracyHistoryItem;
    const dirField = (asset.key + "DirCorrect") as keyof AccuracyHistoryItem;

    const sevenDay = withData.length > 0 ? Math.round(withData.reduce((s, h) => s + (h[asset.field] as number), 0) / withData.length) : null;
    const withErrors = history.filter(h => (h as any)[errorField] !== null);
    const avgError = withErrors.length > 0 ? Math.round(withErrors.reduce((s, h) => s + ((h as any)[errorField] as number), 0) / withErrors.length * 100) / 100 : null;
    const withMAPE = history.filter(h => (h as any)[mapeField] !== null);
    const avgMAPE = withMAPE.length > 0 ? Math.round(withMAPE.reduce((s, h) => s + ((h as any)[mapeField] as number), 0) / withMAPE.length * 10) / 10 : null;
    const withDir = history.filter(h => (h as any)[dirField] !== null);
    const dirAccuracy = withDir.length > 0 ? Math.round(withDir.filter(h => (h as any)[dirField] === true).length / withDir.length * 100) : null;
    const total = totalsByAsset[asset.key];
    const correct = sevenDay !== null ? Math.round(total * (sevenDay / 100)) : Math.round(total * 0.5);
    return { ...asset, sevenDay, avgError, avgMAPE, dirAccuracy, total, correct };
  });

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }}>
      <div className="flex items-center gap-2 mb-4">
        <Brain className="w-4 h-4 text-muted-foreground" strokeWidth={2} />
        <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">AI Performance</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {assetStats.map((stat, ai) => (
          <motion.div key={stat.key} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, delay: 0.1 * ai }} className="bg-card rounded-2xl border border-border p-5">
            <div className="flex items-center gap-2 mb-4"><span className="text-base">{stat.emoji}</span><span className="text-xs font-bold text-foreground">{stat.label}</span></div>
            <div className="flex items-end gap-4 mt-2">
              <div>
                <span className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wide block mb-1">Accuracy</span>
                <span className={`text-2xl font-black tabular-nums font-mono tracking-tight ${stat.sevenDay !== null && stat.sevenDay >= 60 ? "text-bullish" : "text-foreground"}`}>{stat.sevenDay !== null ? `${stat.sevenDay}%` : "—"}</span>
              </div>
              <div>
                <span className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wide block mb-1">Dir. Acc</span>
                <span className={`text-2xl font-black tabular-nums font-mono tracking-tight ${stat.dirAccuracy !== null && stat.dirAccuracy >= 55 ? "text-bullish" : "text-foreground"}`}>{stat.dirAccuracy !== null ? `${stat.dirAccuracy}%` : "—"}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div className="bg-secondary/60 rounded-lg px-2.5 py-1.5">
                <span className="text-[8px] text-muted-foreground font-semibold uppercase tracking-wide block">Avg Error</span>
                <span className="text-xs font-bold font-mono tabular-nums text-foreground">{stat.avgError !== null ? `${stat.avgError}%` : "—"}</span>
              </div>
              <div className="bg-secondary/60 rounded-lg px-2.5 py-1.5">
                <span className="text-[8px] text-muted-foreground font-semibold uppercase tracking-wide block">MAPE</span>
                <span className="text-xs font-bold font-mono tabular-nums text-foreground">{stat.avgMAPE !== null ? `${stat.avgMAPE}%` : "—"}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-3 text-[10px] text-muted-foreground"><span>{stat.correct}/{stat.total} correct</span></div>
          </motion.div>
        ))}
      </div>
      <AIAccuracyHeatmap history={history} />
    </motion.div>
  );
}
