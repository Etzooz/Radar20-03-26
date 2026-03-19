import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { devLogger } from "@/lib/devLogger";

export interface LiquidityShock {
  description: string;
  direction: "bullish" | "bearish";
  severity: "high" | "medium" | "low";
}

export interface MarketNews {
  asset: string;
  headline: string;
  source: string;
}

export interface GlobalMarketPulse {
  score: number;
  environment: string;
  regime: string;
  drivers: string[];
  news: MarketNews[];
  divergencePenalty?: number;
}

export interface AccuracyHistoryItem {
  date: string;
  btcAccuracy: number | null;
  sp500Accuracy: number | null;
  goldAccuracy: number | null;
  btcError: number | null;
  sp500Error: number | null;
  goldError: number | null;
  btcMAPE: number | null;
  sp500MAPE: number | null;
  goldMAPE: number | null;
  btcDirCorrect: boolean | null;
  sp500DirCorrect: boolean | null;
  goldDirCorrect: boolean | null;
}

export interface DataQuality {
  totalSources: number;
  availableSources: number;
  staleWarning: boolean;
  missingSignals: string[];
}

export interface DataStatusReport {
  status: 'ONLINE' | 'OFFLINE';
  message: string;
  indicatorsActive: boolean;
  tradingSignalsEnabled: boolean;
  failedSources: string[];
  lastOnline: string | null;
  logs: string[];
}

export interface TechnicalIndicators {
  rsi: number;
  smaShort: number;
  smaLong: number;
  smaCrossover: boolean;
  bollingerUpper: number;
  bollingerLower: number;
  trendConfirm: boolean;
}

export type AccuracyByTimeframe = Record<string, number | "pending" | "insufficient">;

export interface AssetPriceData {
  current: number | null;
  predicted: number | null;
  move: number | null;
  source: string;
}

export interface PredictionData {
  apiVersion: string;
  modelVersion: string;
  prediction: {
    sp500: { value: number; label: string; direction: string };
    btc: { value: number; label: string; direction: string };
    gold: { value: number; label: string; direction: string };
    oil: { value: number; label: string; direction: string };
    confidence: number;
    btcConfidence: number;
    sp500Confidence: number;
    goldConfidence: number;
    oilConfidence: number;
    signalsUsed: number;
  };
  prices: {
    btc: AssetPriceData;
    sp500: AssetPriceData;
    gold: AssetPriceData;
    oil: AssetPriceData;
  };
  sources: { polymarket: number; kalshi: number; manifold: number };
  regime: string;
  volatility: number;
  volumeTrend: number;
  marketScore: { btc: number; sp500: number; gold: number; oil: number };
  maxMoves: Record<string, Record<string, number>>;
  accuracyByTimeframe: Record<string, Record<string, number>>;
  technicalIndicators: Record<string, TechnicalIndicators>;
  supplementaryData: {
    stablecoinFlows: { totalMcap: number; change24h: number; source: string };
    onChainVolume: { btcTxVolume: number; source: string };
  };
  globalMarketPulse: GlobalMarketPulse;
  dataQuality: DataQuality;
  marketProbability: Record<string, number | null>;
  assetSources: Record<string, Record<string, string>>;
  liquidityShocks: LiquidityShock[];
  accuracyHistory: AccuracyHistoryItem[];
  signalsProcessedCount: number;
  backtestStats: Record<string, { predictions: number; accuracy: number }>;
  dataSources?: { type: string; provider: string; dataPoint: string; weight: number; status: string }[];
  lastUpdated: string;
  liveAccuracy?: Record<string, AccuracyByTimeframe>;
  dataStatusReport?: DataStatusReport;
}

const CACHE_KEY = "mr_market_data_cache";
const CACHE_MAX_AGE_MS = 5 * 60 * 1000;
const POLL_INTERVAL_MS = 90 * 1000;
const MAX_RETRIES = 2;
const RETRY_BASE_DELAY_MS = 2000;

/** Returns true if price is a valid, positive number */
function isValidPrice(price: unknown): price is number {
  return typeof price === "number" && isFinite(price) && price > 0;
}

/** Sanitize per-asset price data: replace invalid prices with null */
function sanitizePrices(prices: any): PredictionData["prices"] {
  const ASSETS = ["btc", "sp500", "gold", "oil"] as const;
  const sanitized = {} as any;
  for (const key of ASSETS) {
    const raw = prices?.[key];
    if (raw && isValidPrice(raw.current)) {
      sanitized[key] = {
        current: raw.current,
        predicted: isValidPrice(raw.predicted) ? raw.predicted : null,
        move: typeof raw.move === "number" && isFinite(raw.move) ? raw.move : null,
        source: raw.source || "unknown",
      };
    } else {
      console.warn(`[data-sanitize] ${key.toUpperCase()} price invalid or missing:`, raw?.current);
      sanitized[key] = { current: null, predicted: null, move: null, source: raw?.source || "unavailable" };
    }
  }
  return sanitized;
}

function isDataValid(d: any): boolean {
  if (!d || !d.prices || !d.prediction) return false;
  const hasAny = ["btc", "sp500", "gold", "oil"].some(
    (k) => d.prices[k] && isValidPrice(d.prices[k].current)
  );
  return hasAny;
}

/** Load cached data from sessionStorage */
function loadCache(): PredictionData | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    // Accept cache up to 10 minutes old for instant hydration
    if (Date.now() - ts > 10 * 60 * 1000) return null;
    return data as PredictionData;
  } catch { return null; }
}

function saveCache(data: PredictionData) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
  } catch { /* quota exceeded — ignore */ }
}

export function usePredictionMarkets() {
  const cached = loadCache();
  const [data, setData] = useState<PredictionData | null>(cached);
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState<string | null>(null);
  const [isStale, setIsStale] = useState(false);
  const lastFetchTimeRef = useRef<number>(cached ? Date.now() - 30000 : 0);
  const isFetchingRef = useRef(false);

  const fetchWithRetry = useCallback(async (retries = MAX_RETRIES): Promise<void> => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setLoading(true);
    setError(null);
    devLogger.log("info", "Fetching market data...");

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const [marketResult, accuracyResult] = await Promise.all([
          supabase.functions.invoke('market-data'),
          supabase.functions.invoke('oracle-accuracy'),
        ]);

        if (marketResult.error) throw marketResult.error;

        const marketData = marketResult.data as any;

        if (!isDataValid(marketData)) {
          devLogger.log("error", "Invalid market data received", { prices: marketData?.prices });
          throw new Error("Received invalid market data (no valid asset prices)");
        }

        marketData.prices = sanitizePrices(marketData.prices);

        // Attach live accuracy
        if (accuracyResult.data && !accuracyResult.error) {
          const accData = accuracyResult.data;
          marketData.liveAccuracy = accData.accuracy ?? accData;
        }

        // Count real predictions
        const { count } = await supabase
          .from('oracle_snapshots')
          .select('*', { count: 'exact', head: true });

        if (count !== null && count > 0) {
          const assetMap: Record<string, string> = { btc: 'BTC', sp500: 'SPX', gold: 'XAU', oil: 'OIL' };
          for (const [frontKey, dbKey] of Object.entries(assetMap)) {
            const { count: assetCount } = await supabase
              .from('oracle_snapshots')
              .select('*', { count: 'exact', head: true })
              .eq('asset', dbKey);
            if (assetCount !== null && marketData.backtestStats?.[frontKey]) {
              marketData.backtestStats[frontKey].predictions = assetCount;
            }
          }
        }

        // Log per-asset validity
        for (const k of ["btc", "sp500", "gold", "oil"] as const) {
          const p = marketData.prices[k];
          if (!p || p.current === null) {
            devLogger.log("warn", `${k.toUpperCase()} price invalid or missing`, p);
          }
        }

        const finalData = marketData as PredictionData;
        setData(finalData);
        saveCache(finalData);
        setIsStale(false);
        setError(null);
        lastFetchTimeRef.current = Date.now();
        devLogger.log("info", "Market data updated successfully");

        // Fire-and-forget snapshot
        supabase.functions.invoke('oracle-snapshot').catch(() => {});
        break;
      } catch (e: any) {
        devLogger.log("error", `Fetch attempt ${attempt + 1} failed`, { message: e.message });
        if (attempt < retries) {
          await new Promise((r) => setTimeout(r, RETRY_BASE_DELAY_MS * Math.pow(2, attempt)));
        } else {
          setError(e.message || 'Failed to fetch market data');
        }
      }
    }

    setLoading(false);
    isFetchingRef.current = false;
  }, []);

  const checkAndRefresh = useCallback(() => {
    const age = Date.now() - lastFetchTimeRef.current;
    if (age > CACHE_MAX_AGE_MS) {
      setIsStale(true);
      fetchWithRetry();
    }
  }, [fetchWithRetry]);

  useEffect(() => { fetchWithRetry(); }, [fetchWithRetry]);

  useEffect(() => {
    const interval = setInterval(() => { fetchWithRetry(); }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchWithRetry]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") checkAndRefresh();
    };
    const handleFocus = () => checkAndRefresh();
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", handleFocus);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleFocus);
    };
  }, [checkAndRefresh]);

  return { data, loading, error, isStale, refresh: fetchWithRetry };
}
