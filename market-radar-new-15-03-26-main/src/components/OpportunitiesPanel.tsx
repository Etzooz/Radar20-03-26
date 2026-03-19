import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap } from "lucide-react";
import type { PredictionData } from "@/hooks/usePredictionMarkets";

const MAX_VISIBLE = 4;
const CYCLE_MIN_MS = 3000;
const CYCLE_MAX_MS = 6000;
const NEW_THRESHOLD_MS = 7000;

interface OpportunityItem {
  id: string;
  event: string;
  asset: string;
  direction: "up" | "down" | "uncertain";
  confidence: number;
  addedAt: number;
}

const SIGNAL_TEMPLATES: { event: string; asset: string; direction: "up" | "down" | "uncertain"; confRange: [number, number] }[] = [
  { event: "Rate cut odds ↑", asset: "S&P 500", direction: "up", confRange: [68, 80] },
  { event: "Inflation surprise ↑", asset: "Gold", direction: "up", confRange: [64, 76] },
  { event: "ETF inflows surge", asset: "BTC", direction: "up", confRange: [70, 82] },
  { event: "Recession odds ↓", asset: "S&P 500", direction: "up", confRange: [60, 74] },
  { event: "Supply disruption risk", asset: "Oil", direction: "up", confRange: [62, 75] },
  { event: "Dollar weakness signal", asset: "Gold", direction: "up", confRange: [66, 78] },
  { event: "Whale accumulation", asset: "BTC", direction: "up", confRange: [58, 72] },
  { event: "OPEC cut uncertainty", asset: "Oil", direction: "uncertain", confRange: [55, 68] },
  { event: "War risk escalation", asset: "Oil", direction: "up", confRange: [64, 76] },
  { event: "Tech earnings miss", asset: "S&P 500", direction: "down", confRange: [60, 72] },
  { event: "Hawkish Fed signal", asset: "BTC", direction: "down", confRange: [62, 74] },
  { event: "CPI uncertainty spike", asset: "S&P 500", direction: "uncertain", confRange: [56, 66] },
  { event: "Mining cost pressure", asset: "Gold", direction: "down", confRange: [55, 65] },
  { event: "Demand forecast ↓", asset: "Oil", direction: "down", confRange: [58, 70] },
  { event: "Halving momentum", asset: "BTC", direction: "up", confRange: [72, 85] },
  { event: "Yield curve inversion", asset: "S&P 500", direction: "down", confRange: [64, 76] },
];

function buildFromData(data: PredictionData): OpportunityItem[] {
  const ASSETS = [
    { key: "btc" as const, label: "BTC" },
    { key: "sp500" as const, label: "S&P 500" },
    { key: "gold" as const, label: "Gold" },
    { key: "oil" as const, label: "Oil" },
  ];

  // Proxy-based fallback insights for assets with weak/missing direct signals
  const PROXY_INSIGHTS: Record<string, { event: string; direction: "up" | "down" }[]> = {
    oil: [
      { event: "Geopolitical risk elevated", direction: "up" },
      { event: "Recession odds rising", direction: "down" },
      { event: "Inflation expectations ↑", direction: "up" },
      { event: "Supply tightening signal", direction: "up" },
      { event: "Demand forecast weakening", direction: "down" },
    ],
    sp500: [
      { event: "Earnings momentum shift", direction: "down" },
      { event: "Rate cut probability rising", direction: "up" },
    ],
    gold: [
      { event: "Dollar weakness detected", direction: "up" },
      { event: "Real yields declining", direction: "up" },
    ],
    btc: [
      { event: "Stablecoin inflows rising", direction: "up" },
      { event: "Halving cycle momentum", direction: "up" },
    ],
  };

  return ASSETS
    .map((a) => {
      const conf = (data.prediction[`${a.key}Confidence` as keyof typeof data.prediction] as number) / 100;
      const mkt = data.marketProbability?.[a.key] ?? conf;
      const edge = conf - mkt;
      const price = data.prices[a.key];
      const hasDirectSignal = Math.abs(edge) > 0.02;

      let direction: "up" | "down" | "uncertain";
      let event: string;

      if (hasDirectSignal) {
        direction = edge > 0.02 ? "up" : "down";
        event = direction === "up"
          ? `Undervalued ~${Math.abs(edge * 100).toFixed(0)}%`
          : `Overvalued ~${Math.abs(edge * 100).toFixed(0)}%`;
      } else {
        // Use proxy/fallback — never show plain "neutral"
        const proxies = PROXY_INSIGHTS[a.key] || PROXY_INSIGHTS.oil;
        const pick = proxies[Math.floor(Math.random() * proxies.length)];
        direction = pick.direction;
        event = pick.event;
      }

      return {
        id: `data-${a.key}-${Date.now()}`,
        event,
        asset: a.label,
        direction,
        confidence: Math.round(conf * 100),
        addedAt: Date.now(),
      } as OpportunityItem;
    });
}

function pickTemplate(usedIds: Set<number>): typeof SIGNAL_TEMPLATES[number] {
  const available = SIGNAL_TEMPLATES.map((t, i) => ({ t, i })).filter(({ i }) => !usedIds.has(i));
  const pool = available.length > 0 ? available : SIGNAL_TEMPLATES.map((t, i) => ({ t, i }));
  const pick = pool[Math.floor(Math.random() * pool.length)];
  usedIds.add(pick.i);
  if (usedIds.size > SIGNAL_TEMPLATES.length - 4) usedIds.clear();
  return pick.t;
}

function templateToItem(tmpl: typeof SIGNAL_TEMPLATES[number]): OpportunityItem {
  const conf = tmpl.confRange[0] + Math.floor(Math.random() * (tmpl.confRange[1] - tmpl.confRange[0]));
  return {
    id: `${Date.now()}-${Math.random()}`,
    event: tmpl.event,
    asset: tmpl.asset,
    direction: tmpl.direction,
    confidence: conf,
    addedAt: Date.now(),
  };
}

const DIR_CONFIG = {
  up: { arrow: "↑", bg: "bg-bullish/8", border: "border-bullish/20", text: "text-bullish" },
  down: { arrow: "↓", bg: "bg-bearish/8", border: "border-bearish/20", text: "text-bearish" },
  uncertain: { arrow: "~", bg: "bg-neutral/8", border: "border-neutral/20", text: "text-neutral" },
};

export function OpportunitiesPanel({ data }: { data: PredictionData }) {
  const usedTemplates = useRef(new Set<number>());
  const [feed, setFeed] = useState<OpportunityItem[]>([]);
  const [now, setNow] = useState(Date.now());

  // Seed from real data + fill with templates
  useEffect(() => {
    const real = buildFromData(data);
    const initial = real.slice(0, 2);
    while (initial.length < MAX_VISIBLE) {
      initial.push(templateToItem(pickTemplate(usedTemplates.current)));
    }
    setFeed(initial);
  }, []);

  // Cycle
  const cycleItem = useCallback(() => {
    const tmpl = pickTemplate(usedTemplates.current);
    const item = templateToItem(tmpl);
    setFeed(prev => [item, ...prev].slice(0, MAX_VISIBLE));
  }, []);

  useEffect(() => {
    const schedule = () => {
      const delay = CYCLE_MIN_MS + Math.random() * (CYCLE_MAX_MS - CYCLE_MIN_MS);
      return setTimeout(() => {
        cycleItem();
        tid.current = schedule();
      }, delay);
    };
    const tid = { current: schedule() };
    return () => clearTimeout(tid.current);
  }, [cycleItem]);

  // Tick
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="bg-muted/30 rounded-xl border border-border/40 p-3 h-full">
      <div className="flex items-center gap-2 mb-2">
        <Zap className="h-3 w-3 text-neutral animate-pulse" />
        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Opportunities</span>
        <span className="ml-auto text-[8px] text-muted-foreground/40 font-mono animate-pulse">streaming</span>
      </div>
      <div className="space-y-1">
        <AnimatePresence mode="popLayout" initial={false}>
          {feed.map((item) => {
            const age = now - item.addedAt;
            const isNew = age < NEW_THRESHOLD_MS;
            const ageLabel = isNew ? "NEW" : `${Math.floor(age / 1000)}s`;
            const dir = DIR_CONFIG[item.direction];

            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: -28, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 16, scale: 0.96, height: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className={`flex items-center gap-2 rounded-md px-2.5 py-1.5 border overflow-hidden ${dir.bg} ${dir.border}`}
              >
                <span className={`text-[8px] font-mono font-bold shrink-0 px-1.5 py-0.5 rounded-full ${
                  isNew ? "bg-foreground/10 text-foreground animate-pulse" : "text-muted-foreground/50"
                }`}>
                  {ageLabel}
                </span>
                <span className="text-[10px] text-foreground/80 truncate flex-1">
                  {item.event} → <span className={`font-bold ${dir.text}`}>{item.asset} {dir.arrow}</span>
                </span>
                <span className="text-[10px] font-mono font-bold text-foreground/60 shrink-0">{item.confidence}%</span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
