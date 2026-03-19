import { motion } from "framer-motion";

interface FearGreedGaugeProps {
  value: number;
  label: string;
  icon: string;
  prediction?: number;
}

const getLabel = (value: number) => {
  if (value <= 20) return "Extreme Fear";
  if (value <= 40) return "Fear";
  if (value <= 60) return "Neutral";
  if (value <= 80) return "Greed";
  return "Extreme Greed";
};

const getLabelColor = (value: number) => {
  if (value <= 20) return "text-bearish";
  if (value <= 40) return "text-bearish";
  if (value <= 60) return "text-neutral";
  if (value <= 80) return "text-bullish";
  return "text-bullish";
};

export const FearGreedGauge = ({ value, label, icon, prediction }: FearGreedGaugeProps) => {
  const angle = -90 + (value / 100) * 180;

  return (
    <div className="bg-card rounded-lg p-6 border border-border">
      <h3 className="text-foreground font-semibold text-lg mb-4 flex items-center gap-2">
        <span>{icon}</span> {label}
      </h3>
      <div className="flex flex-col items-center">
        <svg viewBox="0 0 200 120" className="w-full max-w-[240px]">
          <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="hsl(var(--muted))" strokeWidth="16" strokeLinecap="round" />
          <defs>
            <linearGradient id={`gauge-grad-${label}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="hsl(var(--bearish))" />
              <stop offset="35%" stopColor="hsl(var(--bearish))" />
              <stop offset="50%" stopColor="hsl(var(--neutral))" />
              <stop offset="65%" stopColor="hsl(var(--bullish))" />
              <stop offset="100%" stopColor="hsl(var(--bullish))" />
            </linearGradient>
          </defs>
          <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke={`url(#gauge-grad-${label})`} strokeWidth="16" strokeLinecap="round" opacity="0.8" />
          <motion.g initial={{ rotate: -90 }} animate={{ rotate: angle }} transition={{ type: "spring", stiffness: 60, damping: 15, delay: 0.3 }} style={{ transformOrigin: "100px 100px" }}>
            <line x1="100" y1="100" x2="100" y2="30" stroke="hsl(var(--foreground))" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="100" cy="100" r="5" fill="hsl(var(--foreground))" />
          </motion.g>
          <text x="18" y="115" fill="hsl(var(--muted-foreground))" fontSize="10" fontFamily="JetBrains Mono">0</text>
          <text x="93" y="18" fill="hsl(var(--muted-foreground))" fontSize="10" fontFamily="JetBrains Mono">50</text>
          <text x="172" y="115" fill="hsl(var(--muted-foreground))" fontSize="10" fontFamily="JetBrains Mono">100</text>
        </svg>
        <motion.div className="text-center -mt-2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <span className="text-4xl font-mono font-bold text-foreground">{value}</span>
          <p className={`text-sm font-semibold mt-1 ${getLabelColor(value)}`}>{getLabel(value)}</p>
          {prediction !== undefined && (
            <p className="text-xs text-muted-foreground mt-1 font-mono">
              Tomorrow prediction: <span className={getLabelColor(prediction)}>{prediction}</span>
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
};
