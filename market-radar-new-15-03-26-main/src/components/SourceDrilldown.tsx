import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Info } from "lucide-react";

interface SourceDrilldownProps {
  sources?: { polymarket?: number; kalshi?: number; manifold?: number; metaculus?: number };
  variant: string;
}

const PLATFORM_COLORS: Record<string, string> = {
  polymarket: "text-confidence",
  kalshi: "text-bullish",
  manifold: "text-neutral",
  metaculus: "text-bearish",
};

export function SourceDrilldown({ sources, variant }: SourceDrilldownProps) {
  if (!sources) return null;

  const entries = Object.entries(sources).filter(([, v]) => v && v > 0);
  if (entries.length === 0) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="p-0.5 rounded hover:bg-accent transition-colors">
          <Info className="w-3 h-3 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-3" side="top">
        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Platform Breakdown</p>
        <div className="space-y-1.5">
          {entries.map(([name, count]) => (
            <div key={name} className="flex items-center justify-between">
              <span className={`text-[10px] font-bold capitalize ${PLATFORM_COLORS[name] || "text-foreground"}`}>{name}</span>
              <div className="flex items-center gap-1.5">
                <div className="w-16 h-1 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${name === "polymarket" ? "bg-confidence" : name === "kalshi" ? "bg-bullish" : name === "manifold" ? "bg-neutral" : "bg-bearish"}`}
                    style={{ width: `${Math.min(100, (count as number / 50) * 100)}%` }}
                  />
                </div>
                <span className="text-[9px] font-mono text-foreground">{count}</span>
              </div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
