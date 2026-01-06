import { TrendingUp, TrendingDown, Radio } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

interface WhaleMove {
  address: string;
  pnl: number;
  recentAction: string;
  actionSize: number;
  actionSide: "buy" | "sell";
  avatar: string;
}

const whaleMoves: WhaleMove[] = [
  { address: "0xAB...4f92", pnl: 42000, recentAction: "TRUMP YES", actionSize: 15000, actionSide: "buy", avatar: "🐋" },
  { address: "0x7C...e821", pnl: 38500, recentAction: "BTC 100k YES", actionSize: 25000, actionSide: "buy", avatar: "🦈" },
  { address: "0xD4...91ab", pnl: -15200, recentAction: "FED CUT NO", actionSize: 8000, actionSide: "sell", avatar: "🐙" },
  { address: "0x2F...c4d8", pnl: 28900, recentAction: "ETH 5k YES", actionSize: 12000, actionSide: "buy", avatar: "🦑" },
  { address: "0x9E...3f1c", pnl: 21400, recentAction: "SOL 200 YES", actionSize: 18000, actionSide: "buy", avatar: "🐳" },
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
      <div className="flex items-center justify-between border-b border-border px-2 py-1">
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
            className={`px-2 py-1.5 transition-colors hover:bg-secondary/50 ${
              index % 2 === 1 ? "bg-white/[0.02]" : ""
            }`}
          >
            {/* Top Row: Address + PnL */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {/* Pulsing Avatar */}
                <div className="relative">
                  <div
                    className={`flex h-5 w-5 items-center justify-center rounded-sm text-[10px] ${
                      whale.pnl >= 0 ? "bg-accent/20" : "bg-primary/20"
                    }`}
                  >
                    {whale.avatar}
                  </div>
                  <div
                    className={`absolute inset-0 rounded-sm animate-ping opacity-30 ${
                      whale.pnl >= 0 ? "bg-accent/30" : "bg-primary/30"
                    }`}
                    style={{ animationDuration: "2s" }}
                  />
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
            <div className="mt-1 flex items-center gap-1 pl-6">
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
      <div className="border-t border-border px-2 py-1">
        <Link 
          to="/app/whales" 
          className="block w-full font-mono text-[9px] text-primary hover:text-primary/80 transition-colors text-center"
        >
          VIEW ALL WHALE ACTIVITY →
        </Link>
      </div>
    </div>
  );
};
