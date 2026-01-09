import { useParams, useNavigate } from "react-router-dom";
import { TopNavBar } from "@/components/terminal/TopNavBar";
import { IconSidebar } from "@/components/terminal/IconSidebar";
import { ArrowLeft, TrendingUp, Clock, ExternalLink, Loader2, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Platform configuration with URLs and colors
const PLATFORM_CONFIG: Record<string, { 
  name: string; 
  color: string; 
  getUrl: (title: string, slug?: string) => string;
  baseUrl: string;
}> = {
  kalshi: {
    name: 'Kalshi',
    color: 'bg-blue-500',
    baseUrl: 'https://kalshi.com',
    getUrl: (title) => `https://kalshi.com/search?query=${encodeURIComponent(title.substring(0, 50))}`
  },
  polymarket: {
    name: 'Polymarket', 
    color: 'bg-purple-500',
    baseUrl: 'https://polymarket.com',
    getUrl: (title) => `https://polymarket.com/search?query=${encodeURIComponent(title.substring(0, 50))}`
  },
  predictit: {
    name: 'PredictIt',
    color: 'bg-red-500', 
    baseUrl: 'https://www.predictit.org',
    getUrl: (title) => `https://www.predictit.org/markets`
  },
  manifold: {
    name: 'Manifold',
    color: 'bg-yellow-500',
    baseUrl: 'https://manifold.markets',
    getUrl: (title) => `https://manifold.markets/search?q=${encodeURIComponent(title.substring(0, 50))}`
  },
  azuro: {
    name: 'Azuro',
    color: 'bg-green-500',
    baseUrl: 'https://azuro.org',
    getUrl: () => `https://azuro.org`
  },
  pancakeswap: {
    name: 'PancakeSwap',
    color: 'bg-yellow-600',
    baseUrl: 'https://pancakeswap.finance/prediction',
    getUrl: () => `https://pancakeswap.finance/prediction`
  },
  thales: {
    name: 'Thales',
    color: 'bg-violet-500',
    baseUrl: 'https://thalesmarket.io',
    getUrl: () => `https://thalesmarket.io`
  },
  divvybet: {
    name: 'DivvyBet',
    color: 'bg-orange-500',
    baseUrl: 'https://divvy.bet',
    getUrl: () => `https://divvy.bet`
  },
  metaculus: {
    name: 'Metaculus',
    color: 'bg-indigo-500',
    baseUrl: 'https://www.metaculus.com',
    getUrl: (title) => `https://www.metaculus.com/questions/?search=${encodeURIComponent(title.substring(0, 50))}`
  }
};

const getDefaultPlatformConfig = (platform: string) => ({
  name: platform.charAt(0).toUpperCase() + platform.slice(1),
  color: 'bg-gray-500',
  baseUrl: '#',
  getUrl: () => '#'
});

const EventDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: spreadData, isLoading } = useQuery({
    queryKey: ["spread-detail", id],
    queryFn: async () => {
      const { data: spread } = await supabase
        .from("spreads")
        .select(`
          *,
          market:markets(*)
        `)
        .eq("id", id)
        .maybeSingle();

      if (spread) {
        const marketId = spread.market_id;
        
        // Get prices for buy platform
        const { data: buyPrices } = await supabase
          .from("prices")
          .select("*")
          .eq("market_id", marketId)
          .eq("platform", spread.buy_platform)
          .order("recorded_at", { ascending: false })
          .limit(10);

        // Get mapping to find matched market
        const { data: mapping } = await supabase
          .from("market_mappings")
          .select("market_id_platform1, market_id_platform2, platform1, platform2")
          .or(`market_id_platform1.eq.${marketId},market_id_platform2.eq.${marketId}`)
          .limit(1)
          .maybeSingle();

        let otherMarket = null;
        let sellPrices: any[] = [];
        
        if (mapping) {
          const otherMarketId = mapping.market_id_platform1 === marketId 
            ? mapping.market_id_platform2 
            : mapping.market_id_platform1;

          const { data: other } = await supabase
            .from("markets")
            .select("*")
            .eq("id", otherMarketId)
            .maybeSingle();
          
          otherMarket = other;

          if (otherMarketId) {
            const { data: sp } = await supabase
              .from("prices")
              .select("*")
              .eq("market_id", otherMarketId)
              .eq("platform", spread.sell_platform)
              .order("recorded_at", { ascending: false })
              .limit(10);
            sellPrices = sp || [];
          }
        }

        return {
          spread,
          market: Array.isArray(spread.market) ? spread.market[0] : spread.market,
          buyPrices: buyPrices || [],
          sellPrices,
          otherMarket,
          buyPlatform: spread.buy_platform,
          sellPlatform: spread.sell_platform
        };
      }

      // Fallback: find by slug
      const { data: marketData } = await supabase
        .from("markets")
        .select("*")
        .eq("slug", id)
        .maybeSingle();
      
      if (marketData) {
        const { data: prices } = await supabase
          .from("prices")
          .select("*")
          .eq("market_id", marketData.id)
          .order("recorded_at", { ascending: false })
          .limit(10);

        return {
          market: marketData,
          buyPrices: prices || [],
          sellPrices: [],
          spread: null,
          otherMarket: null,
          buyPlatform: marketData.platform,
          sellPlatform: null
        };
      }

      return null;
    },
    enabled: !!id
  });

  const generateChartData = () => {
    if (!spreadData?.buyPrices) return [];
    
    return spreadData.buyPrices.slice().reverse().map((p: any, i: number) => ({
      time: `${i}`,
      price: Number(p.yes_price),
      platform: p.platform
    }));
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-full flex-col overflow-hidden bg-background">
        <TopNavBar />
        <div className="flex flex-1 overflow-hidden">
          <IconSidebar />
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </div>
    );
  }

  if (!spreadData) {
    return (
      <div className="flex h-screen w-full flex-col overflow-hidden bg-background">
        <TopNavBar />
        <div className="flex flex-1 overflow-hidden">
          <IconSidebar />
          <div className="flex flex-1 flex-col items-center justify-center gap-4">
            <span className="font-mono text-muted-foreground">Event not found</span>
            <Button variant="outline" onClick={() => navigate("/app")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Terminal
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const market = spreadData.market;
  const spread = spreadData.spread;
  const otherMarket = spreadData.otherMarket;
  const buyPlatform = spreadData.buyPlatform || market?.platform || 'unknown';
  const sellPlatform = spreadData.sellPlatform || 'unknown';
  
  const buyConfig = PLATFORM_CONFIG[buyPlatform] || getDefaultPlatformConfig(buyPlatform);
  const sellConfig = PLATFORM_CONFIG[sellPlatform] || getDefaultPlatformConfig(sellPlatform);

  const latestBuyPrice = spreadData.buyPrices?.[0];
  const latestSellPrice = spreadData.sellPrices?.[0];

  const buyPrice = spread?.buy_price || latestBuyPrice?.yes_price || 0;
  const sellPrice = spread?.sell_price || latestSellPrice?.yes_price || 0;
  const skewPercentage = spread?.skew_percentage || 0;

  const chartData = generateChartData();
  
  // Determine which market title to use for each platform
  const buyMarketTitle = market?.title || '';
  const sellMarketTitle = otherMarket?.title || market?.title || '';

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background">
      <TopNavBar />
      
      <div className="flex flex-1 overflow-hidden">
        <IconSidebar />
        
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border/50 px-3 py-1.5">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                onClick={() => navigate("/app")}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <span className="font-mono text-xs font-bold text-foreground truncate max-w-[400px]">
                {market?.title || "Unknown Market"}
              </span>
              {skewPercentage > 0 && (
                <Badge variant="outline" className={`border-accent/50 font-mono text-[8px] px-1 py-0 ${
                  skewPercentage > 100 ? 'text-yellow-500 border-yellow-500/50' : 'text-accent'
                }`}>
                  {skewPercentage > 100 ? '⚠️' : ''} +{Number(skewPercentage).toFixed(1)}% SKEW
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="font-mono text-[9px]">
                {market?.category || "other"}
              </Badge>
              {market?.resolution_date && (
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span className="font-mono text-[10px] text-muted-foreground">
                    Resolves: {new Date(market.resolution_date).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="flex flex-1 overflow-hidden">
            {/* Left: Chart Area (60%) */}
            <div className="flex w-[60%] flex-col border-r border-border/50">
              {/* Price Chart */}
              <div className="flex-1 border-b border-border/50 p-2">
                <div className="mb-1 flex items-center justify-between">
                  <span className="font-sans text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Price History ({buyConfig.name})
                  </span>
                </div>
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="90%">
                    <AreaChart data={chartData}>
                      <XAxis dataKey="time" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                      <YAxis domain={[0, 1]} tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v.toFixed(2)}`} />
                      <Area type="monotone" dataKey="price" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.1)" strokeWidth={1.5} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-[90%] items-center justify-center text-muted-foreground">
                    <span className="font-mono text-xs">No price history available</span>
                  </div>
                )}
              </div>

              {/* Market Info */}
              <div className="h-[35%] p-2 overflow-auto">
                <span className="font-sans text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Matched Markets
                </span>
                <div className="mt-2 space-y-2">
                  <div className="rounded-sm border border-border/50 bg-secondary/30 p-2">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className={`w-2 h-2 rounded-full ${buyConfig.color}`} />
                      <span className="font-mono text-[9px] text-muted-foreground uppercase">{buyConfig.name} (BUY)</span>
                    </div>
                    <p className="font-mono text-[11px] text-foreground">
                      {buyMarketTitle}
                    </p>
                  </div>
                  {sellPlatform && sellPlatform !== 'unknown' && (
                    <div className="rounded-sm border border-border/50 bg-secondary/30 p-2">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className={`w-2 h-2 rounded-full ${sellConfig.color}`} />
                        <span className="font-mono text-[9px] text-muted-foreground uppercase">{sellConfig.name} (SELL)</span>
                      </div>
                      <p className="font-mono text-[11px] text-foreground">
                        {sellMarketTitle}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Data Panels (40%) */}
            <div className="flex w-[40%] flex-col">
              {/* Warning for high skew */}
              {skewPercentage > 100 && (
                <div className="border-b border-yellow-500/30 bg-yellow-500/10 p-2">
                  <div className="flex items-center gap-2 text-yellow-500">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="font-mono text-[10px] font-bold">HIGH SKEW WARNING</span>
                  </div>
                  <p className="font-mono text-[9px] text-yellow-500/80 mt-1">
                    {skewPercentage}% skew is unusually high. This may indicate different events were matched incorrectly.
                  </p>
                </div>
              )}

              {/* Price Comparison */}
              <div className="border-b border-border/50 p-2">
                <span className="font-sans text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Live Prices
                </span>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <div className="rounded-sm border border-border/50 bg-secondary/30 p-2">
                    <div className="flex items-center gap-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${buyConfig.color}`} />
                      <span className="font-mono text-[9px] text-muted-foreground uppercase">{buyConfig.name}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-1">
                      <span className="font-mono text-lg font-bold text-accent">
                        ${Number(buyPrice).toFixed(2)}
                      </span>
                      <span className="font-mono text-[8px] text-accent">BUY</span>
                    </div>
                  </div>
                  <div className="rounded-sm border border-border/50 bg-secondary/30 p-2">
                    <div className="flex items-center gap-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${sellConfig.color}`} />
                      <span className="font-mono text-[9px] text-muted-foreground uppercase">{sellConfig.name}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-1">
                      <span className="font-mono text-lg font-bold text-primary">
                        ${Number(sellPrice).toFixed(2)}
                      </span>
                      <span className="font-mono text-[8px] text-primary">SELL</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Arbitrage Box */}
              <div className="border-b border-border/50 p-2">
                <span className="font-sans text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Arbitrage Opportunity
                </span>
                <div className="mt-2 rounded-sm bg-accent/10 border border-accent/30 p-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-muted-foreground">SKEW</span>
                    <span className={`font-mono text-xl font-bold ${
                      skewPercentage > 100 ? 'text-yellow-500' : skewPercentage > 5 ? 'text-accent' : 'text-foreground'
                    }`}>
                      {skewPercentage > 0 ? `+${Number(skewPercentage).toFixed(1)}%` : 'N/A'}
                    </span>
                  </div>
                  {spread && (
                    <div className="mt-2 text-[10px] font-mono text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${buyConfig.color}`} />
                        Buy @ ${Number(buyPrice).toFixed(2)} on {buyConfig.name}
                      </div>
                      <div className="flex items-center gap-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${sellConfig.color}`} />
                        Sell @ ${Number(sellPrice).toFixed(2)} on {sellConfig.name}
                      </div>
                      <div className="text-accent mt-1">
                        Potential profit: ${Number(spread.potential_profit || 0).toFixed(2)} per $100
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons - BUY Platform */}
              <div className="border-b border-border/50 p-2">
                <div className="flex items-center gap-1.5 mb-2">
                  <span className={`w-2 h-2 rounded-full ${buyConfig.color}`} />
                  <span className="font-sans text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Buy on {buyConfig.name}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button 
                    className="flex-1 h-8 bg-accent hover:bg-accent/80 text-accent-foreground font-mono text-[10px]"
                    onClick={() => window.open(buyConfig.getUrl(buyMarketTitle), '_blank')}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    BUY YES @ ${Number(buyPrice).toFixed(2)}
                  </Button>
                </div>
                <a 
                  href={buyConfig.baseUrl}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block mt-1 font-mono text-[9px] text-muted-foreground hover:text-foreground underline"
                >
                  Open {buyConfig.name} →
                </a>
              </div>

              {/* Action Buttons - SELL Platform */}
              {sellPlatform && sellPlatform !== 'unknown' && (
                <div className="border-b border-border/50 p-2">
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className={`w-2 h-2 rounded-full ${sellConfig.color}`} />
                    <span className="font-sans text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Sell on {sellConfig.name}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      className="flex-1 h-8 bg-primary hover:bg-primary/80 text-primary-foreground font-mono text-[10px]"
                      onClick={() => window.open(sellConfig.getUrl(sellMarketTitle), '_blank')}
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      SELL YES @ ${Number(sellPrice).toFixed(2)}
                    </Button>
                  </div>
                  <a 
                    href={sellConfig.baseUrl}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block mt-1 font-mono text-[9px] text-muted-foreground hover:text-foreground underline"
                  >
                    Open {sellConfig.name} →
                  </a>
                </div>
              )}

              {/* Verification */}
              <div className="flex-1 overflow-auto p-2">
                <span className="font-sans text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Verification
                </span>
                <div className="mt-2 space-y-2 text-[10px] font-mono text-muted-foreground">
                  <p>⚠️ Verify prices manually on both platforms before trading.</p>
                  <p>• High skew (&gt;100%) usually means different events, not arbitrage.</p>
                  <p>• Compare event descriptions carefully.</p>
                  <p>• Account for fees, slippage, and timing differences.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetailPage;
