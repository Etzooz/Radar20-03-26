import { useState, useEffect, useRef, useMemo } from "react";
import { ChevronUp, ChevronDown, ChevronsUp, ChevronsDown, Minus, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Sparkline } from "@/components/Sparkline";
import { AssetIcon } from "@/components/AssetIcon";
import { ForecastCardSkeleton } from "@/components/ForecastCardSkeleton";
import { isNYSEOpen, getTimeUntilOpen, isMarketHoursAsset } from "@/lib/marketHours";
import { generateAssetSignal, type SignalOutput } from "@/lib/signalEngine";
import type { PredictionData } from "@/hooks/usePredictionMarkets";

const ACCURACY_TIMEFRAMES = ["3H", "6H", "12H", "3D", "7D"];

// --- Signal Stability: Hysteresis + Hold Time ---
type SignalDirection = "STRONG_UP" | "UP" | "NEUTRAL" | "DOWN" | "STRONG_DOWN";

const signalCache = new Map<string, { direction: SignalDirection; timestamp: number }>();
const HOLD_TIME_MS = 120_000; // 2 minutes minimum hold

function classifySignalDirection(move: number, confidence: number): SignalDirection {
  // Hysteresis thresholds
  if (confidence >= 70 && move > 0.1) return "STRONG_UP";
  if (move > 0.05) return "UP";
  if (confidence >= 70 && move < -0.1) return "STRONG_DOWN";
  if (move < -0.05) return "DOWN";
  return "NEUTRAL";
}

function getStableDirection(variant: string, move: number, confidence: number): SignalDirection {
  const newDir = classifySignalDirection(move, confidence);
  const cached = signalCache.get(variant);
  const now = Date.now();

  if (!cached) {
    signalCache.set(variant, { direction: newDir, timestamp: now });
    return newDir;
  }

  // If same direction, update timestamp
  if (cached.direction === newDir) {
    cached.timestamp = now;
    return newDir;
  }

  // Momentum damping: require hold time before flipping
  if (now - cached.timestamp < HOLD_TIME_MS) {
    return cached.direction; // hold previous signal
  }

  // Allow flip after hold time
  signalCache.set(variant, { direction: newDir, timestamp: now });
  return newDir;
}

const DIRECTION_CONFIG = {
  STRONG_UP: { icon: ChevronsUp, color: "text-bullish", mutedColor: "text-bullish/70", border: "border-bullish/20", bg: "bg-bullish/10", barColor: "bullish", colorKey: "bullish" },
  UP: { icon: ChevronUp, color: "text-bullish", mutedColor: "text-bullish/60", border: "border-bullish/15", bg: "bg-bullish/6", barColor: "bullish", colorKey: "bullish" },
  NEUTRAL: { icon: ArrowRight, color: "text-neutral", mutedColor: "text-neutral/60", border: "border-neutral/15", bg: "bg-neutral/6", barColor: "neutral", colorKey: "neutral" },
  DOWN: { icon: ChevronDown, color: "text-bearish", mutedColor: "text-bearish/60", border: "border-bearish/15", bg: "bg-bearish/6", barColor: "bearish", colorKey: "bearish" },
  STRONG_DOWN: { icon: ChevronsDown, color: "text-bearish", mutedColor: "text-bearish/70", border: "border-bearish/20", bg: "bg-bearish/10", barColor: "bearish", colorKey: "bearish" },
};

function AccuracyBoxes({ liveAccuracy, backtestAccuracy }: {
  liveAccuracy?: Record<string, number | "pending" | "insufficient">;
  backtestAccuracy?: number;
}) {
  // Build values from live accuracy or backtest fallback
  const values = ACCURACY_TIMEFRAMES.map(tf => {
    if (liveAccuracy) {
      const val = liveAccuracy[tf];
      if (typeof val === "number") return { tf, pct: Math.round(val * 100), status: "ok" as const };
      if (val === "insufficient") return { tf, pct: null, status: "insufficient" as const };
      return { tf, pct: null, status: "pending" as const };
    }
    return { tf, pct: null, status: "pending" as const };
  });

  const colorClass = (pct: number) =>
    pct >= 60 ? "bg-bullish/20 text-bullish border-bullish/30"
    : pct >= 45 ? "bg-neutral/20 text-neutral border-neutral/30"
    : "bg-bearish/20 text-bearish border-bearish/30";

  return (
    <div className="mb-2">
      <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
        Accuracy by timeframe
      </span>
      <div className="flex gap-1">
        {values.map(({ tf, pct, status }) => (
          <div
            key={tf}
            className={`flex-1 rounded-lg border px-1 py-1 text-center font-mono ${
              status === "ok" && pct !== null
                ? colorClass(pct)
                : "bg-secondary/50 text-muted-foreground/50 border-border/30"
            }`}
          >
            <div className="text-[8px] font-bold opacity-70">{tf}</div>
            <div className="text-[10px] font-black leading-tight">
              {status === "ok" && pct !== null ? `${pct}%` : status === "insufficient" ? "—" : "…"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function useAnimatedNumber(targetValue: number, duration: number = 500) {
  const [displayValue, setDisplayValue] = useState(targetValue);
  const animationRef = useRef<number>();
  const startTimeRef = useRef<number>();
  const startValueRef = useRef(targetValue);

  useEffect(() => {
    startValueRef.current = displayValue;
    startTimeRef.current = performance.now();
    const animate = (currentTime: number) => {
      const elapsed = currentTime - (startTimeRef.current || 0);
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = startValueRef.current + (targetValue - startValueRef.current) * easeProgress;
      setDisplayValue(current);
      if (progress < 1) animationRef.current = requestAnimationFrame(animate);
    };
    animationRef.current = requestAnimationFrame(animate);
    return () => { if (animationRef.current) cancelAnimationFrame(animationRef.current); };
  }, [targetValue, duration]);

  return displayValue;
}

interface ForecastCardProps {
  label: string;
  variant: "btc" | "sp500" | "gold" | "oil";
  expectedMove: number | null;
  confidence: number;
  currentPrice: number | null;
  predictedPrice: number | null;
  liveSources: number;
  sources?: { polymarket?: number; kalshi?: number; manifold?: number; metaculus?: number };
  signalsProcessed?: number;
  drivers?: string[];
  reliability?: "high" | "medium" | "low";
  regime?: string;
  compact?: boolean;
  globalEvent?: any;
  accuracyByTimeframe?: Record<string, number>;
  liveAccuracy?: Record<string, number | "pending" | "insufficient">;
  priceSource?: string;
  marketProbability?: number | null;
  backtestPredictions?: number;
  backtestAccuracy?: number;
  activeSources?: number;
  totalSources?: number;
  isLoading?: boolean;
  predictionData?: PredictionData;
}

const TIMEFRAME_CONFIG: Record<string, { multiplier: number; maxMove: Record<string, number> }> = {
  "1H": { multiplier: 1.0, maxMove: { btc: 1.2, sp500: 0.4, gold: 0.3, oil: 0.5 } },
  "4H": { multiplier: 2.0, maxMove: { btc: 2.2, sp500: 0.9, gold: 0.7, oil: 1.0 } },
  "24H": { multiplier: 4.9, maxMove: { btc: 4.0, sp500: 1.8, gold: 1.5, oil: 2.5 } },
};

function getConfidenceLabel(c: number): string {
  if (c >= 75) return "High";
  if (c >= 55) return "Moderate";
  return "Low";
}

function getOpportunityInsight(edgePercent: number | null, confidence: number): string {
  if (edgePercent === null) return "";
  const abs = Math.abs(edgePercent);
  if (abs < 3) return "Fairly valued by markets";
  const prefix = confidence < 60 ? "Potential " : "";
  const suffix = confidence < 60 ? " — low confidence" : "";
  if (edgePercent > 0) return `${prefix}opportunity (+${abs.toFixed(0)}%)${suffix}`;
  return `${prefix}overvalued (~${abs.toFixed(0)}%)${suffix}`;
}

function getAccuracySummary(
  liveAccuracy?: Record<string, number | "pending" | "insufficient">,
  backtestAccuracy?: number
): number | null {
  if (liveAccuracy) {
    const nums = Object.values(liveAccuracy).filter((v): v is number => typeof v === "number");
    if (nums.length > 0) return Math.round(Math.max(...nums) * 100);
  }
  if (backtestAccuracy && backtestAccuracy > 0) return backtestAccuracy;
  return null;
}

/** Ensure confidence is never 0 or blank */
function safeConfidence(raw: number): number {
  if (!raw || raw <= 0 || !isFinite(raw)) return 52;
  if (raw < 50) return Math.max(50, raw);
  return raw;
}

/** Get signal explanation from engine or fallback */
function getSignalExplanation(signal: SignalOutput | null, variant: string): string {
  // Never return vague phrases like "No clear winner" or "Mixed signals"
  if (signal?.secondary && !["No clear winner", "Mixed signals"].includes(signal.secondary)) {
    return signal.secondary;
  }
  const fallbacks: Record<string, string[]> = {
    btc: ["Buyers and sellers balanced", "Low conviction across signals", "Conflicting on-chain data"],
    sp500: ["Conflicting macro signals", "Earnings vs rate uncertainty", "Low volume indecision"],
    gold: ["USD and yields offsetting", "Risk sentiment unclear", "Central bank flows mixed"],
    oil: ["Supply and demand balanced", "Geopolitical signals conflicting", "OPEC outlook uncertain"],
  };
  const pool = fallbacks[variant] || fallbacks.oil;
  return pool[Math.floor(Date.now() / 60000) % pool.length]; // rotate every 60s not 30s
}

/** Unavailable card */
function UnavailableCard({ label, variant, backtestAccuracy, backtestPredictions }: {
  label: string; variant: string; backtestAccuracy?: number; backtestPredictions?: number;
}) {
  const acc = backtestAccuracy && backtestAccuracy > 0 ? backtestAccuracy : null;
  return (
    <div className="bg-card rounded-xl border border-border p-4 opacity-60 min-h-[200px] flex flex-col">
      <div className="flex items-center gap-2.5 mb-3">
        <AssetIcon variant={variant as any} size={24} />
        <span className="text-foreground font-bold text-sm">{label}</span>
        <span className="text-muted-foreground font-mono text-sm ml-auto">—</span>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center gap-1.5">
        <span className="text-sm text-muted-foreground">Data temporarily unavailable</span>
      </div>
      <div className="mt-auto pt-2 border-t border-border/30 text-[10px] text-muted-foreground font-mono space-y-0.5">
        {acc && <div>Model accuracy: {acc}% ({getConfidenceLabel(acc)})</div>}
        {backtestPredictions && backtestPredictions > 0 && (
          <div>{backtestPredictions.toLocaleString()} past predictions</div>
        )}
      </div>
    </div>
  );
}

export function ForecastCard(props: ForecastCardProps) {
  const {
    label, variant, expectedMove, confidence: rawConfidence, currentPrice,
    sources, liveAccuracy, priceSource, marketProbability,
    backtestPredictions, backtestAccuracy, activeSources, totalSources, isLoading,
    predictionData,
  } = props;

  const confidence = safeConfidence(rawConfidence);
  const isUnavailable = currentPrice === null || currentPrice === undefined || currentPrice <= 0;
  const safePrice = isUnavailable ? 1 : currentPrice;
  const safeMove = expectedMove ?? 0;

  const animatedPrice = useAnimatedNumber(safePrice, 600);
  const animatedConfidence = useAnimatedNumber(confidence, 600);
  const animatedExpectedMove = useAnimatedNumber(safeMove, 600);
  const [timeframe, setTimeframe] = useState("1H");
  const [blinkKey, setBlinkKey] = useState(0);

  // Market hours
  const offMarket = isMarketHoursAsset(variant) && !isNYSEOpen();
  const timeToOpen = offMarket ? getTimeUntilOpen() : null;

  const sparklineData = useMemo(() => {
    return Object.keys(TIMEFRAME_CONFIG).map((tfKey) => {
      const c = TIMEFRAME_CONFIG[tfKey];
      const move = safeMove * c.multiplier;
      const capped = Math.max(-c.maxMove[variant], Math.min(c.maxMove[variant], move));
      return safePrice * (1 + capped / 100);
    });
  }, [safeMove, safePrice, variant]);

  if (isLoading) return <ForecastCardSkeleton />;
  if (isUnavailable) return <UnavailableCard label={label} variant={variant} backtestAccuracy={backtestAccuracy} backtestPredictions={backtestPredictions} />;

  const tf = TIMEFRAME_CONFIG[timeframe];
  const rawScaledMove = animatedExpectedMove * tf.multiplier;
  const maxAllowed = tf.maxMove[variant];
  const adjustedMove = Math.max(-maxAllowed, Math.min(maxAllowed, rawScaledMove));

  const roundedConf = Math.round(animatedConfidence);

  // Signal engine
  const signal: SignalOutput | null = predictionData ? generateAssetSignal(predictionData, variant) : null;

  // Stable direction with hysteresis
  const stableDir = getStableDirection(variant, adjustedMove, roundedConf);
  const dirConfig = DIRECTION_CONFIG[stableDir];
  const simpleDir = stableDir.includes("UP") ? "UP" : stableDir.includes("DOWN") ? "DOWN" : "NEUTRAL";

  // Explanation line — no vague phrases
  const explanation = getSignalExplanation(signal, variant);

  const SignalIcon = dirConfig.icon;
  const formatPrice = (price: number) => price >= 1000
    ? `$${price.toLocaleString("en-US", { maximumFractionDigits: 0 })}`
    : `$${price.toFixed(2)}`;

  // Opportunity (renamed from Edge)
  const oracleProb = animatedConfidence / 100;
  const mktProb = marketProbability ?? null;
  const edgePercent = mktProb !== null ? (oracleProb - mktProb) * 100 : null;
  const opportunityInsight = getOpportunityInsight(edgePercent, roundedConf);

  // Dim tiny moves
  const isTinyMove = Math.abs(adjustedMove) < 0.1;

  const activeSourceCount = activeSources ?? (sources ? Object.values(sources).filter(v => v && v > 0).length : 0);
  const totalSourceCount = totalSources ?? (sources ? Object.keys(sources).length : 0);
  const accuracySummary = getAccuracySummary(liveAccuracy, backtestAccuracy);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`bg-card rounded-xl border ${dirConfig.border} p-4 transition-colors duration-300 hover:border-muted-foreground/20 min-h-[200px] flex flex-col`}
    >
      {/* 1. Asset name + price + arrow */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <AssetIcon variant={variant} size={24} />
          <SignalIcon className={`w-5 h-5 ${dirConfig.color}`} />
          <div className="leading-none">
            <span className="text-foreground font-bold text-sm block">{label}</span>
            {offMarket ? (
              <div>
                <span className="text-base font-black text-foreground/60 tabular-nums font-mono">
                  {formatPrice(animatedPrice)}
                </span>
                <span className="text-[8px] text-muted-foreground block">Last close · Opens in {timeToOpen}</span>
              </div>
            ) : (
              <span className="text-base font-black text-foreground tabular-nums font-mono">
                {formatPrice(animatedPrice)}
              </span>
            )}
          </div>
        </div>
        {/* 2. Mini chart + move */}
        <div className="flex flex-col items-end gap-0.5">
          <Sparkline data={sparklineData} direction={simpleDir} width={56} height={20} />
          <span
            key={blinkKey}
            className={`text-base font-black tabular-nums font-mono ${isTinyMove ? "text-muted-foreground/40" : dirConfig.color} ${blinkKey > 0 ? "animate-[blink-3x_0.15s_ease-in-out_3]" : ""}`}
          >
            {isTinyMove ? "Flat" : `${adjustedMove >= 0 ? "+" : ""}${adjustedMove.toFixed(2)}%`}
          </span>
        </div>
      </div>

      {/* 3. SIGNAL — Arrow + label + predicted price */}
      <div className={`rounded-lg px-3 py-2.5 mb-2 ${dirConfig.bg} flex items-center justify-between`}>
        <div className="flex items-center gap-1.5">
          <SignalIcon className={`w-7 h-7 ${dirConfig.color}`} />
          <span className={`text-sm font-bold uppercase tracking-wide ${dirConfig.mutedColor}`}>
            {label}
          </span>
        </div>
        <div className="text-right">
          <span className="text-[9px] text-muted-foreground font-mono block leading-tight">
            {timeframe} target
          </span>
          <span className={`text-sm font-black tabular-nums font-mono ${dirConfig.color}`}>
            {formatPrice(animatedPrice * (1 + adjustedMove / 100))}
          </span>
        </div>
      </div>

      {/* 4. Confidence bar */}
      <div className="mb-1.5">
        <div className="relative h-1.5 w-full rounded-full overflow-hidden bg-secondary">
          <motion.div
            className="absolute top-0 left-0 h-full rounded-full"
            style={{
              background: `linear-gradient(90deg, hsl(var(--${dirConfig.colorKey}) / 0.6), hsl(var(--${dirConfig.colorKey})))`,
            }}
            initial={{ width: 0 }}
            animate={{ width: `${animatedConfidence}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* 5. Confidence + explanation — single merged line */}
      <p className={`text-xs font-mono ${dirConfig.mutedColor} mb-2 text-center leading-snug`}>
        <span className="font-bold">{roundedConf}% confidence</span>
        <span className="mx-1">—</span>
        <span className="italic">{explanation}</span>
      </p>

      {/* 6. Timeframe pills */}
      <div className="flex gap-1 mb-2">
        {Object.keys(TIMEFRAME_CONFIG).map((tfKey) => (
          <button
            key={tfKey}
            onClick={() => { setTimeframe(tfKey); setBlinkKey(prev => prev + 1); }}
            className={`px-2 py-0.5 rounded text-[9px] font-bold transition-colors ${
              timeframe === tfKey ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tfKey}
          </button>
        ))}
      </div>

      {/* 7. Accuracy by timeframe — always visible */}
      <AccuracyBoxes liveAccuracy={liveAccuracy} backtestAccuracy={backtestAccuracy} />

      {/* 8. Footer — sources */}
      <div className="mt-auto pt-2 border-t border-border/20 space-y-0.5">
        <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-bullish animate-pulse" />
            <span>{activeSourceCount}/{totalSourceCount} sources</span>
          </div>
          {backtestPredictions && backtestPredictions > 0 && (
            <span>{backtestPredictions.toLocaleString()} predictions</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
