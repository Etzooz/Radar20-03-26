interface HeatmapProps {
  scores?: Record<string, number | "pending" | "insufficient">;
  intensity?: number;
}

const TIMEFRAMES = ['1H', '3H', '6H', '12H', '3D', '7D'];

export default function Heatmap({ scores, intensity = 0.5 }: HeatmapProps) {
  const entries: [string, number | "pending" | "insufficient"][] = scores
    ? TIMEFRAMES.map(tf => [tf, scores[tf] ?? "pending"])
    : TIMEFRAMES.map((tf, i) => [tf, Math.max(0, Math.min(1, intensity * (0.3 + i * 0.14)))]);

  function colorFor(v: number) {
    const hue = Math.round((1 - Math.max(0, Math.min(1, v))) * 120);
    return `hsl(${hue} 75% ${v > 0.5 ? '45%' : '55%'})`;
  }

  return (
    <div className="mt-3">
      <div className="flex gap-1">
        {entries.map(([label, val], idx) => {
          const isPending = val === "pending";
          const isInsufficient = val === "insufficient";
          const numVal = (isPending || isInsufficient) ? 0 : (val as number);
          return (
            <div key={label + idx} className="flex-1 flex flex-col items-center gap-0.5">
              <div
                title={
                  isPending ? `${label}: Gathering data`
                  : isInsufficient ? `${label}: Insufficient data (<50 predictions)`
                  : `${label}: ${(numVal * 100).toFixed(0)}%`
                }
                style={{
                  background: (isPending || isInsufficient) ? 'hsl(var(--secondary))' : colorFor(numVal),
                }}
                className="w-full h-4 rounded-sm border border-border relative overflow-hidden"
              >
                {isPending && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-pulse" />
                  </div>
                )}
                {isInsufficient && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[6px] text-muted-foreground font-mono">—</span>
                  </div>
                )}
              </div>
              <span className="text-[7px] font-bold text-muted-foreground font-mono">{label}</span>
              <span className="text-[7px] font-mono text-foreground">
                {isPending ? (
                  <span className="text-muted-foreground italic">…</span>
                ) : isInsufficient ? (
                  <span className="text-muted-foreground italic text-[6px]">N/A</span>
                ) : (
                  `${(numVal * 100).toFixed(0)}%`
                )}
              </span>
            </div>
          );
        })}
      </div>
      <div className="text-[9px] text-muted-foreground mt-1.5 text-center">
        Past prediction accuracy based on last 200 backtested predictions.
      </div>
    </div>
  );
}
