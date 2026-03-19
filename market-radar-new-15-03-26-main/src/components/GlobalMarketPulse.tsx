import { motion } from "framer-motion";
import { Rss } from "lucide-react";
import type { GlobalMarketPulse as PulseData } from "@/hooks/usePredictionMarkets";

const ASSET_COLORS: Record<string, { badge: string; dot: string }> = {
  BTC: { badge: "bg-[hsl(33,90%,50%)]/15 text-[hsl(33,90%,55%)] border-[hsl(33,90%,50%)]/30", dot: "bg-[hsl(33,90%,55%)]" },
  "S&P 500": { badge: "bg-bullish/15 text-bullish border-bullish/30", dot: "bg-bullish" },
  Gold: { badge: "bg-[hsl(45,85%,55%)]/15 text-[hsl(45,85%,60%)] border-[hsl(45,85%,55%)]/30", dot: "bg-[hsl(45,85%,60%)]" },
  Oil: { badge: "bg-bearish/15 text-bearish border-bearish/30", dot: "bg-bearish" },
};

export function GlobalMarketPulse({ data }: { data: PulseData }) {
  // Sort all news by volume (importance), then pick top 1 per unique asset, max 3 lines
  const allNews = [...(data.news || [])].sort((a, b) => ((b as any).volume || 0) - ((a as any).volume || 0));

  const picked: typeof allNews = [];
  const usedAssets = new Set<string>();

  for (const item of allNews) {
    if (picked.length >= 3) break;
    if (usedAssets.has(item.asset)) continue;
    usedAssets.add(item.asset);
    picked.push(item);
  }

  // If we still have < 3, fill with remaining top items (allow duplicate assets)
  for (const item of allNews) {
    if (picked.length >= 3) break;
    if (!picked.includes(item)) picked.push(item);
  }

  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl border border-border p-5">
      <div className="flex items-center gap-2 mb-3">
        <Rss className="h-4 w-4 text-confidence" />
        <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Live Market Feed</h2>
        <span className="ml-auto text-[8px] text-muted-foreground/60 font-mono">sorted by importance</span>
      </div>
      <div className="space-y-2">
        {picked.map((item, i) => {
          const colors = ASSET_COLORS[item.asset] || { badge: "bg-secondary text-foreground border-border", dot: "bg-muted-foreground" };
          return (
            <div key={i} className="flex items-center gap-2.5 bg-secondary/30 rounded-lg px-3 py-2 border border-border/40">
              <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${colors.dot}`} />
              <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border shrink-0 ${colors.badge}`}>{item.asset}</span>
              <span className="text-[11px] text-foreground leading-tight flex-1 truncate">{item.headline}</span>
              <span className="text-[8px] text-muted-foreground shrink-0 font-medium">{item.source}</span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
