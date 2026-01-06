import { TrendingUp, TrendingDown, Radio } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface WhaleMove {
  address: string;
  pnl: number;
  recentAction: string;
  actionSize: number;
  actionSide: "buy" | "sell";
}

const whaleMoves: WhaleMove[] = [
  { address: "0xAB...4f92", pnl: 42000, recentAction: "TRUMP YES", actionSize: 15000, actionSide: "buy" },
  { address: "0x7C...e821", pnl: 38500, recentAction: "BTC 100k YES", actionSize: 25000, actionSide: "buy" },
  { address: "0xD4...91ab", pnl: -15200, recentAction: "FED CUT NO", actionSize: 8000, actionSide: "sell" },
  { address: "0x2F...c4d8", pnl: 28900, recentAction: "ETH 5k YES", actionSize: 12000, actionSide: "buy" },
  { address: "0x9E...3f1c", pnl: 21400, recentAction: "SOL 200 YES", actionSize: 18000, actionSide: "buy" },
];

export const WhaleRadar = () => {
  const formatPnl = (pnl: number) => {
    const prefix = pnl >= 0 ? "+" : "";
    if (Math.abs(pnl) >= 1000) {
      return `${prefix}$${(pnl / 1000).toFixed(1)}k`;
    }
    return `${prefix}$${pnl}`;
  };

  const formatSize = (size: number) => {
    return `$${(size / 1000).toFixed(0)}k`;
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Radio className="h-4 w-4 text-primary" />
            <div className="absolute -right-0.5 -top-0.5 h-2 w-2 animate-ping rounded-full bg-primary opacity-75" />
            <div className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-primary" />
          </div>
          <span className="font-sans text-xs font-bold uppercase tracking-wider text-foreground">
            Whale Radar
          </span>
        </div>
        <span className="font-mono text-[10px] text-muted-foreground">
          24H FLOWS
        </span>
      </div>

      {/* Data */}
      <div className="flex-1 overflow-auto">
        {whaleMoves.map((whale, index) => (
          <div
            key={index}
            className="border-b border-border px-3 py-2.5 transition-colors hover:bg-secondary/50"
          >
            {/* Top Row: Address + PnL */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-[8px] font-bold ${
                    whale.pnl >= 0 ? "bg-accent/20 text-accent" : "bg-primary/20 text-primary"
                  }`}
                >
                  {index + 1}
                </div>
                <span className="font-mono text-xs text-foreground">
                  {whale.address}
                </span>
                <Badge variant="outline" className="border-primary/30 text-primary font-mono text-[8px] px-1 py-0">
                  WHALE
                </Badge>
              </div>
              <div className="flex items-center gap-1.5">
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

            {/* Bottom Row: Recent Action */}
            <div className="mt-1.5 flex items-center gap-1 pl-7">
              <span className="font-mono text-[10px] text-muted-foreground">
                Just {whale.actionSide === "buy" ? "bought" : "sold"}:
              </span>
              <span
                className={`font-mono text-[10px] font-medium ${
                  whale.actionSide === "buy" ? "text-accent" : "text-primary"
                }`}
              >
                {whale.recentAction}
              </span>
              <span className="font-mono text-[10px] text-muted-foreground">
                ({formatSize(whale.actionSize)})
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="border-t border-border px-3 py-2">
        <button className="w-full font-mono text-[10px] text-primary hover:text-primary/80 transition-colors">
          VIEW ALL WHALE ACTIVITY →
        </button>
      </div>
    </div>
  );
};
