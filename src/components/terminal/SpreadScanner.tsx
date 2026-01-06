import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bitcoin, TrendingUp, Vote, Flame, Zap, ArrowUpDown, Filter, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Area, AreaChart, ResponsiveContainer } from "recharts";

interface Opportunity {
  id: string;
  market: string;
  category: "crypto" | "politics" | "economics" | "sports";
  polyPrice: number;
  kalshiPrice: number;
  skew: number;
  volume24h: number;
  status: "arb_open" | "converging";
  isNew?: boolean;
  sparkline: number[];
}

const opportunities: Opportunity[] = [
  { id: "btc-100k-dec", market: "Bitcoin > $100k (Dec)", category: "crypto", polyPrice: 0.62, kalshiPrice: 0.54, skew: 14.8, volume24h: 1240000, status: "arb_open", isNew: true, sparkline: [45, 52, 48, 60, 55, 68, 62, 75] },
  { id: "trump-2024", market: "Trump Wins 2024", category: "politics", polyPrice: 0.58, kalshiPrice: 0.52, skew: 11.5, volume24h: 3420000, status: "arb_open", sparkline: [50, 55, 58, 52, 60, 65, 62, 68] },
  { id: "fed-rate-jan", market: "Fed Rate Cut (Jan)", category: "economics", polyPrice: 0.35, kalshiPrice: 0.32, skew: 9.4, volume24h: 890000, status: "arb_open", sparkline: [30, 32, 35, 38, 42, 40, 45, 48] },
  { id: "eth-5k-q1", market: "ETH > $5k (Q1)", category: "crypto", polyPrice: 0.28, kalshiPrice: 0.25, skew: 12.0, volume24h: 720000, status: "arb_open", sparkline: [25, 28, 26, 30, 28, 32, 30, 28] },
  { id: "biden-drop", market: "Biden Drops Out", category: "politics", polyPrice: 0.12, kalshiPrice: 0.18, skew: 33.3, volume24h: 1560000, status: "arb_open", isNew: true, sparkline: [10, 15, 12, 18, 25, 22, 28, 33] },
  { id: "cpi-below-3", market: "CPI Below 3% (Feb)", category: "economics", polyPrice: 0.45, kalshiPrice: 0.42, skew: 7.1, volume24h: 340000, status: "arb_open", sparkline: [42, 44, 43, 45, 46, 44, 45, 45] },
  { id: "sol-200", market: "SOL > $200 (Q1)", category: "crypto", polyPrice: 0.41, kalshiPrice: 0.38, skew: 7.9, volume24h: 560000, status: "arb_open", sparkline: [35, 38, 40, 42, 40, 41, 42, 41] },
  { id: "recession-2024", market: "US Recession 2024", category: "economics", polyPrice: 0.22, kalshiPrice: 0.25, skew: 12.0, volume24h: 980000, status: "converging", sparkline: [28, 26, 24, 25, 23, 24, 22, 22] },
  { id: "house-gop", market: "GOP Wins House", category: "politics", polyPrice: 0.67, kalshiPrice: 0.64, skew: 4.7, volume24h: 1120000, status: "converging", sparkline: [62, 64, 65, 66, 67, 66, 67, 67] },
  { id: "btc-150k", market: "Bitcoin > $150k (2024)", category: "crypto", polyPrice: 0.15, kalshiPrice: 0.18, skew: 16.7, volume24h: 420000, status: "arb_open", sparkline: [12, 14, 13, 15, 16, 15, 17, 18] },
];

const categoryIcons = {
  crypto: Bitcoin,
  politics: Vote,
  economics: TrendingUp,
  sports: Flame,
};

const categories = ["all", "crypto", "politics", "economics", "sports"] as const;

type SortField = "skew" | "volume24h" | "market";
type SortOrder = "asc" | "desc";

export const SpreadScanner = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<typeof categories[number]>("all");
  const [sortField, setSortField] = useState<SortField>("skew");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

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

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const filteredOpportunities = opportunities
    .filter(opp => activeCategory === "all" || opp.category === activeCategory)
    .sort((a, b) => {
      const multiplier = sortOrder === "desc" ? -1 : 1;
      if (sortField === "market") return multiplier * a.market.localeCompare(b.market);
      return multiplier * (a[sortField] - b[sortField]);
    });

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-3 py-1.5">
        <div className="flex items-center gap-2">
          <Zap className="h-3.5 w-3.5 text-primary" />
          <span className="font-sans text-xs font-bold uppercase tracking-wider text-foreground">
            Spread Scanner
          </span>
          <Badge variant="outline" className="border-accent/50 bg-accent/10 text-accent font-mono text-[9px] px-1.5 py-0">
            {filteredOpportunities.length} ACTIVE
          </Badge>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-1">
          {categories.map((cat) => (
            <Button
              key={cat}
              variant="ghost"
              size="sm"
              onClick={() => setActiveCategory(cat)}
              className={`h-6 px-2 font-mono text-[9px] uppercase ${
                activeCategory === cat
                  ? "bg-primary/20 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat}
            </Button>
          ))}
        </div>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-[2fr_0.8fr_1fr_1fr_0.8fr_1fr_0.8fr] gap-1 border-b border-border bg-secondary/30 px-3 py-1">
        <button
          onClick={() => handleSort("market")}
          className="flex items-center gap-1 font-sans text-[9px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
        >
          Market
          <ArrowUpDown className="h-2.5 w-2.5" />
        </button>
        <span className="font-sans text-[9px] font-bold uppercase tracking-wider text-muted-foreground text-center">Chart</span>
        <span className="font-sans text-[9px] font-bold uppercase tracking-wider text-muted-foreground text-center">Poly</span>
        <span className="font-sans text-[9px] font-bold uppercase tracking-wider text-muted-foreground text-center">Kalshi</span>
        <button
          onClick={() => handleSort("skew")}
          className="flex items-center justify-center gap-1 font-sans text-[9px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
        >
          Skew
          <ArrowUpDown className="h-2.5 w-2.5" />
        </button>
        <button
          onClick={() => handleSort("volume24h")}
          className="flex items-center justify-center gap-1 font-sans text-[9px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
        >
          24H Vol
          <ArrowUpDown className="h-2.5 w-2.5" />
        </button>
        <span className="font-sans text-[9px] font-bold uppercase tracking-wider text-muted-foreground text-center">Status</span>
      </div>

      {/* Table Body */}
      <div className="flex-1 overflow-auto">
        {filteredOpportunities.map((opp, index) => {
          const Icon = categoryIcons[opp.category];
          const isHighSkew = opp.skew > 10;

          return (
            <div
              key={opp.id}
              onClick={() => handleRowClick(opp.id)}
              className={`group grid grid-cols-[2fr_0.8fr_1fr_1fr_0.8fr_1fr_0.8fr] gap-1 px-3 py-1.5 cursor-pointer transition-all hover:bg-secondary/60 ${
                index % 2 === 1 ? "bg-white/[0.02]" : ""
              } ${isHighSkew ? "hover:shadow-[inset_0_0_20px_rgba(57,255,20,0.05)]" : ""}`}
            >
              {/* Market */}
              <div className="flex items-center gap-1.5 min-w-0">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-sm bg-secondary">
                  <Icon className="h-3 w-3 text-muted-foreground" />
                </div>
                <span className="font-mono text-[11px] text-foreground truncate">
                  {opp.market}
                </span>
                {opp.isNew && (
                  <Badge className="shrink-0 bg-primary/20 text-primary border-0 font-mono text-[7px] px-1 py-0 animate-pulse">
                    NEW
                  </Badge>
                )}
              </div>

              {/* Sparkline */}
              <div className="flex items-center justify-center">
                <div className="h-5 w-12">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={opp.sparkline.map((v, i) => ({ v }))}>
                      <defs>
                        <linearGradient id={`spark-${opp.id}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Area
                        type="monotone"
                        dataKey="v"
                        stroke="hsl(var(--accent))"
                        strokeWidth={1}
                        fill={`url(#spark-${opp.id})`}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
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
                      : opp.skew > 5
                      ? "bg-accent/20 text-accent"
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
                  {opp.status === "arb_open" ? "ARB" : "CONV"}
                </Badge>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
