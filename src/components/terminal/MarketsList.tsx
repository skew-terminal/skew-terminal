import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Search, TrendingUp, Bitcoin, Vote, Flame, Loader2, 
  ChevronRight, Zap, Calendar, ArrowUpDown, ExternalLink 
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGroupedMarkets, GroupedMarket } from "@/hooks/useGroupedMarkets";
import { format } from "date-fns";

const ALL_PLATFORMS = [
  { id: 'kalshi', name: 'Kalshi', color: 'bg-blue-500' },
  { id: 'polymarket', name: 'Polymarket', color: 'bg-purple-500' },
  { id: 'azuro', name: 'Azuro', color: 'bg-emerald-500' },
  { id: 'predictit', name: 'PredictIt', color: 'bg-red-500' },
  { id: 'manifold', name: 'Manifold', color: 'bg-yellow-500' },
  { id: 'metaculus', name: 'Metaculus', color: 'bg-indigo-500' },
  { id: 'futuur', name: 'Futuur', color: 'bg-pink-500' },
  { id: 'thales', name: 'Thales', color: 'bg-violet-500' },
  { id: 'pancakeswap', name: 'PancakeSwap', color: 'bg-amber-400' },
];

const PLATFORM_MAP = ALL_PLATFORMS.reduce((acc, p) => ({ ...acc, [p.id]: p }), {} as Record<string, typeof ALL_PLATFORMS[0]>);

const categories = ["all", "crypto", "politics", "sports", "economy"] as const;

const categoryIcons: Record<string, typeof Bitcoin> = {
  crypto: Bitcoin,
  politics: Vote,
  economy: TrendingUp,
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

  const getSpreadColor = (spread: number) => {
    if (spread >= 5) return "text-accent font-bold";
    if (spread >= 2) return "text-yellow-400";
    return "text-muted-foreground";
  };

  const formatTimeRemaining = (dateStr: string | null) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return "Ended";
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "1d";
    if (diffDays < 7) return `${diffDays}d`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w`;
    return `${Math.floor(diffDays / 30)}mo`;
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
      {/* Search and Filters Bar */}
      <div className="border-b border-border bg-secondary/20 p-2 space-y-2">
        {/* Row 1: Search + Sort */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search markets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-7 bg-background border-border font-mono text-xs"
            />
          </div>

          <div className="flex items-center gap-1 border-l border-border pl-3">
            <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-secondary border-0 text-[10px] font-mono uppercase text-foreground px-2 py-1 rounded focus:ring-1 focus:ring-primary/50"
            >
              <option value="volume">Volume</option>
              <option value="spread">Spread</option>
              <option value="ending">Ending</option>
            </select>
          </div>
        </div>

        {/* Row 2: Category + Platform Filters */}
        <div className="flex items-center gap-3">
          {/* Categories */}
          <div className="flex items-center gap-0.5">
            {categories.map((cat) => (
              <Button
                key={cat}
                variant="ghost"
                size="sm"
                onClick={() => setActiveCategory(cat)}
                className={`h-5 px-2 font-mono text-[9px] uppercase ${
                  activeCategory === cat
                    ? "bg-primary/20 text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {cat}
              </Button>
            ))}
          </div>

          <div className="h-4 w-px bg-border" />

          {/* Platforms */}
          <div className="flex items-center gap-0.5 overflow-x-auto scrollbar-hide flex-1">
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
              All
            </Button>
            {ALL_PLATFORMS.map((platform) => (
              <Button
                key={platform.id}
                variant="ghost"
                size="sm"
                onClick={() => setSelectedPlatform(platform.id)}
                className={`h-5 px-1.5 font-mono text-[8px] uppercase shrink-0 gap-1 ${
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
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-[2.5fr_1fr_1fr_0.8fr_0.6fr_0.4fr] gap-2 border-b border-border bg-secondary/30 px-3 py-1.5">
        <span className="font-sans text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
          Event
        </span>
        <span className="font-sans text-[9px] font-bold uppercase tracking-wider text-muted-foreground text-center">
          Best Price
        </span>
        <span className="font-sans text-[9px] font-bold uppercase tracking-wider text-muted-foreground text-center">
          Platforms
        </span>
        <span className="font-sans text-[9px] font-bold uppercase tracking-wider text-muted-foreground text-center">
          Spread
        </span>
        <span className="font-sans text-[9px] font-bold uppercase tracking-wider text-muted-foreground text-center">
          Ends
        </span>
        <span className="font-sans text-[9px] font-bold uppercase tracking-wider text-muted-foreground text-center">
          
        </span>
      </div>

      {/* Table Body */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
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
          markets.map((market, index) => {
            const Icon = categoryIcons[market.category] || TrendingUp;
            const hasMultiplePlatforms = market.platforms.length > 1;
            const bestPrice = market.minPrice > 0 ? market.minPrice : null;
            const bestPlatform = market.bestBuyPlatform ? PLATFORM_MAP[market.bestBuyPlatform] : null;

            return (
              <div
                key={market.id}
                onClick={() => handleMarketClick(market)}
                className={`group grid grid-cols-[2.5fr_1fr_1fr_0.8fr_0.6fr_0.4fr] gap-2 px-3 py-2 cursor-pointer transition-all hover:bg-secondary/50 border-b border-border/30 ${
                  index % 2 === 1 ? "bg-white/[0.01]" : ""
                }`}
              >
                {/* Event */}
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-secondary">
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-mono text-xs text-foreground line-clamp-1 leading-tight group-hover:text-primary transition-colors">
                      {market.title}
                    </h3>
                    <Badge variant="outline" className="border-muted text-muted-foreground font-mono text-[7px] px-1 py-0 uppercase mt-0.5">
                      {market.category}
                    </Badge>
                  </div>
                </div>

                {/* Best Price */}
                <div className="flex flex-col items-center justify-center">
                  {bestPrice ? (
                    <>
                      <span className="font-mono text-sm font-bold text-foreground">
                        {formatPrice(bestPrice)}
                      </span>
                      {bestPlatform && (
                        <div className="flex items-center gap-1">
                          <span className={`w-1.5 h-1.5 rounded-full ${bestPlatform.color}`} />
                          <span className="font-mono text-[8px] text-muted-foreground">
                            {bestPlatform.name}
                          </span>
                        </div>
                      )}
                    </>
                  ) : (
                    <span className="font-mono text-xs text-muted-foreground">-</span>
                  )}
                </div>

                {/* Platforms */}
                <div className="flex items-center justify-center gap-1">
                  {market.platforms.slice(0, 4).map((platformPrice) => {
                    const platformInfo = PLATFORM_MAP[platformPrice.platform];
                    return (
                      <div
                        key={platformPrice.platform}
                        className="flex flex-col items-center"
                        title={`${platformInfo?.name || platformPrice.platform}: $${platformPrice.yes_price.toFixed(2)}`}
                      >
                        <span className={`w-2 h-2 rounded-full ${platformInfo?.color || 'bg-gray-500'}`} />
                        <span className="font-mono text-[8px] text-muted-foreground">
                          {formatPrice(platformPrice.yes_price)}
                        </span>
                      </div>
                    );
                  })}
                  {market.platforms.length > 4 && (
                    <span className="font-mono text-[8px] text-muted-foreground">
                      +{market.platforms.length - 4}
                    </span>
                  )}
                </div>

                {/* Spread */}
                <div className="flex items-center justify-center">
                  {hasMultiplePlatforms && market.spread > 0 ? (
                    <span className={`font-mono text-xs ${getSpreadColor(market.spread)}`}>
                      {market.spread.toFixed(1)}%
                    </span>
                  ) : (
                    <span className="font-mono text-xs text-muted-foreground">-</span>
                  )}
                </div>

                {/* Ends */}
                <div className="flex items-center justify-center">
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {formatTimeRemaining(market.resolution_date)}
                  </span>
                </div>

                {/* Action */}
                <div className="flex items-center justify-center">
                  {market.hasArbitrage ? (
                    <Badge className="bg-accent text-accent-foreground border-0 font-mono text-[7px] px-1 py-0 gap-0.5">
                      <Zap className="h-2 w-2" />
                      ARB
                    </Badge>
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
