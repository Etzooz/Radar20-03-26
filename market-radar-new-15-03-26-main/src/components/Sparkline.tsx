import { motion } from "framer-motion";

interface SparklineProps {
  data: number[];
  direction: "UP" | "DOWN" | "NEUTRAL";
  width?: number;
  height?: number;
}

export function Sparkline({ data, direction, width = 80, height = 24 }: SparklineProps) {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const padding = 2;

  const points = data.map((v, i) => {
    const x = padding + (i / (data.length - 1)) * (width - padding * 2);
    const y = padding + (1 - (v - min) / range) * (height - padding * 2);
    return { x, y };
  });

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${height} L ${points[0].x.toFixed(1)} ${height} Z`;

  const strokeColor = direction === "UP" ? "hsl(var(--bullish))" : direction === "DOWN" ? "hsl(var(--bearish))" : "hsl(var(--neutral))";
  const fillColor = direction === "UP" ? "hsl(142 70% 45% / 0.15)" : direction === "DOWN" ? "hsl(0 72% 55% / 0.15)" : "hsl(45 90% 55% / 0.1)";

  return (
    <svg width={width} height={height} className="overflow-visible">
      <motion.path
        d={areaPath}
        fill={fillColor}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      />
      <motion.path
        d={linePath}
        fill="none"
        stroke={strokeColor}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
      {/* End dot */}
      <motion.circle
        cx={points[points.length - 1].x}
        cy={points[points.length - 1].y}
        r={2}
        fill={strokeColor}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.6 }}
      />
    </svg>
  );
}
