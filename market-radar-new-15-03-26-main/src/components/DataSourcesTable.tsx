import { motion } from "framer-motion";
import { Database, Wifi, WifiOff } from "lucide-react";

interface DataSource {
  type: string;
  provider: string;
  dataPoint: string;
  weight: number;
  status: string;
}

const TYPE_COLORS: Record<string, string> = {
  Prediction: "bg-confidence/15 text-confidence border-confidence/30",
  Sentiment: "bg-bullish/15 text-bullish border-bullish/30",
  "Market Data": "bg-neutral/15 text-neutral border-neutral/30",
  "On-Chain": "bg-[hsl(33,90%,55%)]/15 text-[hsl(33,90%,55%)] border-[hsl(33,90%,55%)]/30",
  Technical: "bg-muted-foreground/15 text-muted-foreground border-muted-foreground/30",
};

export function DataSourcesTable({ sources }: { sources: DataSource[] }) {
  // Only show live/active sources — exclude stale/estimated
  const activeSources = sources.filter(s => s.status === "live");
  if (!activeSources || activeSources.length === 0) return null;

  const liveCount = activeSources.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl border border-border p-5"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-confidence" />
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
            Signal Sources
          </h2>
        </div>
        <span className="text-[9px] font-mono text-muted-foreground">
          {liveCount} active
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-[10px]">
          <thead>
            <tr className="border-b border-border/50">
              <th className="text-left py-1.5 pr-2 text-muted-foreground font-bold uppercase tracking-wider">Type</th>
              <th className="text-left py-1.5 pr-2 text-muted-foreground font-bold uppercase tracking-wider">Provider</th>
              <th className="text-left py-1.5 pr-2 text-muted-foreground font-bold uppercase tracking-wider hidden sm:table-cell">Data Point</th>
              <th className="text-right py-1.5 pr-2 text-muted-foreground font-bold uppercase tracking-wider">Weight</th>
              <th className="text-center py-1.5 text-muted-foreground font-bold uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody>
            {activeSources.map((s, i) => {
              const isLive = s.status === "live";
              const typeColor = TYPE_COLORS[s.type] || TYPE_COLORS.Technical;
              return (
                <tr key={i} className="border-b border-border/20 last:border-0">
                  <td className="py-1.5 pr-2">
                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border ${typeColor}`}>
                      {s.type}
                    </span>
                  </td>
                  <td className="py-1.5 pr-2 font-bold text-foreground font-mono">{s.provider}</td>
                  <td className="py-1.5 pr-2 text-muted-foreground hidden sm:table-cell">{s.dataPoint}</td>
                  <td className="py-1.5 pr-2 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <div className="w-12 h-1 rounded-full bg-secondary overflow-hidden">
                        <div
                          className="h-full rounded-full bg-confidence"
                          style={{ width: `${s.weight * 5}%` }}
                        />
                      </div>
                      <span className="font-mono font-bold text-foreground">{s.weight}%</span>
                    </div>
                  </td>
                  <td className="py-1.5 text-center">
                    {isLive ? (
                      <span className="inline-flex items-center gap-0.5 text-bullish">
                        <Wifi className="w-2.5 h-2.5" />
                        <span className="font-bold">LIVE</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-0.5 text-muted-foreground">
                        <WifiOff className="w-2.5 h-2.5" />
                        <span className="font-bold">EST</span>
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
