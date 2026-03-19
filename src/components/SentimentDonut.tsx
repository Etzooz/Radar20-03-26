import { motion } from "framer-motion";

interface SentimentDonutProps {
  bullishCount: number;
  bearishCount: number;
  neutralCount: number;
}

export function SentimentDonut({ bullishCount, bearishCount, neutralCount }: SentimentDonutProps) {
  const total = bullishCount + bearishCount + neutralCount || 1;
  const bullishPct = bullishCount / total;
  const bearishPct = bearishCount / total;
  const neutralPct = neutralCount / total;

  const size = 48;
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const segments = [
    { pct: bullishPct, color: "hsl(var(--bullish))", offset: 0 },
    { pct: neutralPct, color: "hsl(var(--neutral))", offset: bullishPct * circumference },
    { pct: bearishPct, color: "hsl(var(--bearish))", offset: (bullishPct + neutralPct) * circumference },
  ];

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {segments.map((seg, i) => (
          <motion.circle
            key={i}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={seg.color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={circumference - seg.pct * circumference}
            style={{ transform: `rotate(${(seg.offset / circumference) * 360}deg)`, transformOrigin: "center" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.15 }}
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[8px] font-bold text-foreground font-mono">{Math.round(bullishPct * 100)}%</span>
      </div>
    </div>
  );
}
