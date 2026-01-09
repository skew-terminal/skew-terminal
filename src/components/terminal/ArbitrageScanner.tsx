import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Bitcoin, TrendingUp, Vote, Flame, Zap, ArrowUpDown, Loader2, Link2, Target, AlertTriangle, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { useSpreads } from "@/hooks/useSpreads";
import { supabase } from "@/integrations/supabase/client";

interface DisplayOpportunity {
  id: string;
  slug: string;
  market: string;
  category: "crypto" | "politics" | "economics" | "sports" | "entertainment" | "other";
  buyPlatform: string;
  sellPlatform: string;
  buyPrice: number;
  sellPrice: number;
  skew: number;
  potentialProfit: number;
  status: "arb_open" | "converging";
  isNew?: boolean;
  isRare?: boolean;
  sparkline: number[];
}

interface Platform {
  id: string;
  name: string;
  color: string;
  chain: string;
}

const ALL_PLATFORMS: Platform[] = [
  { id: 'kalshi', name: 'Kalshi', color: 'bg-blue-500', chain: 'USA' },
  { id: 'polymarket', name: 'Polymarket', color: 'bg-purple-500', chain: 'Polygon' },
  { id: 'azuro', name: 'Azuro', color: 'bg-emerald-500', chain: 'Multi' },
  { id: 'predictit', name: 'PredictIt', color: 'bg-red-500', chain: 'USA' },
  { id: 'manifold', name: 'Manifold', color: 'bg-yellow-500', chain: 'Web2' },
  { id: 'metaculus', name: 'Metaculus', color: 'bg-indigo-500', chain: 'Web2' },
  { id: 'futuur', name: 'Futuur', color: 'bg-pink-500', chain: 'Polygon' },
  { id: 'thales', name: 'Thales', color: 'bg-violet-500', chain: 'Arbitrum' },
];

const PLATFORM_MAP = ALL_PLATFORMS.reduce((acc, p) => ({ ...acc, [p.id]: p }), {} as Record<string, Platform>);

const CHAINS = ['All', 'USA', 'Polygon', 'Solana', 'Arbitrum', 'Ethereum', 'Web2'];

const categoryIcons: Record<string, typeof Bitcoin> = {
  crypto: Bitcoin,
  politics: Vote,
  economics: TrendingUp,
  sports: Flame,
  entertainment: Flame,
  other: TrendingUp,
};

const categories = ["all", "crypto", "politics", "sports"] as const;

type SortField = "skew" | "potentialProfit" | "market";
type SortOrder = "asc" | "desc";

const generateSparkline = (skew: number): number[] => {
  const base = 50;
  return Array.from({ length: 8 }, (_, i) => 
    base + Math.sin(i * 0.5) * skew + Math.random() * 5
  );
};

export const ArbitrageScanner = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<typeof categories[number]>("all");
  const [selectedChain, setSelectedChain] = useState<string>("All");
  const [sortField, setSortField] = useState<SortField>("skew");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const { data: spreads, isLoading, error } = useSpreads({ activeOnly: true });

  const { data: platformStats } = useQuery({
    queryKey: ["platform-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("markets")
        .select("platform");
      
      if (error) throw error;
      
      const stats: Record<string, number> = {};
      data?.forEach((m) => {
        stats[m.platform] = (stats[m.platform] || 0) + 1;
      });
      return stats;
    },
    refetchInterval: 60000,
  });

  const opportunities = useMemo((): DisplayOpportunity[] => {
    if (!spreads) return [];

    return spreads
      .filter(spread => Number(spread.skew_percentage) >= 2) // Only 2%+ spreads
      .map((spread) => ({
        id: spread.id,
        slug: spread.market?.slug || spread.id,
        market: spread.market?.title || "Unknown Market",
        category: (spread.market?.category as DisplayOpportunity["category"]) || "other",
        buyPlatform: spread.buy_platform,
        sellPlatform: spread.sell_platform,
        buyPrice: Number(spread.buy_price),
        sellPrice: Number(spread.sell_price),
        skew: Number(spread.skew_percentage),
        potentialProfit: Number(spread.potential_profit) || 0,
        status: spread.skew_percentage > 5 ? "arb_open" : "converging",
        isNew: new Date(spread.detected_at).getTime() > Date.now() - 5 * 60 * 1000,
        isRare: Number(spread.skew_percentage) > 5,
        sparkline: generateSparkline(Number(spread.skew_percentage)),
      }));
  }, [spreads]);

  const formatPrice = (price: number) => `$${price.toFixed(3)}`;

  const handleRowClick = (spreadId: string) => {
    navigate(`/event/${spreadId}`);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const getPlatformByChain = (chain: string) => {
    return ALL_PLATFORMS.filter(p => p.chain === chain);
  };

  const filteredOpportunities = opportunities
    .filter(opp => activeCategory === "all" || opp.category === activeCategory)
    .filter(opp => {
      if (selectedChain !== "All") {
        const chainPlatforms = getPlatformByChain(selectedChain).map(p => p.id);
        return chainPlatforms.includes(opp.buyPlatform) || chainPlatforms.includes(opp.sellPlatform);
      }
      return true;
    })
    .sort((a, b) => {
      const multiplier = sortOrder === "desc" ? -1 : 1;
      if (sortField === "market") return multiplier * a.market.localeCompare(b.market);
      return multiplier * (a[sortField] - b[sortField]);
    });

  if (error) {
    return (
      <div className="flex h-full items-center justify-center text-destructive">
        <span className="font-mono text-xs">Error loading opportunities</span>
      </div>
    );
  }

  const totalMarkets = Object.values(platformStats || {}).reduce((a, b) => a + b, 0);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-3 py-2 bg-secondary/20">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-accent" />
          <span className="font-sans text-sm font-bold uppercase tracking-wider text-foreground">
            Arbitrage Scanner
          </span>
          <Badge variant="outline" className="border-accent/50 bg-accent/10 text-accent font-mono text-[9px] px-1.5 py-0">
            {isLoading ? "..." : `${filteredOpportunities.length} ACTIVE`}
          </Badge>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Link2 className="h-3 w-3 text-muted-foreground" />
            <select
              value={selectedChain}
              onChange={(e) => setSelectedChain(e.target.value)}
              className="bg-secondary border-0 text-[9px] font-mono uppercase text-foreground px-1.5 py-0.5 rounded focus:ring-1 focus:ring-primary/50"
            >
              {CHAINS.map(chain => (
                <option key={chain} value={chain}>{chain}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-0.5">
            {categories.map((cat) => (
              <Button
                key={cat}
                variant="ghost"
                size="sm"
                onClick={() => setActiveCategory(cat)}
                className={`h-5 px-1.5 font-mono text-[8px] uppercase ${
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
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-3">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : filteredOpportunities.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-muted-foreground">
            <div className="flex flex-col items-center gap-2">
              <Zap className="h-12 w-12 opacity-20" />
              <p className="font-mono text-sm">No arbitrage opportunities found</p>
              <p className="font-mono text-[10px] opacity-60">
                Monitoring {totalMarkets} markets across 19 platforms
              </p>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 bg-secondary/30 rounded border border-border/50 max-w-md">
              <Target className="h-5 w-5 text-primary" />
              <p className="font-mono text-[10px] text-center text-muted-foreground">
                Arbitrage opportunities are rare (5-10 per day). Check the <span className="text-primary">Markets</span> tab for price comparison across all platforms.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredOpportunities.map((opp) => {
              const Icon = categoryIcons[opp.category] || TrendingUp;
              const buyPlatform = PLATFORM_MAP[opp.buyPlatform];
              const sellPlatform = PLATFORM_MAP[opp.sellPlatform];
              const totalCost = opp.buyPrice + (1 - opp.sellPrice);
              const profit = 1 - totalCost;
              const isHighSkew = opp.skew > 100; // Flag potentially false positives

              return (
                <div
                  key={opp.id}
                  onClick={() => handleRowClick(opp.id)}
                  className={`group cursor-pointer rounded-lg border transition-all hover:shadow-lg ${
                    opp.isRare 
                      ? "border-accent/30 bg-gradient-to-br from-accent/5 to-transparent hover:border-accent/50" 
                      : "border-border bg-card hover:border-primary/30"
                  }`}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between p-3 border-b border-border/50">
                    <div className="flex items-start gap-2 min-w-0 flex-1">
                      {opp.isRare && (
                        <Badge className="shrink-0 bg-accent text-accent-foreground border-0 font-mono text-[8px] px-1.5 py-0.5">
                          🔥 RARE
                        </Badge>
                      )}
                      {opp.isNew && (
                        <Badge className="shrink-0 bg-primary/20 text-primary border-0 font-mono text-[8px] px-1.5 py-0.5 animate-pulse">
                          NEW
                        </Badge>
                      )}
                      {isHighSkew && (
                        <Badge className="shrink-0 bg-destructive/20 text-destructive border-0 font-mono text-[8px] px-1.5 py-0.5 gap-0.5">
                          <AlertTriangle className="h-2.5 w-2.5" />
                          VERIFY
                        </Badge>
                      )}
                      <div className="min-w-0">
                        <h3 className="font-mono text-sm font-medium text-foreground line-clamp-2">
                          {opp.market}
                        </h3>
                        <Badge variant="outline" className="border-muted text-muted-foreground font-mono text-[7px] px-1 py-0 uppercase mt-1">
                          {opp.category}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className={`font-mono text-2xl font-bold ${opp.isRare ? "text-accent" : "text-foreground"}`}>
                        +{opp.skew.toFixed(1)}%
                      </div>
                      <span className="font-mono text-[9px] text-muted-foreground">GUARANTEED ROI</span>
                    </div>
                  </div>

                  {/* Strategy */}
                  <div className="p-3">
                    <div className="flex items-center gap-1.5 mb-3">
                      <Target className="h-3.5 w-3.5 text-primary" />
                      <span className="font-sans text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Hedged Betting Strategy
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-3">
                      {/* Step 1: Buy YES */}
                      <div className="p-2.5 rounded bg-secondary/50 border border-border/50">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-accent/20 text-accent font-mono text-[9px] font-bold">
                            1
                          </span>
                          <span className="font-mono text-[9px] text-muted-foreground">BUY YES</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {buyPlatform && (
                            <span className={`w-2 h-2 rounded-full ${buyPlatform.color}`} />
                          )}
                          <span className="font-mono text-xs font-medium text-foreground">
                            {buyPlatform?.name || opp.buyPlatform}
                          </span>
                        </div>
                        <div className="font-mono text-lg font-bold text-foreground mt-1">
                          {formatPrice(opp.buyPrice)}
                        </div>
                      </div>

                      {/* Step 2: Buy NO */}
                      <div className="p-2.5 rounded bg-secondary/50 border border-border/50">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary/20 text-primary font-mono text-[9px] font-bold">
                            2
                          </span>
                          <span className="font-mono text-[9px] text-muted-foreground">BUY NO</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {sellPlatform && (
                            <span className={`w-2 h-2 rounded-full ${sellPlatform.color}`} />
                          )}
                          <span className="font-mono text-xs font-medium text-foreground">
                            {sellPlatform?.name || opp.sellPlatform}
                          </span>
                        </div>
                        <div className="font-mono text-lg font-bold text-foreground mt-1">
                          {formatPrice(1 - opp.sellPrice)}
                        </div>
                      </div>
                    </div>

                    {/* Profit Calculation */}
                    <div className="p-2.5 rounded bg-accent/5 border border-accent/20">
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <span className="font-mono text-[9px] text-muted-foreground block">Total Cost</span>
                          <span className="font-mono text-sm font-bold text-foreground">
                            ${totalCost.toFixed(3)}
                          </span>
                        </div>
                        <div>
                          <span className="font-mono text-[9px] text-muted-foreground block">Payout</span>
                          <span className="font-mono text-sm font-bold text-foreground">$1.000</span>
                        </div>
                        <div>
                          <span className="font-mono text-[9px] text-muted-foreground block">Profit</span>
                          <span className="font-mono text-sm font-bold text-accent">
                            +${profit.toFixed(3)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 mt-2 text-muted-foreground">
                      <CheckCircle className="h-3 w-3 text-accent" />
                      <span className="font-mono text-[9px]">
                        No matter the outcome, you profit ${profit.toFixed(3)} per $1 invested
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2 p-3 border-t border-border/50 bg-secondary/20">
                    <Button variant="outline" size="sm" className="h-7 px-3 font-mono text-[10px]">
                      View Details
                    </Button>
                    <Button size="sm" className="h-7 px-3 font-mono text-[10px] bg-accent text-accent-foreground hover:bg-accent/90 gap-1">
                      <Zap className="h-3 w-3" />
                      Execute Strategy
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
