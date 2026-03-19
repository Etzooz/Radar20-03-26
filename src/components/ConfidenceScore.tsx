import { motion } from "framer-motion";
import { ShieldCheck, Droplets, Activity, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ConfidenceScoreProps {
  scores: { btc: number; sp500: number; gold: number };
  confidences: { btc: number; sp500: number; gold: number };
  volatility: number;
  volumeTrend: number;
}

const assets = [
  { key: "btc" as const, label: "Bitcoin", emoji: "₿" },
  { key: "sp500" as const, label: "S&P 500", emoji: "📈" },
  { key: "gold" as const, label: "Gold", emoji: "🥇" },
];

function getLiquidityLevel(volumeTrend: number) {
  if (volumeTrend >= 70) return { label: "High", bonus: 5 };
  if (volumeTrend >= 40) return { label: "Medium", bonus: 2 };
  return { label: "Low", bonus: 0 };
}

function getVolatilityLevel(volatility: number) {
  if (volatility >= 70) return { label: "High", penalty: 2 };
  if (volatility >= 40) return { label: "Medium", penalty: 1 };
  return { label: "Low", penalty: 0 };
}

function getConfidenceColor(score: number) {
  if (score >= 65) return "text-bullish";
  if (score >= 45) return "text-neutral";
  return "text-bearish";
}

function getBarColor(score: number) {
  if (score >= 65) return "bg-bullish";
  if (score >= 45) return "bg-neutral";
  return "bg-bearish";
}

export function ConfidenceScore({ scores, confidences, volatility, volumeTrend }: ConfidenceScoreProps) {
  const liquidity = getLiquidityLevel(volumeTrend);
  const vol = getVolatilityLevel(volatility);

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-muted-foreground" strokeWidth={2} />
          <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Prediction Confidence Score</h3>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-secondary">
                <Info className="w-3.5 h-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-xs text-xs leading-relaxed">
              <p className="font-semibold mb-1">How it's calculated</p>
              <p>Final Score = Base Probability + Liquidity Factor − Volatility Penalty</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {assets.map((asset, ai) => {
          const baseProbability = scores[asset.key];
          const finalScore = Math.min(100, Math.max(0, baseProbability + liquidity.bonus - vol.penalty));
          const assetConfidence = confidences[asset.key];

          const factors = [
            { label: "Base Prob.", value: `${baseProbability}%`, modifier: null as null | "positive" | "negative", icon: ShieldCheck },
            { label: "Liquidity", value: `+${liquidity.bonus}%`, modifier: "positive" as const, icon: Droplets },
            { label: "Volatility", value: `-${vol.penalty}%`, modifier: "negative" as const, icon: Activity },
          ];

          return (
            <motion.div key={asset.key} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, delay: 0.1 * ai }} className="bg-card rounded-2xl border border-border p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-base">{asset.emoji}</span>
                  <span className="text-xs font-bold text-foreground">{asset.label}</span>
                </div>
                <span className="text-[10px] text-muted-foreground font-medium font-mono">conf: {assetConfidence}%</span>
              </div>
              <div className="flex flex-col items-center mb-4">
                <motion.span initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.6, delay: 0.2 + ai * 0.1 }} className={`text-4xl font-black tabular-nums font-mono tracking-tight ${getConfidenceColor(finalScore)}`}>{finalScore}%</motion.span>
                <span className="text-[10px] text-muted-foreground font-medium mt-1">Final Confidence</span>
                <div className="w-full mt-3 h-2 bg-secondary rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${finalScore}%` }} transition={{ duration: 1, delay: 0.3 + ai * 0.1, ease: "easeOut" }} className={`h-full rounded-full ${getBarColor(finalScore)}`} />
                </div>
              </div>
              <div className="space-y-2">
                {factors.map((factor) => {
                  const FIcon = factor.icon;
                  return (
                    <div key={factor.label} className="flex items-center justify-between bg-secondary/60 rounded-lg px-3 py-2 border border-border/50">
                      <div className="flex items-center gap-2">
                        <FIcon className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-[10px] font-semibold text-foreground">{factor.label}</span>
                      </div>
                      <span className={`text-xs font-bold font-mono tabular-nums ${factor.modifier === "positive" ? "text-bullish" : factor.modifier === "negative" ? "text-bearish" : "text-foreground"}`}>{factor.value}</span>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-center gap-1.5 pt-3 text-[9px] text-muted-foreground font-mono tabular-nums">
                <span>{baseProbability}%</span>
                <span className="text-bullish">+{liquidity.bonus}%</span>
                <span className="text-bearish">−{vol.penalty}%</span>
                <span className="text-foreground font-bold">= {finalScore}%</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
