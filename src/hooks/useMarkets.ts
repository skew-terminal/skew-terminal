import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Market {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  category: string;
  status: string;
  resolution_date: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Price {
  id: string;
  market_id: string;
  platform: string;
  yes_price: number;
  no_price: number;
  volume_24h: number | null;
  total_volume: number | null;
  recorded_at: string;
}

export interface MarketWithPrices extends Market {
  prices: Price[];
}

export function useMarkets(options?: { category?: string; status?: string }) {
  return useQuery({
    queryKey: ["markets", options?.category, options?.status],
    queryFn: async () => {
      let query = supabase
        .from("markets")
        .select("*")
        .order("updated_at", { ascending: false });

      if (options?.category && options.category !== "all") {
        query = query.eq("category", options.category as "crypto" | "economy" | "other" | "politics" | "sports");
      }

      if (options?.status) {
        query = query.eq("status", options.status as "active" | "resolved" | "suspended");
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching markets:", error);
        throw error;
      }

      return (data || []) as Market[];
    },
    refetchInterval: 60000, // Refetch every minute
  });
}

export function useMarketBySlug(slug: string) {
  return useQuery({
    queryKey: ["market", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("markets")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

      if (error) {
        console.error("Error fetching market:", error);
        throw error;
      }

      return data as Market | null;
    },
    enabled: !!slug,
  });
}

export function useMarketWithPrices(marketId: string) {
  return useQuery({
    queryKey: ["market-prices", marketId],
    queryFn: async () => {
      // Fetch market
      const { data: market, error: marketError } = await supabase
        .from("markets")
        .select("*")
        .eq("id", marketId)
        .maybeSingle();

      if (marketError) {
        console.error("Error fetching market:", marketError);
        throw marketError;
      }

      if (!market) return null;

      // Fetch latest prices per platform
      const { data: prices, error: pricesError } = await supabase
        .from("prices")
        .select("*")
        .eq("market_id", marketId)
        .order("recorded_at", { ascending: false });

      if (pricesError) {
        console.error("Error fetching prices:", pricesError);
        throw pricesError;
      }

      // Get latest price per platform
      const latestPrices = new Map<string, Price>();
      for (const price of prices || []) {
        if (!latestPrices.has(price.platform)) {
          latestPrices.set(price.platform, price as Price);
        }
      }

      return {
        ...market,
        prices: Array.from(latestPrices.values()),
      } as MarketWithPrices;
    },
    enabled: !!marketId,
    refetchInterval: 30000,
  });
}

export function usePriceHistory(marketId: string, platform?: string) {
  return useQuery({
    queryKey: ["price-history", marketId, platform],
    queryFn: async () => {
      let query = supabase
        .from("prices")
        .select("*")
        .eq("market_id", marketId)
        .order("recorded_at", { ascending: true })
        .limit(100);

      if (platform) {
        query = query.eq("platform", platform as "drift" | "kalshi" | "other" | "polymarket");
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching price history:", error);
        throw error;
      }

      return (data || []) as Price[];
    },
    enabled: !!marketId,
  });
}
