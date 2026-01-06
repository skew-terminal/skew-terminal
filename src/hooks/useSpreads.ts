import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Spread {
  id: string;
  market_id: string;
  buy_platform: string;
  sell_platform: string;
  buy_price: number;
  sell_price: number;
  skew_percentage: number;
  potential_profit: number | null;
  is_active: boolean;
  detected_at: string;
  expires_at: string | null;
  market?: {
    id: string;
    slug: string;
    title: string;
    category: string;
    status: string;
  };
}

export function useSpreads(options?: { activeOnly?: boolean; category?: string }) {
  return useQuery({
    queryKey: ["spreads", options?.activeOnly, options?.category],
    queryFn: async () => {
      let query = supabase
        .from("spreads")
        .select(`
          *,
          market:markets!inner(id, slug, title, category, status)
        `)
        .order("skew_percentage", { ascending: false });

      if (options?.activeOnly !== false) {
        query = query.eq("is_active", true);
      }

      if (options?.category && options.category !== "all") {
        query = query.eq("market.category", options.category);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching spreads:", error);
        throw error;
      }

      // Transform the data to flatten market relation
      return (data || []).map((spread) => ({
        ...spread,
        market: Array.isArray(spread.market) ? spread.market[0] : spread.market,
      })) as Spread[];
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

export function useSpreadById(spreadId: string) {
  return useQuery({
    queryKey: ["spread", spreadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("spreads")
        .select(`
          *,
          market:markets(id, slug, title, category, status, description, resolution_date)
        `)
        .eq("id", spreadId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching spread:", error);
        throw error;
      }

      if (!data) return null;

      return {
        ...data,
        market: Array.isArray(data.market) ? data.market[0] : data.market,
      } as Spread;
    },
    enabled: !!spreadId,
  });
}
