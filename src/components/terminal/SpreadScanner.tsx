import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Bitcoin, TrendingUp, Vote, Flame, Zap, ArrowUpDown, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { useSpreads, Spread } from "@/hooks/useSpreads";
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
  sparkline: number[];
}

const categoryIcons: Record<string, typeof Bitcoin> = {
  crypto: Bitcoin,
  politics: Vote,
  economics: TrendingUp,
  sports: Flame,
  entertainment: Flame,
  other: TrendingUp,
};

const categories = ["all", "crypto", "politics", "economics", "sports"] as const;

const PLATFORMS = [
  "all",
  "kalshi",
  "polymarket",
  "azuro",
  "pancakeswap",
  "opinions",
  "probable",
  "divvybet"
] as const;

const PLATFORM_COLORS: Record<string, string> = {
  kalshi: "bg-blue-500",
  polymarket: "bg-purple-500",
  azuro: "bg-green-500",
  pancakeswap: "bg-yellow-500",
  opinions: "bg-pink-500",
  probable: "bg-indigo-500",
  divvybet: "bg-orange-500",
};

type SortField = "skew" | "potentialProfit" | "market";
type SortOrder = "asc" | "desc";

// Generate fake sparkline for now (until we have historical data)
const generateSparkline = (skew: number): number[] => {
  const base = 50;
  return Array.from({ length: 8 }, (_, i) => 
    base + Math.sin(i * 0.5) * skew + Math.random() * 5
  );
};

export const SpreadScanner = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<typeof categories[number]>("all");
  const [selectedPlatform, setSelectedPlatform] = useState<typeof PLATFORMS[number]>("all");
  const [sortField, setSortField] = useState<SortField>("skew");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const { data: spreads, isLoading, error } = useSpreads({ activeOnly: true });

  // Fetch platform stats
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

  // Transform spreads to display format
  const opportunities = useMemo((): DisplayOpportunity[] => {
    if (!spreads) return [];

    return spreads.map((spread) => ({
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
      isNew: new Date(spread.detected_at).getTime() > Date.now() - 5 * 60 * 1000, // Last 5 min
      sparkline: generateSparkline(Number(spread.skew_percentage)),
    }));
  }, [spreads]);

  const formatPrice = (price: number) => `$${price.toFixed(2)}`;
  
  const formatProfit = (profit: number) => {
    if (profit >= 1000) return `$${(profit / 1000).toFixed(1)}k`;
    return `$${profit.toFixed(0)}`;
  };

  const getProfitWidth = (profit: number) => {
    const max = Math.max(...opportunities.map(o => o.potentialProfit), 1);
    return (profit / max) * 100;
  };

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

  const filteredOpportunities = opportunities
    .filter(opp => activeCategory === "all" || opp.category === activeCategory)
    .filter(opp => 
      selectedPlatform === "all" || 
      opp.buyPlatform === selectedPlatform || 
      opp.sellPlatform === selectedPlatform
    )
    .sort((a, b) => {
      const multiplier = sortOrder === "desc" ? -1 : 1;
      if (sortField === "market") return multiplier * a.market.localeCompare(b.market);
      return multiplier * (a[sortField] - b[sortField]);
    });

  if (error) {
    return (
      <div className="flex h-full items-center justify-center text-destructive">
        <span className="font-mono text-xs">Error loading spreads</span>
      </div>
    );
  }

  const totalMarkets = Object.values(platformStats || {}).reduce((a, b) => a + b, 0);

  return (
    <div className="flex h-full flex-col">
      {/* Platform Stats Header */}
      {platformStats && Object.keys(platformStats).length > 0 && (
        <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-1 px-3 py-2 border-b border-border bg-secondary/20">
          <div className="bg-secondary/50 p-1.5 rounded text-center">
            <div className="text-sm font-bold text-foreground font-mono">{totalMarkets}</div>
            <div className="text-[8px] text-muted-foreground uppercase">Total</div>
          </div>
          {Object.entries(platformStats).map(([platform, count]) => (
            <div 
              key={platform} 
              className="bg-secondary/50 p-1.5 rounded text-center cursor-pointer hover:bg-secondary/80 transition-colors"
              onClick={() => setSelectedPlatform(platform as typeof PLATFORMS[number])}
            >
              <div className="text-sm font-bold text-foreground font-mono">{count}</div>
              <div className="text-[8px] text-muted-foreground uppercase truncate">{platform}</div>
            </div>
          ))}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-3 py-1.5">
        <div className="flex items-center gap-2">
          <Zap className="h-3.5 w-3.5 text-primary" />
          <span className="font-sans text-xs font-bold uppercase tracking-wider text-foreground">
            Spread Scanner
          </span>
          <Badge variant="outline" className="border-accent/50 bg-accent/10 text-accent font-mono text-[9px] px-1.5 py-0">
            {isLoading ? "..." : `${filteredOpportunities.length} ACTIVE`}
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

      {/* Platform Filters */}
      <div className="flex gap-1.5 px-3 py-2 border-b border-border flex-wrap">
        {PLATFORMS.map(platform => (
          <button
            key={platform}
            onClick={() => setSelectedPlatform(platform)}
            className={`px-2 py-0.5 rounded text-[9px] font-mono uppercase transition-colors ${
              selectedPlatform === platform 
                ? "bg-accent text-accent-foreground" 
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            {platform}
            {platform !== "all" && PLATFORM_COLORS[platform] && (
              <span className={`inline-block w-1.5 h-1.5 rounded-full ml-1 ${PLATFORM_COLORS[platform]}`} />
            )}
          </button>
        ))}
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
        <span className="font-sans text-[9px] font-bold uppercase tracking-wider text-muted-foreground text-center">Buy</span>
        <span className="font-sans text-[9px] font-bold uppercase tracking-wider text-muted-foreground text-center">Sell</span>
        <button
          onClick={() => handleSort("skew")}
          className="flex items-center justify-center gap-1 font-sans text-[9px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
        >
          Skew
          <ArrowUpDown className="h-2.5 w-2.5" />
        </button>
        <button
          onClick={() => handleSort("potentialProfit")}
          className="flex items-center justify-center gap-1 font-sans text-[9px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
        >
          Profit
          <ArrowUpDown className="h-2.5 w-2.5" />
        </button>
        <span className="font-sans text-[9px] font-bold uppercase tracking-wider text-muted-foreground text-center">Status</span>
      </div>

      {/* Table Body */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : filteredOpportunities.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <Zap className="h-8 w-8 opacity-20" />
            <span className="font-mono text-xs">No arbitrage opportunities found</span>
            <span className="font-mono text-[10px] opacity-60">
              {totalMarkets > 0 
                ? `${totalMarkets} markets loaded, waiting for matching spreads`
                : "Run fetch functions to populate data"
              }
            </span>
          </div>
        ) : (
          filteredOpportunities.map((opp, index) => {
            const Icon = categoryIcons[opp.category] || TrendingUp;
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

                {/* Buy Price + Platform */}
                <div className="flex flex-col items-center justify-center">
                  <span className="font-mono text-[11px] text-foreground">
                    {formatPrice(opp.buyPrice)}
                  </span>
                  <span className="flex items-center gap-0.5 font-mono text-[8px] text-muted-foreground uppercase">
                    {PLATFORM_COLORS[opp.buyPlatform] && (
                      <span className={`inline-block w-1.5 h-1.5 rounded-full ${PLATFORM_COLORS[opp.buyPlatform]}`} />
                    )}
                    {opp.buyPlatform}
                  </span>
                </div>

                {/* Sell Price + Platform */}
                <div className="flex flex-col items-center justify-center">
                  <span className="font-mono text-[11px] text-foreground">
                    {formatPrice(opp.sellPrice)}
                  </span>
                  <span className="flex items-center gap-0.5 font-mono text-[8px] text-muted-foreground uppercase">
                    {PLATFORM_COLORS[opp.sellPlatform] && (
                      <span className={`inline-block w-1.5 h-1.5 rounded-full ${PLATFORM_COLORS[opp.sellPlatform]}`} />
                    )}
                    {opp.sellPlatform}
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

                {/* Potential Profit */}
                <div className="flex flex-col items-center justify-center gap-0.5">
                  <span className="font-mono text-[10px] text-accent">
                    {formatProfit(opp.potentialProfit)}
                  </span>
                  <div className="h-0.5 w-full max-w-[50px] overflow-hidden rounded-sm bg-secondary">
                    <div
                      className="h-full rounded-sm bg-accent/60"
                      style={{ width: `${getProfitWidth(opp.potentialProfit)}%` }}
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
          })
        )}
      </div>
    </div>
  );
};
