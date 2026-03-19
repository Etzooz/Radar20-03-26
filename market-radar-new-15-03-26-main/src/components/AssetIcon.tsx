interface AssetIconProps {
  variant: "btc" | "sp500" | "gold" | "oil";
  size?: number;
}

const ICONS: Record<string, { svg: JSX.Element; bg: string }> = {
  btc: {
    bg: "bg-[hsl(33,90%,50%)]/15",
    svg: (
      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
        <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" fill="hsl(33,90%,50%)" fillOpacity="0.2" />
        <text x="12" y="16" textAnchor="middle" fill="hsl(33,90%,55%)" fontSize="12" fontWeight="bold" fontFamily="JetBrains Mono, monospace">₿</text>
      </svg>
    ),
  },
  sp500: {
    bg: "bg-bullish/15",
    svg: (
      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
        <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" fill="hsl(142,70%,45%)" fillOpacity="0.2" />
        <path d="M6 16l3-4 3 2 3-5 3 3" stroke="hsl(142,70%,45%)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  gold: {
    bg: "bg-[hsl(45,85%,55%)]/15",
    svg: (
      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
        <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" fill="hsl(45,85%,55%)" fillOpacity="0.2" />
        <text x="12" y="16" textAnchor="middle" fill="hsl(45,85%,60%)" fontSize="9" fontWeight="bold" fontFamily="JetBrains Mono, monospace">Au</text>
      </svg>
    ),
  },
  oil: {
    bg: "bg-bearish/15",
    svg: (
      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
        <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" fill="hsl(0,72%,55%)" fillOpacity="0.15" />
        <path d="M12 6c-2 3-5 5-5 8a5 5 0 0 0 10 0c0-3-3-5-5-8z" fill="hsl(0,72%,55%)" fillOpacity="0.4" stroke="hsl(0,72%,55%)" strokeWidth="0.5" />
      </svg>
    ),
  },
};

export function AssetIcon({ variant, size = 28 }: AssetIconProps) {
  const icon = ICONS[variant];
  return (
    <div className={`rounded-full flex items-center justify-center ${icon.bg}`} style={{ width: size, height: size }}>
      <div style={{ width: size, height: size }}>{icon.svg}</div>
    </div>
  );
}
