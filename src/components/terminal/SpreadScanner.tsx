import { useNavigate } from "react-router-dom";
import { Bitcoin, TrendingUp, Vote, Flame, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Opportunity {
  id: string;
  market: string;
  category: "crypto" | "politics" | "economics" | "sports";
  polyPrice: number;
  kalshiPrice: number;
  skew: number;
  volume24h: number;
  status: "arb_open" | "converging";
}

const opportunities: Opportunity[] = [
  { id: "btc-100k-dec", market: "Bitcoin > $100k (Dec)", category: "crypto", polyPrice: 0.62, kalshiPrice: 0.54, skew: 14.8, volume24h: 1240000, status: "arb_open" },
  { id: "trump-2024", market: "Trump Wins 2024", category: "politics", polyPrice: 0.58, kalshiPrice: 0.52, skew: 11.5, volume24h: 3420000, status: "arb_open" },
  { id: "fed-rate-jan", market: "Fed Rate Cut (Jan)", category: "economics", polyPrice: 0.35, kalshiPrice: 0.32, skew: 9.4, volume24h: 890000, status: "arb_open" },
  { id: "eth-5k-q1", market: "ETH > $5k (Q1)", category: "crypto", polyPrice: 0.28, kalshiPrice: 0.25, skew: 12.0, volume24h: 720000, status: "arb_open" },
  { id: "biden-drop", market: "Biden Drops Out", category: "politics", polyPrice: 0.12, kalshiPrice: 0.18, skew: 33.3, volume24h: 1560000, status: "arb_open" },
  { id: "cpi-below-3", market: "CPI Below 3% (Feb)", category: "economics", polyPrice: 0.45, kalshiPrice: 0.42, skew: 7.1, volume24h: 340000, status: "arb_open" },
  { id: "sol-200", market: "SOL > $200 (Q1)", category: "crypto", polyPrice: 0.41, kalshiPrice: 0.38, skew: 7.9, volume24h: 560000, status: "arb_open" },
  { id: "recession-2024", market: "US Recession 2024", category: "economics", polyPrice: 0.22, kalshiPrice: 0.25, skew: 12.0, volume24h: 980000, status: "converging" },
  { id: "house-gop", market: "GOP Wins House", category: "politics", polyPrice: 0.67, kalshiPrice: 0.64, skew: 4.7, volume24h: 1120000, status: "converging" },
  { id: "btc-150k", market: "Bitcoin > $150k (2024)", category: "crypto", polyPrice: 0.15, kalshiPrice: 0.18, skew: 16.7, volume24h: 420000, status: "arb_open" },
];

const categoryIcons = {
  crypto: Bitcoin,
  politics: Vote,
  economics: TrendingUp,
  sports: Flame,
};

export const SpreadScanner = () => {
  const navigate = useNavigate();

  const formatPrice = (price: number) => `$${price.toFixed(2)}`;
  
  const formatVolume = (vol: number) => {
    if (vol >= 1000000) return `$${(vol / 1000000).toFixed(1)}M`;
    if (vol >= 1000) return `$${(vol / 1000).toFixed(0)}k`;
    return `$${vol}`;
  };

  const getVolumeWidth = (vol: number) => {
    const max = Math.max(...opportunities.map(o => o.volume24h));
    return (vol / max) * 100;
  };

  const handleRowClick = (id: string) => {
    navigate(`/event/${id}`);
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/50 px-3 py-1.5">
        <div className="flex items-center gap-2">
          <Zap className="h-3.5 w-3.5 text-primary" />
          <span className="font-sans text-xs font-bold uppercase tracking-wider text-foreground">
            Live Opportunities
          </span>
          <span className="font-mono text-[10px] text-muted-foreground">
            // CROSS-CHAIN
          </span>
        </div>
        <Badge variant="outline" className="border-accent/50 bg-accent/10 text-accent font-mono text-[9px] px-1.5 py-0">
          {opportunities.length} ACTIVE
        </Badge>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] gap-1 border-b border-border/50 bg-secondary/30 px-3 py-1">
        <span className="font-sans text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Market</span>
        <span className="font-sans text-[9px] font-bold uppercase tracking-wider text-muted-foreground text-center">Poly</span>
        <span className="font-sans text-[9px] font-bold uppercase tracking-wider text-muted-foreground text-center">Kalshi</span>
        <span className="font-sans text-[9px] font-bold uppercase tracking-wider text-muted-foreground text-center">Skew %</span>
        <span className="font-sans text-[9px] font-bold uppercase tracking-wider text-muted-foreground text-center">24H Vol</span>
        <span className="font-sans text-[9px] font-bold uppercase tracking-wider text-muted-foreground text-center">Status</span>
      </div>

      {/* Table Body */}
      <div className="flex-1 overflow-auto">
        {opportunities.map((opp) => {
          const Icon = categoryIcons[opp.category];
          const isHighSkew = opp.skew > 5;

          return (
            <div
              key={opp.id}
              onClick={() => handleRowClick(opp.id)}
              className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] gap-1 border-b border-border/30 px-3 py-1.5 cursor-pointer transition-all hover:bg-secondary/60 hover:border-l-2 hover:border-l-primary"
            >
              {/* Market */}
              <div className="flex items-center gap-1.5 min-w-0">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-sm bg-secondary">
                  <Icon className="h-3 w-3 text-muted-foreground" />
                </div>
                <span className="font-mono text-[11px] text-foreground truncate">
                  {opp.market}
                </span>
              </div>

              {/* Poly Price */}
              <div className="flex items-center justify-center">
                <span className="font-mono text-[11px] text-foreground">
                  {formatPrice(opp.polyPrice)}
                </span>
              </div>

              {/* Kalshi Price */}
              <div className="flex items-center justify-center">
                <span className="font-mono text-[11px] text-foreground">
                  {formatPrice(opp.kalshiPrice)}
                </span>
              </div>

              {/* Skew */}
              <div className="flex items-center justify-center">
                <span
                  className={`font-mono text-[11px] font-bold px-1.5 py-0 rounded-sm ${
                    isHighSkew
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  +{opp.skew.toFixed(1)}%
                </span>
              </div>

              {/* Volume */}
              <div className="flex flex-col items-center justify-center gap-0.5">
                <span className="font-mono text-[10px] text-muted-foreground">
                  {formatVolume(opp.volume24h)}
                </span>
                <div className="h-0.5 w-full max-w-[50px] overflow-hidden rounded-sm bg-secondary">
                  <div
                    className="h-full rounded-sm bg-primary/60"
                    style={{ width: `${getVolumeWidth(opp.volume24h)}%` }}
                  />
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center justify-center">
                <Badge
                  variant="outline"
                  className={`font-mono text-[8px] px-1 py-0 ${
                    opp.status === "arb_open"
                      ? "border-accent/50 text-accent"
                      : "border-yellow-500/50 text-yellow-500"
                  }`}
                >
                  {opp.status === "arb_open" ? "ARB OPEN" : "CONVERGING"}
                </Badge>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
