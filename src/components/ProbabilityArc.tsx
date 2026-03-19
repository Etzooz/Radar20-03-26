import { motion } from "framer-motion";

interface ProbabilityArcProps {
  value: number; // 0-100
  direction: "UP" | "DOWN" | "NEUTRAL";
  size?: number;
}

export function ProbabilityArc({ value, direction, size = 80 }: ProbabilityArcProps) {
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  
  // Semi-circle from 180° to 0° (bottom half arc)
  const startAngle = Math.PI;
  const endAngle = 0;
  const sweepAngle = Math.PI * (value / 100);
  
  const bgArcD = describeArc(cx, cy, radius, startAngle, endAngle);
  const fillArcD = describeArc(cx, cy, radius, startAngle, startAngle - sweepAngle);
  
  const colorVar = direction === "UP" ? "var(--bullish)" : direction === "DOWN" ? "var(--bearish)" : "var(--neutral)";
  const glowColor = direction === "UP" ? "142, 70%, 45%" : direction === "DOWN" ? "0, 72%, 55%" : "45, 90%, 55%";

  return (
    <div className="relative flex flex-col items-center" style={{ width: size, height: size / 2 + 8 }}>
      <svg width={size} height={size / 2 + strokeWidth} viewBox={`0 0 ${size} ${size / 2 + strokeWidth}`}>
        <defs>
          <filter id={`glow-${direction}`}>
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <path
          d={bgArcD}
          fill="none"
          stroke="hsl(var(--gauge-bg))"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        <motion.path
          d={fillArcD}
          fill="none"
          stroke={`hsl(${glowColor})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          filter={`url(#glow-${direction})`}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute bottom-0 text-center">
        <span className="text-sm font-black font-mono" style={{ color: `hsl(${glowColor})` }}>
          {value.toFixed(0)}%
        </span>
      </div>
    </div>
  );
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const x1 = cx + r * Math.cos(startAngle);
  const y1 = cy - r * Math.sin(startAngle);
  const x2 = cx + r * Math.cos(endAngle);
  const y2 = cy - r * Math.sin(endAngle);
  const largeArc = Math.abs(startAngle - endAngle) > Math.PI ? 1 : 0;
  // Sweep flag: clockwise for going from left to right on top
  return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
}
