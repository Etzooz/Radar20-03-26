import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Radio } from "lucide-react";
import type { GlobalMarketPulse as PulseData } from "@/hooks/usePredictionMarkets";

const ASSET_COLORS: Record<string, string> = {
  BTC: "text-[hsl(33,90%,55%)]",
  "S&P 500": "text-bullish",
  Gold: "text-[hsl(45,85%,60%)]",
  Oil: "text-bearish",
};

const MAX_VISIBLE = 3;
const CYCLE_MIN_MS = 2000;
const CYCLE_MAX_MS = 4000;
const NEW_THRESHOLD_MS = 6000;

interface FeedItem {
  id: string;
  asset: string;
  headline: string;
  source: string;
  addedAt: number;
  probability?: number;
  delta?: number;
}

export function LivePredictionFeed({ data }: { data: PulseData }) {
  const allNews = [...(data.news || [])].sort((a, b) => ((b as any).volume || 0) - ((a as any).volume || 0));
  const sourcePool = useRef<typeof allNews>([]);
  const poolIndex = useRef(0);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [now, setNow] = useState(Date.now());

  // Update source pool when data changes
  useEffect(() => {
    if (allNews.length > 0) {
      sourcePool.current = allNews;
      poolIndex.current = 0;
    }
  }, [JSON.stringify(allNews.map(n => n.headline))]);

  // Initialize feed
  useEffect(() => {
    if (sourcePool.current.length === 0) return;
    const initial: FeedItem[] = [];
    for (let i = 0; i < Math.min(MAX_VISIBLE, sourcePool.current.length); i++) {
      const item = sourcePool.current[i];
      initial.push({
        id: `${Date.now()}-${i}`,
        asset: item.asset,
        headline: item.headline,
        source: item.source,
        addedAt: Date.now() - (i * 2000),
        probability: 50 + Math.floor(Math.random() * 40),
        delta: parseFloat((Math.random() * 6 - 3).toFixed(1)),
      });
    }
    poolIndex.current = initial.length;
    setFeed(initial);
  }, [sourcePool.current.length > 0 ? "ready" : "empty"]);

  // Cycle items
  const cycleItem = useCallback(() => {
    if (sourcePool.current.length === 0) return;
    const idx = poolIndex.current % sourcePool.current.length;
    const item = sourcePool.current[idx];
    poolIndex.current = idx + 1;

    const newItem: FeedItem = {
      id: `${Date.now()}-${Math.random()}`,
      asset: item.asset,
      headline: item.headline,
      source: item.source,
      addedAt: Date.now(),
      probability: 50 + Math.floor(Math.random() * 40),
      delta: parseFloat((Math.random() * 6 - 3).toFixed(1)),
    };

    setFeed(prev => [newItem, ...prev].slice(0, MAX_VISIBLE));
  }, []);

  useEffect(() => {
    const schedule = () => {
      const delay = CYCLE_MIN_MS + Math.random() * (CYCLE_MAX_MS - CYCLE_MIN_MS);
      return setTimeout(() => {
        cycleItem();
        timerId.current = schedule();
      }, delay);
    };
    const timerId = { current: schedule() };
    return () => clearTimeout(timerId.current);
  }, [cycleItem]);

  // Tick for "Xs ago" labels
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (feed.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border p-4 h-full flex items-center justify-center">
        <span className="text-xs text-muted-foreground font-mono">Waiting for signals…</span>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border/60 p-4 h-full shadow-lg">
      <div className="flex items-center gap-2 mb-3">
        <Radio className="h-3.5 w-3.5 text-confidence animate-pulse" />
        <span className="text-[10px] font-bold text-foreground/80 uppercase tracking-widest">Live Prediction Feed</span>
        <span className="ml-auto text-[8px] text-muted-foreground/50 font-mono animate-pulse">streaming</span>
      </div>
      <div className="space-y-1.5">
        <AnimatePresence mode="popLayout" initial={false}>
          {feed.map((item) => {
            const color = ASSET_COLORS[item.asset] || "text-muted-foreground";
            const age = now - item.addedAt;
            const isNew = age < NEW_THRESHOLD_MS;
            const ageLabel = isNew ? "NEW" : `${Math.floor(age / 1000)}s ago`;
            const deltaStr = item.delta !== undefined
              ? (item.delta >= 0 ? `+${item.delta}%` : `${item.delta}%`)
              : "";
            const deltaColor = (item.delta ?? 0) >= 0 ? "text-bullish" : "text-bearish";

            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: -32, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95, height: 0, marginBottom: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className="flex items-center gap-2 rounded-lg bg-secondary/40 px-3 py-2 border border-border/30 overflow-hidden"
              >
                <span className={`text-[10px] font-bold font-mono shrink-0 ${color}`}>{item.asset}</span>
                <span className="text-[11px] text-foreground/90 leading-tight flex-1 truncate">{item.headline}</span>
                {item.probability !== undefined && (
                  <span className="text-[10px] font-mono font-bold text-foreground/70 shrink-0">{item.probability}%</span>
                )}
                {deltaStr && (
                  <span className={`text-[9px] font-mono font-bold shrink-0 ${deltaColor}`}>{deltaStr}</span>
                )}
                <span className={`text-[8px] font-mono shrink-0 px-1.5 py-0.5 rounded-full ${
                  isNew
                    ? "bg-bullish/20 text-bullish font-bold animate-pulse"
                    : "text-muted-foreground/50"
                }`}>
                  {ageLabel}
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
