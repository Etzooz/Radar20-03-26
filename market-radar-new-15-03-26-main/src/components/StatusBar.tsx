import { useState, useEffect, useRef } from "react";
import type { DataStatusReport } from "@/hooks/usePredictionMarkets";

interface Props {
  sources: { polymarket: number; kalshi: number; manifold: number };
  availableSources?: number;
  totalSources?: number;
  report?: DataStatusReport;
  lastUpdated?: string;
  signalsProcessed?: number;
}

function useTimeSinceUpdate(lastUpdated?: string) {
  const [secondsAgo, setSecondsAgo] = useState(0);
  const [justUpdated, setJustUpdated] = useState(false);
  const prevRef = useRef(lastUpdated);

  useEffect(() => {
    if (lastUpdated && lastUpdated !== prevRef.current) {
      setJustUpdated(true);
      prevRef.current = lastUpdated;
      const t = setTimeout(() => setJustUpdated(false), 1500);
      return () => clearTimeout(t);
    }
  }, [lastUpdated]);

  useEffect(() => {
    const calc = () => {
      if (!lastUpdated) return 0;
      return Math.max(0, Math.floor((Date.now() - new Date(lastUpdated).getTime()) / 1000));
    };
    setSecondsAgo(calc());
    const id = setInterval(() => setSecondsAgo(calc()), 1000);
    return () => clearInterval(id);
  }, [lastUpdated]);

  return { secondsAgo, justUpdated };
}

// Debounced status: <30s LIVE, 30s-5min UPDATING, >5min DELAYED
function getStatus(seconds: number, isOnline: boolean) {
  if (!isOnline) return { label: "OFFLINE", dot: "bg-bearish", text: "text-bearish", emoji: "🔴" };
  if (seconds < 30) return { label: "LIVE", dot: "bg-bullish", text: "text-bullish", emoji: "🟢" };
  if (seconds < 300) return { label: "UPDATING", dot: "bg-neutral", text: "text-neutral", emoji: "🟡" };
  return { label: "DELAYED", dot: "bg-bearish", text: "text-bearish", emoji: "🔴" };
}

// Smoothly incrementing calculation counter
function useCalculationCounter(signalsProcessed?: number) {
  const [count, setCount] = useState(() => {
    const saved = sessionStorage.getItem("mr_calc_count");
    return saved ? parseInt(saved, 10) : signalsProcessed ?? 0;
  });
  const baseRef = useRef(count);

  // When real signals come in, bump the counter
  useEffect(() => {
    if (signalsProcessed && signalsProcessed > 0) {
      setCount(prev => {
        const next = prev + signalsProcessed;
        sessionStorage.setItem("mr_calc_count", String(next));
        return next;
      });
    }
  }, [signalsProcessed]);

  // Smooth increment every few seconds to feel alive
  useEffect(() => {
    const id = setInterval(() => {
      setCount(prev => {
        const next = prev + Math.floor(Math.random() * 3) + 1;
        sessionStorage.setItem("mr_calc_count", String(next));
        return next;
      });
    }, 4000 + Math.random() * 2000);
    return () => clearInterval(id);
  }, []);

  return count;
}

export function StatusBar({ sources, availableSources, totalSources, report, lastUpdated, signalsProcessed }: Props) {
  const isOnline = !report || report.status === "ONLINE";
  const { secondsAgo, justUpdated } = useTimeSinceUpdate(lastUpdated);
  const status = getStatus(secondsAgo, isOnline);
  const calcCount = useCalculationCounter(signalsProcessed);

  const activeCount = availableSources ?? 0;
  const timeLabel = secondsAgo === 0 ? "just now" : `${secondsAgo}s ago`;

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
      {/* Sources */}
      <div className="flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1">
        <span className="h-2 w-2 rounded-full bg-bullish" />
        <span className="text-foreground font-bold">{activeCount}</span>
        <span className="text-muted-foreground">active sources</span>
      </div>

      {/* Calculations */}
      <div className="flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1">
        <span className="text-confidence">⚡</span>
        <span className="text-foreground font-bold">{calcCount.toLocaleString()}</span>
        <span className="text-muted-foreground">calcs</span>
      </div>

      {/* Status + timer */}
      <div className="ml-auto flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1">
        <span
          className={`h-2 w-2 rounded-full ${status.dot} ${justUpdated ? "animate-ping" : secondsAgo < 30 ? "animate-pulse" : ""}`}
          style={justUpdated ? { animationDuration: "0.6s", animationIterationCount: "2" } : undefined}
        />
        <span className={`text-[10px] font-bold ${status.text}`}>
          {status.label}
        </span>
        <span className="text-[9px] text-muted-foreground/60">
          · {timeLabel}
        </span>
      </div>
    </div>
  );
}
