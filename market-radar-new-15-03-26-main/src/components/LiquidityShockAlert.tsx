import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Zap } from "lucide-react";
import type { LiquidityShock } from "@/hooks/usePredictionMarkets";

interface LiquidityShockAlertProps {
  shocks: LiquidityShock[];
}

export function LiquidityShockAlert({ shocks }: LiquidityShockAlertProps) {
  if (shocks.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="space-y-2"
      >
        {shocks.map((shock, i) => {
          const isBullish = shock.direction === "bullish";
          const isHigh = shock.severity === "high";
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`rounded-xl border px-4 py-3 flex items-center gap-3 ${
                isHigh
                  ? isBullish ? "bg-bullish/8 border-bullish/20" : "bg-bearish/8 border-bearish/20"
                  : "bg-neutral/8 border-neutral/20"
              }`}
            >
              {isHigh ? (
                <AlertTriangle className={`w-4 h-4 shrink-0 ${isBullish ? "text-bullish" : "text-bearish"}`} />
              ) : (
                <Zap className={`w-4 h-4 shrink-0 ${isBullish ? "text-bullish" : "text-bearish"}`} />
              )}
              <div>
                <p className={`text-[11px] font-bold ${isBullish ? "text-bullish" : "text-bearish"}`}>
                  {isHigh ? "⚡ Liquidity Shock Detected" : "Liquidity Event"}
                </p>
                <p className="text-[11px] text-muted-foreground font-medium">
                  {shock.description} — Signal: {isBullish ? "Bullish" : "Bearish"} Liquidity Event
                </p>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </AnimatePresence>
  );
}
