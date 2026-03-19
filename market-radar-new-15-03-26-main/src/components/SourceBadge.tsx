interface SourceBadgeProps {
  name: string;
  count: number;
  color?: string;
}

export const SourceBadge = ({ name, count, color = "hsl(var(--primary))" }: SourceBadgeProps) => (
  <div className="flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5 text-sm">
    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
    <span className="text-muted-foreground">{name}</span>
    <span className="font-mono font-semibold text-foreground">{count.toLocaleString()}</span>
  </div>
);
