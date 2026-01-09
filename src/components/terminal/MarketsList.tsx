import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, TrendingUp, Bitcoin, Vote, Flame, Loader2, ChevronRight, Zap, Calendar, ArrowUpDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGroupedMarkets, GroupedMarket } from "@/hooks/useGroupedMarkets";
import { format } from "date-fns";

const ALL_PLATFORMS = [
  { id: 'kalshi', name: 'Kalshi', color: 'bg-blue-500' },
  { id: 'polymarket', name: 'Polymarket', color: 'bg-purple-500' },
  { id: 'azuro', name: 'Azuro', color: 'bg-green-500' },
  { id: 'predictit', name: 'PredictIt', color: 'bg-red-500' },
  { id: 'manifold', name: 'Manifold', color: 'bg-yellow-500' },
  { id: 'metaculus', name: 'Metaculus', color: 'bg-indigo-500' },
  { id: 'futuur', name: 'Futuur', color: 'bg-pink-500' },
  { id: 'thales', name: 'Thales', color: 'bg-violet-500' },
];

const PLATFORM_MAP = ALL_PLATFORMS.reduce((acc, p) => ({ ...acc, [p.id]: p }), {} as Record<string, typeof ALL_PLATFORMS[0]>);

const categories = ["all", "crypto", "politics", "economics", "sports"] as const;

const categoryIcons: Record<string, typeof Bitcoin> = {
  crypto: Bitcoin,
  politics: Vote,
  economics: TrendingUp,
  sports: Flame,
  other: TrendingUp,
};

type SortOption = "volume" | "spread" | "ending";

export const MarketsList = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<typeof categories[number]>("all");
  const [selectedPlatform, setSelectedPlatform] = useState("all");
  const [sortBy, setSortBy] = useState<SortOption>("volume");

  const { data: markets, isLoading, error } = useGroupedMarkets({
    category: activeCategory,
    platform: selectedPlatform,
    search: searchQuery,
    sortBy,
  });

  const formatPrice = (price: number) => `$${price.toFixed(2)}`;
  
  const formatVolume = (volume: number | null) => {
    if (!volume) return "-";
    if (volume >= 1000000) return `$${(volume / 1000000).toFixed(1)}M`;
    if (volume >= 1000) return `$${(volume / 1000).toFixed(0)}k`;
    return `$${volume.toFixed(0)}`;
  };

  const handleMarketClick = (market: GroupedMarket) => {
    navigate(`/event/${market.id}`);
  };

  if (error) {
    return (
      <div className="flex h-full items-center justify-center text-destructive">
        <span className="font-mono text-xs">Error loading markets</span>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Search and Filters */}
      <div className="border-b border-border bg-secondary/20 p-3 space-y-3">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search markets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-9 bg-background border-border font-mono text-sm"
          />
        </div>

        {/* Category and Sort Controls */}
        <div className="flex items-center justify-between gap-4">
          {/* Category Pills */}
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

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-secondary border-0 text-[9px] font-mono uppercase text-foreground px-2 py-1 rounded focus:ring-1 focus:ring-primary/50"
            >
              <option value="volume">Volume</option>
              <option value="spread">Spread</option>
              <option value="ending">Ending Soon</option>
            </select>
          </div>
        </div>

        {/* Platform Filter */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedPlatform("all")}
            className={`h-5 px-2 font-mono text-[8px] uppercase shrink-0 ${
              selectedPlatform === "all"
                ? "bg-primary/20 text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            All Platforms
          </Button>
          {ALL_PLATFORMS.map((platform) => (
            <Button
              key={platform.id}
              variant="ghost"
              size="sm"
              onClick={() => setSelectedPlatform(platform.id)}
              className={`h-5 px-2 font-mono text-[8px] uppercase shrink-0 gap-1 ${
                selectedPlatform === platform.id
                  ? "bg-primary/20 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${platform.color}`} />
              {platform.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Markets List */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : !markets || markets.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <TrendingUp className="h-10 w-10 opacity-20" />
            <span className="font-mono text-sm">No markets found</span>
            <span className="font-mono text-xs opacity-60">
              Try adjusting your filters
            </span>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {markets.map((market) => {
              const Icon = categoryIcons[market.category] || TrendingUp;
              const hasMultiplePlatforms = market.platforms.length > 1;

              return (
                <div
                  key={market.id}
                  onClick={() => handleMarketClick(market)}
                  className="group p-3 cursor-pointer transition-all hover:bg-secondary/40"
                >
                  {/* Market Header */}
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-start gap-2 min-w-0 flex-1">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm bg-secondary mt-0.5">
                        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-mono text-sm text-foreground line-clamp-2 leading-tight">
                          {market.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="border-muted text-muted-foreground font-mono text-[8px] px-1 py-0 uppercase">
                            {market.category}
                          </Badge>
                          {market.resolution_date && (
                            <span className="flex items-center gap-1 text-[9px] text-muted-foreground font-mono">
                              <Calendar className="h-2.5 w-2.5" />
                              {format(new Date(market.resolution_date), "MMM d, yyyy")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Price Range & Spread */}
                    <div className="text-right shrink-0">
                      <div className="font-mono text-sm font-bold text-foreground">
                        {market.minPrice > 0 ? (
                          hasMultiplePlatforms ? (
                            `${formatPrice(market.minPrice)}-${formatPrice(market.maxPrice)}`
                          ) : (
                            formatPrice(market.platforms[0]?.yes_price || 0)
                          )
                        ) : (
                          "-"
                        )}
                      </div>
                      {hasMultiplePlatforms && market.spread > 0 && (
                        <div className={`font-mono text-[10px] ${
                          market.spread >= 5 ? "text-accent font-bold" : "text-muted-foreground"
                        }`}>
                          {market.spread.toFixed(1)}% spread
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Platform Prices Grid */}
                  {market.platforms.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1.5 mt-2">
                      {market.platforms.slice(0, 4).map((platformPrice) => {
                        const platformInfo = PLATFORM_MAP[platformPrice.platform];
                        const isBestBuy = platformPrice.platform === market.bestBuyPlatform;
                        const isBestSell = platformPrice.platform === market.bestSellPlatform;

                        return (
                          <div
                            key={platformPrice.platform}
                            className={`flex items-center justify-between p-1.5 rounded bg-secondary/40 ${
                              isBestBuy ? "ring-1 ring-accent/50" : ""
                            }`}
                          >
                            <div className="flex items-center gap-1">
                              <span className={`w-1.5 h-1.5 rounded-full ${platformInfo?.color || 'bg-gray-500'}`} />
                              <span className="font-mono text-[8px] text-muted-foreground uppercase">
                                {platformPrice.platform}
                              </span>
                              {isBestBuy && hasMultiplePlatforms && (
                                <Badge className="bg-accent/20 text-accent border-0 font-mono text-[6px] px-0.5 py-0">
                                  BEST
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="font-mono text-[10px] text-foreground font-medium">
                                {formatPrice(platformPrice.yes_price)}
                              </span>
                              <span className="font-mono text-[8px] text-muted-foreground">Y</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Actions Row */}
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/30">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[9px] text-muted-foreground">
                        {market.platforms.length} platform{market.platforms.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {market.hasArbitrage && (
                        <Badge className="bg-accent text-accent-foreground font-mono text-[8px] px-1.5 py-0 gap-1">
                          <Zap className="h-2.5 w-2.5" />
                          Arbitrage
                        </Badge>
                      )}
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </div>
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
