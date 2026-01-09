import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Bitcoin, TrendingUp, Vote, Flame, Zap, ArrowUpDown, Loader2, Globe, Link2, Target } from "lucide-react";
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
  chainColor: string;
}

const ALL_PLATFORMS: Platform[] = [
  { id: 'kalshi', name: 'Kalshi', color: 'bg-blue-500', chain: 'USA', chainColor: 'text-blue-400' },
  { id: 'polymarket', name: 'Polymarket', color: 'bg-purple-500', chain: 'Polygon', chainColor: 'text-purple-400' },
  { id: 'azuro', name: 'Azuro', color: 'bg-green-500', chain: 'Multi', chainColor: 'text-green-400' },
  { id: 'predictit', name: 'PredictIt', color: 'bg-red-500', chain: 'USA', chainColor: 'text-red-400' },
  { id: 'manifold', name: 'Manifold', color: 'bg-yellow-500', chain: 'Web2', chainColor: 'text-yellow-400' },
  { id: 'metaculus', name: 'Metaculus', color: 'bg-indigo-500', chain: 'Web2', chainColor: 'text-indigo-400' },
  { id: 'futuur', name: 'Futuur', color: 'bg-pink-500', chain: 'Polygon', chainColor: 'text-pink-400' },
  { id: 'thales', name: 'Thales', color: 'bg-violet-500', chain: 'Arbitrum', chainColor: 'text-violet-400' },
];

const PLATFORM_MAP = ALL_PLATFORMS.reduce((acc, p) => ({ ...acc, [p.id]: p }), {} as Record<string, Platform>);

const CHAINS = ['All', 'USA', 'Polygon', 'Solana', 'BSC', 'Base', 'Arbitrum', 'Ethereum', 'Gnosis', 'Polkadot', 'Web2', 'Multi'];

const categoryIcons: Record<string, typeof Bitcoin> = {
  crypto: Bitcoin,
  politics: Vote,
  economics: TrendingUp,
  sports: Flame,
  entertainment: Flame,
  other: TrendingUp,
};

const categories = ["all", "crypto", "politics", "economics", "sports"] as const;

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
  const [selectedPlatform, setSelectedPlatform] = useState<string>("all");
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
      .filter(spread => Number(spread.skew_percentage) >= 2) // Only show 2%+ spreads
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

  const getPlatformByChain = (chain: string) => {
    return ALL_PLATFORMS.filter(p => p.chain === chain);
  };

  const filteredOpportunities = opportunities
    .filter(opp => activeCategory === "all" || opp.category === activeCategory)
    .filter(opp => {
      if (selectedPlatform !== "all") {
        return opp.buyPlatform === selectedPlatform || opp.sellPlatform === selectedPlatform;
      }
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
        <span className="font-mono text-xs">Error loading arbitrage opportunities</span>
      </div>
    );
  }

  const totalMarkets = Object.values(platformStats || {}).reduce((a, b) => a + b, 0);
  const activePlatforms = Object.keys(platformStats || {}).length;

  return (
    <div className="flex h-full flex-col">
      {/* Header with Stats */}
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
          {/* Chain Filter */}
          <div className="flex items-center gap-1">
            <Link2 className="h-3 w-3 text-muted-foreground" />
            <select
              value={selectedChain}
              onChange={(e) => {
                setSelectedChain(e.target.value);
                setSelectedPlatform("all");
              }}
              className="bg-secondary border-0 text-[9px] font-mono uppercase text-foreground px-1.5 py-0.5 rounded focus:ring-1 focus:ring-primary/50"
            >
              {CHAINS.map(chain => (
                <option key={chain} value={chain}>{chain}</option>
              ))}
            </select>
          </div>

          {/* Category Filters */}
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
          <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground p-6">
            <Zap className="h-10 w-10 opacity-20" />
            <div className="text-center">
              <p className="font-mono text-sm mb-1">No arbitrage opportunities found</p>
              <p className="font-mono text-[10px] opacity-60">
                {totalMarkets > 0 
                  ? `Monitoring ${totalMarkets} markets across ${activePlatforms} platforms`
                  : "Run fetch functions to populate data"
                }
              </p>
            </div>
            <div className="flex flex-col items-center gap-2 mt-2 p-4 bg-secondary/30 rounded-lg border border-border/50 max-w-sm">
              <Target className="h-5 w-5 text-primary" />
              <p className="font-mono text-[10px] text-center text-muted-foreground">
                Arbitrage opportunities are rare (5-10 per day). Check the <span className="text-primary">Markets</span> tab for price comparison across all platforms.
              </p>
            </div>
          </div>
        ) : (
          filteredOpportunities.map((opp, index) => {
            const Icon = categoryIcons[opp.category] || TrendingUp;
            const isHighSkew = opp.skew > 10;
            const buyPlatform = PLATFORM_MAP[opp.buyPlatform];
            const sellPlatform = PLATFORM_MAP[opp.sellPlatform];

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
                  {opp.isRare && (
                    <Badge className="shrink-0 bg-accent text-accent-foreground border-0 font-mono text-[7px] px-1 py-0">
                      🔥 RARE
                    </Badge>
                  )}
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
                  <div className="flex items-center gap-0.5">
                    {buyPlatform && (
                      <span className={`inline-block w-1.5 h-1.5 rounded-full ${buyPlatform.color}`} />
                    )}
                    <span className="font-mono text-[7px] text-muted-foreground uppercase">
                      {opp.buyPlatform}
                    </span>
                  </div>
                </div>

                {/* Sell Price + Platform */}
                <div className="flex flex-col items-center justify-center">
                  <span className="font-mono text-[11px] text-foreground">
                    {formatPrice(opp.sellPrice)}
                  </span>
                  <div className="flex items-center gap-0.5">
                    {sellPlatform && (
                      <span className={`inline-block w-1.5 h-1.5 rounded-full ${sellPlatform.color}`} />
                    )}
                    <span className="font-mono text-[7px] text-muted-foreground uppercase">
                      {opp.sellPlatform}
                    </span>
                  </div>
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

      {/* Strategy Info Footer */}
      {filteredOpportunities.length > 0 && (
        <div className="border-t border-border bg-secondary/20 px-3 py-2">
          <div className="flex items-center gap-2 text-[9px] text-muted-foreground font-mono">
            <Target className="h-3 w-3 text-primary" />
            <span>
              <strong className="text-foreground">Hedged Bet Strategy:</strong> Buy YES on low-price platform + Buy NO on high-price platform = Guaranteed profit
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
