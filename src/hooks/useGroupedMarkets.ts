import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PlatformPrice {
  platform: string;
  yes_price: number;
  no_price: number;
  volume_24h: number | null;
  total_volume: number | null;
  recorded_at: string;
}

export interface GroupedMarket {
  id: string;
  slug: string;
  title: string;
  category: string;
  status: string;
  resolution_date: string | null;
  platforms: PlatformPrice[];
  minPrice: number;
  maxPrice: number;
  spread: number;
  hasArbitrage: boolean;
  bestBuyPlatform: string | null;
  bestSellPlatform: string | null;
}

export function useGroupedMarkets(options?: { 
  category?: string; 
  platform?: string;
  search?: string;
  sortBy?: "volume" | "spread" | "ending";
}) {
  return useQuery({
    queryKey: ["grouped-markets", options?.category, options?.platform, options?.search, options?.sortBy],
    queryFn: async () => {
      // Fetch all active markets
      let marketsQuery = supabase
        .from("markets")
        .select("*")
        .eq("status", "active")
        .order("updated_at", { ascending: false })
        .limit(500);

      if (options?.category && options.category !== "all") {
        marketsQuery = marketsQuery.eq("category", options.category as "crypto" | "economy" | "other" | "politics" | "sports");
      }

      if (options?.platform && options.platform !== "all") {
        marketsQuery = marketsQuery.eq("platform", options.platform);
      }

      const { data: markets, error: marketsError } = await marketsQuery;

      if (marketsError) {
        console.error("Error fetching markets:", marketsError);
        throw marketsError;
      }

      if (!markets || markets.length === 0) {
        return [];
      }

      // Fetch latest prices for all markets
      const marketIds = markets.map(m => m.id);
      const { data: allPrices, error: pricesError } = await supabase
        .from("prices")
        .select("*")
        .in("market_id", marketIds)
        .order("recorded_at", { ascending: false });

      if (pricesError) {
        console.error("Error fetching prices:", pricesError);
        throw pricesError;
      }

      // Group prices by market and get latest per platform
      const pricesByMarket = new Map<string, Map<string, PlatformPrice>>();
      
      for (const price of allPrices || []) {
        if (!pricesByMarket.has(price.market_id)) {
          pricesByMarket.set(price.market_id, new Map());
        }
        const marketPrices = pricesByMarket.get(price.market_id)!;
        
        // Only keep the latest price per platform
        if (!marketPrices.has(price.platform)) {
          marketPrices.set(price.platform, {
            platform: price.platform,
            yes_price: Number(price.yes_price),
            no_price: Number(price.no_price),
            volume_24h: price.volume_24h ? Number(price.volume_24h) : null,
            total_volume: price.total_volume ? Number(price.total_volume) : null,
            recorded_at: price.recorded_at,
          });
        }
      }

      // Build grouped markets
      let groupedMarkets: GroupedMarket[] = markets.map(market => {
        const platformPrices = pricesByMarket.get(market.id);
        const platforms = platformPrices ? Array.from(platformPrices.values()) : [];
        
        // Calculate price range and spread
        const yesPrices = platforms.map(p => p.yes_price).filter(p => p > 0);
        const minPrice = yesPrices.length > 0 ? Math.min(...yesPrices) : 0;
        const maxPrice = yesPrices.length > 0 ? Math.max(...yesPrices) : 0;
        const spread = maxPrice > 0 ? ((maxPrice - minPrice) / maxPrice) * 100 : 0;
        
        // Find best buy (lowest) and sell (highest) platforms
        let bestBuyPlatform: string | null = null;
        let bestSellPlatform: string | null = null;
        
        if (platforms.length >= 2) {
          const sorted = [...platforms].sort((a, b) => a.yes_price - b.yes_price);
          bestBuyPlatform = sorted[0].platform;
          bestSellPlatform = sorted[sorted.length - 1].platform;
        }

        return {
          id: market.id,
          slug: market.slug,
          title: market.title,
          category: market.category,
          status: market.status,
          resolution_date: market.resolution_date,
          platforms,
          minPrice,
          maxPrice,
          spread,
          hasArbitrage: spread >= 2, // 2% threshold for arbitrage opportunity
          bestBuyPlatform,
          bestSellPlatform,
        };
      });

      // Apply search filter
      if (options?.search) {
        const searchLower = options.search.toLowerCase();
        groupedMarkets = groupedMarkets.filter(m => 
          m.title.toLowerCase().includes(searchLower)
        );
      }

      // Sort
      if (options?.sortBy === "spread") {
        groupedMarkets.sort((a, b) => b.spread - a.spread);
      } else if (options?.sortBy === "ending") {
        groupedMarkets.sort((a, b) => {
          if (!a.resolution_date) return 1;
          if (!b.resolution_date) return -1;
          return new Date(a.resolution_date).getTime() - new Date(b.resolution_date).getTime();
        });
      } else {
        // Default: sort by volume (platforms count as proxy)
        groupedMarkets.sort((a, b) => b.platforms.length - a.platforms.length);
      }

      return groupedMarkets;
    },
    refetchInterval: 30000,
  });
}

export function useTerminalStats() {
  return useQuery({
    queryKey: ["terminal-stats"],
    queryFn: async () => {
      // Get total active markets count
      const { count: totalMarkets } = await supabase
        .from("markets")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");

      // Get active arbitrage opportunities
      const { count: arbitrageCount } = await supabase
        .from("spreads")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true);

      // Get approximate 24h volume (sum of recent prices)
      const { data: volumeData } = await supabase
        .from("prices")
        .select("volume_24h")
        .gte("recorded_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .limit(1000);

      const totalVolume24h = volumeData?.reduce((sum, p) => sum + (Number(p.volume_24h) || 0), 0) || 0;

      return {
        totalMarkets: totalMarkets || 0,
        arbitrageCount: arbitrageCount || 0,
        totalVolume24h,
      };
    },
    refetchInterval: 60000,
  });
}
