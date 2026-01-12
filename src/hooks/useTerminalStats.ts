import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TerminalStats {
  totalVolume24h: number;
  totalMarkets: number;
  arbitrageCount: number;
  platformCount: number;
}

export function useTerminalStats() {
  return useQuery({
    queryKey: ['terminal-stats'],
    queryFn: async (): Promise<TerminalStats> => {
      // Get 24h volume from prices table
      const { data: volumeData } = await supabase
        .from('prices')
        .select('volume_24h')
        .gte('recorded_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
      
      const totalVolume24h = volumeData?.reduce((sum, p) => sum + (Number(p.volume_24h) || 0), 0) || 0;

      // Get active markets count
      const { count: marketsCount } = await supabase
        .from('markets')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Get active arbitrage count
      const { count: arbCount } = await supabase
        .from('spreads')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
        .gte('skew_percentage', 2);

      // Get unique platforms
      const { data: platformsData } = await supabase
        .from('markets')
        .select('platform')
        .eq('status', 'active');
      
      const uniquePlatforms = new Set(platformsData?.map(m => m.platform) || []);

      return {
        totalVolume24h,
        totalMarkets: marketsCount || 0,
        arbitrageCount: arbCount || 0,
        platformCount: uniquePlatforms.size
      };
    },
    refetchInterval: 60000, // Refetch every minute
    staleTime: 30000,
  });
}
