import { useParams, useNavigate } from "react-router-dom";
import { TopNavBar } from "@/components/terminal/TopNavBar";
import { IconSidebar } from "@/components/terminal/IconSidebar";
import { ArrowLeft, TrendingUp, TrendingDown, Activity, Clock, ExternalLink, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, BarChart, Bar } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const EventDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Fetch spread details by market slug or spread id
  const { data: spreadData, isLoading } = useQuery({
    queryKey: ["spread-detail", id],
    queryFn: async () => {
      // First try to find by spread id
      let spreadQuery = supabase
        .from("spreads")
        .select(`
          *,
          market:markets(*)
        `)
        .eq("is_active", true);

      // Try to match by market slug
      const { data: marketData } = await supabase
        .from("markets")
        .select("id")
        .eq("slug", id)
        .maybeSingle();

      if (marketData) {
        spreadQuery = spreadQuery.eq("market_id", marketData.id);
      }

      const { data: spreads } = await spreadQuery.limit(1);
      const spread = spreads?.[0];

      if (!spread) {
        // If no spread found, try to get market directly
        const { data: market } = await supabase
          .from("markets")
          .select("*")
          .eq("slug", id)
          .maybeSingle();
        
        if (market) {
          // Get prices for this market
          const { data: prices } = await supabase
            .from("prices")
            .select("*")
            .eq("market_id", market.id)
            .order("recorded_at", { ascending: false })
            .limit(2);

          return {
            market,
            prices: prices || [],
            spread: null
          };
        }
        return null;
      }

      // Get prices for both platforms
      const marketId = spread.market_id;
      const { data: prices } = await supabase
        .from("prices")
        .select("*")
        .eq("market_id", marketId)
        .order("recorded_at", { ascending: false })
        .limit(10);

      // Get mapping to find the other market
      const { data: mapping } = await supabase
        .from("market_mappings")
        .select("market_a_id, market_b_id")
        .or(`market_a_id.eq.${marketId},market_b_id.eq.${marketId}`)
        .limit(1)
        .maybeSingle();

      let otherMarket = null;
      let otherPrices: any[] = [];
      
      if (mapping) {
        const otherMarketId = mapping.market_a_id === marketId 
          ? mapping.market_b_id 
          : mapping.market_a_id;

        const { data: other } = await supabase
          .from("markets")
          .select("*")
          .eq("id", otherMarketId)
          .maybeSingle();
        
        otherMarket = other;

        if (otherMarketId) {
          const { data: op } = await supabase
            .from("prices")
            .select("*")
            .eq("market_id", otherMarketId)
            .order("recorded_at", { ascending: false })
            .limit(10);
          otherPrices = op || [];
        }
      }

      return {
        spread,
        market: Array.isArray(spread.market) ? spread.market[0] : spread.market,
        prices: prices || [],
        otherMarket,
        otherPrices
      };
    },
    enabled: !!id
  });

  // Generate chart data from real prices
  const generateChartData = () => {
    if (!spreadData?.prices) return [];
    
    return spreadData.prices.slice().reverse().map((p: any, i: number) => ({
      time: `${i}`,
      price: Number(p.yes_price),
      platform: p.platform
    }));
  };

  const getPolymarketUrl = (title: string) => {
    // Create search URL for Polymarket
    const searchQuery = encodeURIComponent(title.substring(0, 50));
    return `https://polymarket.com/search?query=${searchQuery}`;
  };

  const getKalshiUrl = (title: string) => {
    // Create search URL for Kalshi
    const searchQuery = encodeURIComponent(title.substring(0, 50));
    return `https://kalshi.com/search?query=${searchQuery}`;
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
  const prices = spreadData.prices || [];
  const otherMarket = spreadData.otherMarket;
  const otherPrices = spreadData.otherPrices || [];

  // Get latest prices
  const latestPrice = prices[0];
  const latestOtherPrice = otherPrices[0];

  const buyPrice = spread?.buy_price || latestPrice?.yes_price || 0;
  const sellPrice = spread?.sell_price || latestOtherPrice?.yes_price || 0;
  const skewPercentage = spread?.skew_percentage || 0;

  const chartData = generateChartData();

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
                <Badge variant="outline" className="border-accent/50 text-accent font-mono text-[8px] px-1 py-0">
                  +{Number(skewPercentage).toFixed(1)}% SKEW
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
                    Price History
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
                  Market Details
                </span>
                <div className="mt-2 space-y-2">
                  <div className="rounded-sm border border-border/50 bg-secondary/30 p-2">
                    <span className="font-mono text-[9px] text-muted-foreground">KALSHI MARKET</span>
                    <p className="font-mono text-[11px] text-foreground mt-1">
                      {market?.title}
                    </p>
                  </div>
                  {otherMarket && (
                    <div className="rounded-sm border border-border/50 bg-secondary/30 p-2">
                      <span className="font-mono text-[9px] text-muted-foreground">POLYMARKET MATCH</span>
                      <p className="font-mono text-[11px] text-foreground mt-1">
                        {otherMarket.title}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Data Panels (40%) */}
            <div className="flex w-[40%] flex-col">
              {/* Price Comparison */}
              <div className="border-b border-border/50 p-2">
                <span className="font-sans text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Live Prices
                </span>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <div className="rounded-sm border border-border/50 bg-secondary/30 p-2">
                    <span className="font-mono text-[9px] text-muted-foreground">KALSHI (YES)</span>
                    <div className="mt-1 flex items-center gap-1">
                      <span className="font-mono text-lg font-bold text-foreground">
                        ${Number(latestPrice?.yes_price || 0).toFixed(2)}
                      </span>
                    </div>
                    <span className="font-mono text-[8px] text-muted-foreground">
                      NO: ${Number(latestPrice?.no_price || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="rounded-sm border border-border/50 bg-secondary/30 p-2">
                    <span className="font-mono text-[9px] text-muted-foreground">POLYMARKET (YES)</span>
                    <div className="mt-1 flex items-center gap-1">
                      <span className="font-mono text-lg font-bold text-foreground">
                        ${Number(latestOtherPrice?.yes_price || 0).toFixed(2)}
                      </span>
                    </div>
                    <span className="font-mono text-[8px] text-muted-foreground">
                      NO: ${Number(latestOtherPrice?.no_price || 0).toFixed(2)}
                    </span>
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
                    <span className={`font-mono text-xl font-bold ${skewPercentage > 5 ? 'text-accent' : 'text-foreground'}`}>
                      {skewPercentage > 0 ? `+${Number(skewPercentage).toFixed(1)}%` : 'N/A'}
                    </span>
                  </div>
                  {spread && (
                    <div className="mt-2 text-[10px] font-mono text-muted-foreground">
                      <div>Buy @ ${Number(buyPrice).toFixed(2)} ({spread.buy_platform})</div>
                      <div>Sell @ ${Number(sellPrice).toFixed(2)} ({spread.sell_platform})</div>
                      <div className="text-accent mt-1">
                        Potential profit: ${Number(spread.potential_profit || 0).toFixed(2)} per $100
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons - KALSHI */}
              <div className="border-b border-border/50 p-2">
                <span className="font-sans text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Trade on Kalshi
                </span>
                <div className="mt-2 flex gap-2">
                  <Button 
                    className="flex-1 h-8 bg-accent hover:bg-accent/80 text-accent-foreground font-mono text-[10px]"
                    onClick={() => window.open(getKalshiUrl(market?.title || ''), '_blank')}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    BUY YES
                  </Button>
                  <Button 
                    className="flex-1 h-8 bg-primary hover:bg-primary/80 text-primary-foreground font-mono text-[10px]"
                    onClick={() => window.open(getKalshiUrl(market?.title || ''), '_blank')}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    BUY NO
                  </Button>
                </div>
                <a 
                  href="https://kalshi.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block mt-1 font-mono text-[9px] text-muted-foreground hover:text-foreground underline"
                >
                  Open Kalshi →
                </a>
              </div>

              {/* Action Buttons - POLYMARKET */}
              <div className="border-b border-border/50 p-2">
                <span className="font-sans text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Trade on Polymarket
                </span>
                <div className="mt-2 flex gap-2">
                  <Button 
                    className="flex-1 h-8 bg-accent hover:bg-accent/80 text-accent-foreground font-mono text-[10px]"
                    onClick={() => window.open(getPolymarketUrl(otherMarket?.title || market?.title || ''), '_blank')}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    BUY YES
                  </Button>
                  <Button 
                    className="flex-1 h-8 bg-primary hover:bg-primary/80 text-primary-foreground font-mono text-[10px]"
                    onClick={() => window.open(getPolymarketUrl(otherMarket?.title || market?.title || ''), '_blank')}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    BUY NO
                  </Button>
                </div>
                <a 
                  href="https://polymarket.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block mt-1 font-mono text-[9px] text-muted-foreground hover:text-foreground underline"
                >
                  Open Polymarket →
                </a>
              </div>

              {/* Spread Info */}
              <div className="flex-1 overflow-auto p-2">
                <span className="font-sans text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Verification
                </span>
                <div className="mt-2 space-y-2 text-[10px] font-mono text-muted-foreground">
                  <p>⚠️ Verify prices manually on both platforms before trading.</p>
                  <p>• High skew percentages may indicate different events, not arbitrage.</p>
                  <p>• Always check event descriptions match before executing trades.</p>
                  <p>• Consider fees and slippage in your calculations.</p>
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
