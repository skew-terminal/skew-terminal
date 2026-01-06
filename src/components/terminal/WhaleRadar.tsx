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
      <div className="flex items-center justify-between border-b border-border/50 px-2 py-1">
        <div className="flex items-center gap-1.5">
          <div className="relative">
            <Radio className="h-3.5 w-3.5 text-primary" />
            <div className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 animate-ping rounded-full bg-primary opacity-75" />
            <div className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-primary" />
          </div>
          <span className="font-sans text-[10px] font-bold uppercase tracking-wider text-foreground">
            Whale Radar
          </span>
        </div>
        <span className="font-mono text-[9px] text-muted-foreground">
          24H FLOWS
        </span>
      </div>

      {/* Data */}
      <div className="flex-1 overflow-auto">
        {whaleMoves.map((whale, index) => (
          <div
            key={index}
            className="border-b border-border/30 px-2 py-1.5 transition-colors hover:bg-secondary/50"
          >
            {/* Top Row: Address + PnL */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div
                  className={`flex h-4 w-4 items-center justify-center rounded-sm text-[7px] font-bold ${
                    whale.pnl >= 0 ? "bg-accent/20 text-accent" : "bg-primary/20 text-primary"
                  }`}
                >
                  {index + 1}
                </div>
                <span className="font-mono text-[11px] text-foreground">
                  {whale.address}
                </span>
                <Badge variant="outline" className="border-primary/30 text-primary font-mono text-[7px] px-1 py-0">
                  WHALE
                </Badge>
              </div>
              <div className="flex items-center gap-1">
                <span
                  className={`font-mono text-[11px] font-bold ${
                    whale.pnl >= 0 ? "text-accent" : "text-primary"
                  }`}
                >
                  {formatPnl(whale.pnl)}
                </span>
                {whale.pnl >= 0 ? (
                  <TrendingUp className="h-2.5 w-2.5 text-accent" />
                ) : (
                  <TrendingDown className="h-2.5 w-2.5 text-primary" />
                )}
              </div>
            </div>

            {/* Bottom Row: Recent Action */}
            <div className="mt-1 flex items-center gap-1 pl-5">
              <span className="font-mono text-[9px] text-muted-foreground">
                Just {whale.actionSide === "buy" ? "bought" : "sold"}:
              </span>
              <span
                className={`font-mono text-[9px] font-medium ${
                  whale.actionSide === "buy" ? "text-accent" : "text-primary"
                }`}
              >
                {whale.recentAction}
              </span>
              <span className="font-mono text-[9px] text-muted-foreground">
                ({formatSize(whale.actionSize)})
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="border-t border-border/50 px-2 py-1">
        <a href="/app/whales" className="block w-full font-mono text-[9px] text-primary hover:text-primary/80 transition-colors text-center">
          VIEW ALL WHALE ACTIVITY →
        </a>
      </div>
    </div>
  );
};
