import { useState } from "react";
import { TopNavBar } from "@/components/terminal/TopNavBar";
import { IconSidebar } from "@/components/terminal/IconSidebar";
import { SearchModal } from "@/components/terminal/SearchModal";
import { TrendingUp, TrendingDown, ExternalLink, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";

interface Whale {
  address: string;
  pnl: number;
  winRate: number;
  trades: number;
  recentBets: { market: string; side: "yes" | "no"; size: number }[];
}

const whales: Whale[] = [
  { address: "0xAB...4f92", pnl: 142000, winRate: 78.5, trades: 156, recentBets: [{ market: "TRUMP YES", side: "yes", size: 25000 }, { market: "BTC 100k", side: "yes", size: 15000 }] },
  { address: "0x7C...e821", pnl: 98500, winRate: 72.1, trades: 89, recentBets: [{ market: "ETH 5k", side: "yes", size: 30000 }, { market: "FED CUT", side: "no", size: 12000 }] },
  { address: "0x2F...c4d8", pnl: 78900, winRate: 68.9, trades: 234, recentBets: [{ market: "SOL 200", side: "yes", size: 18000 }] },
  { address: "0x9E...3f1c", pnl: 61400, winRate: 65.2, trades: 167, recentBets: [{ market: "CPI <3%", side: "yes", size: 22000 }, { market: "GOP HOUSE", side: "yes", size: 8000 }] },
  { address: "0xD4...91ab", pnl: -45200, winRate: 42.1, trades: 78, recentBets: [{ market: "RECESSION", side: "yes", size: 35000 }] },
  { address: "0x1A...b3c2", pnl: 52300, winRate: 61.8, trades: 112, recentBets: [{ market: "BTC 150k", side: "yes", size: 10000 }] },
  { address: "0x8F...d5e4", pnl: 38100, winRate: 58.4, trades: 198, recentBets: [{ market: "BIDEN DROP", side: "no", size: 5000 }] },
  { address: "0x3C...7f6a", pnl: -28700, winRate: 38.9, trades: 45, recentBets: [{ market: "ETH 10k", side: "yes", size: 40000 }] },
  { address: "0x5D...9e8b", pnl: 29600, winRate: 54.7, trades: 267, recentBets: [{ market: "TRUMP YES", side: "yes", size: 12000 }] },
  { address: "0x6E...a1c3", pnl: 21800, winRate: 52.3, trades: 89, recentBets: [{ market: "FED HIKE", side: "no", size: 8000 }] },
];

const formatPnl = (pnl: number) => {
  const prefix = pnl >= 0 ? "+" : "";
  if (Math.abs(pnl) >= 1000) {
    return `${prefix}$${(pnl / 1000).toFixed(1)}k`;
  }
  return `${prefix}$${pnl}`;
};

const WhalesPage = () => {
  const [searchOpen, setSearchOpen] = useState(false);

  useKeyboardShortcuts({
    onSearchOpen: () => setSearchOpen(true),
    onEscape: () => setSearchOpen(false),
  });

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background">
      <SearchModal open={searchOpen} onOpenChange={setSearchOpen} />
      <TopNavBar />
      
      <div className="flex flex-1 overflow-hidden">
        <IconSidebar />
        
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-3 py-1.5">
            <div className="flex items-center gap-2">
              <span className="font-sans text-xs font-bold uppercase tracking-wider text-foreground">
                Whale Tracker
              </span>
              <span className="font-mono text-[10px] text-muted-foreground">
                // TOP PERFORMERS
              </span>
            </div>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search wallet..."
                className="h-6 w-48 border-border/50 bg-secondary/50 pl-7 font-mono text-[10px] placeholder:text-muted-foreground"
              />
            </div>
          </div>

          {/* Table Header */}
          <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr_2fr] gap-1 border-b border-border bg-secondary/30 px-3 py-1">
            <span className="font-sans text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Wallet</span>
            <span className="font-sans text-[9px] font-bold uppercase tracking-wider text-muted-foreground text-right">PnL (All Time)</span>
            <span className="font-sans text-[9px] font-bold uppercase tracking-wider text-muted-foreground text-right">Win Rate</span>
            <span className="font-sans text-[9px] font-bold uppercase tracking-wider text-muted-foreground text-right">Trades</span>
            <span className="font-sans text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Recent Bets</span>
          </div>

          {/* Table Body */}
          <div className="flex-1 overflow-auto">
            {whales.map((whale, index) => (
              <div
                key={whale.address}
                className={`grid grid-cols-[1.5fr_1fr_1fr_1fr_2fr] gap-1 px-3 py-1.5 transition-all hover:bg-secondary/50 ${
                  index % 2 === 1 ? "bg-white/[0.02]" : ""
                }`}
              >
                {/* Wallet */}
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
                  <ExternalLink className="h-2.5 w-2.5 text-muted-foreground hover:text-foreground cursor-pointer" />
                </div>

                {/* PnL */}
                <div className="flex items-center justify-end gap-1">
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

                {/* Win Rate */}
                <div className="flex items-center justify-end">
                  <span
                    className={`font-mono text-[11px] ${
                      whale.winRate >= 60 ? "text-accent" : whale.winRate >= 50 ? "text-foreground" : "text-primary"
                    }`}
                  >
                    {whale.winRate.toFixed(1)}%
                  </span>
                </div>

                {/* Trades */}
                <div className="flex items-center justify-end">
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {whale.trades}
                  </span>
                </div>

                {/* Recent Bets */}
                <div className="flex items-center gap-1 overflow-hidden">
                  {whale.recentBets.slice(0, 2).map((bet, i) => (
                    <Badge
                      key={i}
                      variant="outline"
                      className={`shrink-0 font-mono text-[8px] px-1 py-0 ${
                        bet.side === "yes" ? "border-accent/40 text-accent" : "border-primary/40 text-primary"
                      }`}
                    >
                      {bet.market} ${(bet.size / 1000).toFixed(0)}k
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhalesPage;
