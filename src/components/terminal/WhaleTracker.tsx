import { TrendingUp, TrendingDown } from "lucide-react";

const whaleData = [
  { address: "0xAB...4f92", pnl: 42000, change: 12.4 },
  { address: "0x7C...e821", pnl: 38500, change: 8.7 },
  { address: "0xD4...91ab", pnl: -15200, change: -5.2 },
  { address: "0x2F...c4d8", pnl: 28900, change: 15.1 },
  { address: "0x9E...3f1c", pnl: 21400, change: 6.8 },
];

export const WhaleTracker = () => {
  const formatPnl = (pnl: number) => {
    const prefix = pnl >= 0 ? "+" : "";
    if (Math.abs(pnl) >= 1000) {
      return `${prefix}$${(pnl / 1000).toFixed(1)}k`;
    }
    return `${prefix}$${pnl}`;
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <span className="font-sans text-xs font-bold uppercase tracking-wider text-foreground">
          Whale Tracker
        </span>
        <span className="font-mono text-[10px] text-muted-foreground">
          24H PNL
        </span>
      </div>

      {/* Data */}
      <div className="flex-1 overflow-auto">
        {whaleData.map((whale, index) => (
          <div
            key={index}
            className="flex items-center justify-between border-b border-border px-3 py-2 transition-colors hover:bg-secondary/50"
          >
            <div className="flex items-center gap-2">
              <div
                className={`h-5 w-5 rounded-full flex items-center justify-center text-[8px] font-bold ${
                  whale.pnl >= 0 ? "bg-accent/20 text-accent" : "bg-primary/20 text-primary"
                }`}
              >
                {index + 1}
              </div>
              <span className="font-mono text-xs text-foreground">
                {whale.address}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`font-mono text-xs font-bold ${
                  whale.pnl >= 0 ? "text-accent" : "text-primary"
                }`}
              >
                {formatPnl(whale.pnl)}
              </span>
              {whale.pnl >= 0 ? (
                <TrendingUp className="h-3 w-3 text-accent" />
              ) : (
                <TrendingDown className="h-3 w-3 text-primary" />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="border-t border-border px-3 py-2">
        <button className="w-full font-mono text-[10px] text-primary hover:text-primary/80 transition-colors">
          TRACK NEW WALLET →
        </button>
      </div>
    </div>
  );
};
