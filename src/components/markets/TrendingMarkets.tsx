import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, Flame, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface TrendingMarket {
  id: string;
  title: string;
  platform: string;
  category: string;
  resolution_date: string | null;
  totalVolume: number;
}

const PLATFORM_COLORS: Record<string, string> = {
  kalshi: 'bg-blue-500/20 text-blue-400',
  polymarket: 'bg-purple-500/20 text-purple-400',
  manifold: 'bg-indigo-500/20 text-indigo-400',
  predictit: 'bg-orange-500/20 text-orange-400',
  azuro: 'bg-cyan-500/20 text-cyan-400',
};

export const TrendingMarkets = () => {
  const navigate = useNavigate();
  
  const { data: markets, isLoading } = useQuery({
    queryKey: ['trending-markets'],
    queryFn: async () => {
      // Get markets with highest volume in last 24h
      const { data: pricesData } = await supabase
        .from('prices')
        .select('market_id, volume_24h')
        .gte('recorded_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('volume_24h', { ascending: false })
        .limit(100);

      if (!pricesData?.length) return [];

      // Group by market and sum volumes
      const volumeByMarket = pricesData.reduce((acc, p) => {
        const marketId = p.market_id;
        acc[marketId] = (acc[marketId] || 0) + (Number(p.volume_24h) || 0);
        return acc;
      }, {} as Record<string, number>);

      // Get top 20 market IDs
      const topMarketIds = Object.entries(volumeByMarket)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 20)
        .map(([id]) => id);

      if (!topMarketIds.length) return [];

      // Fetch market details
      const { data: marketsData } = await supabase
        .from('markets')
        .select('id, title, platform, category, resolution_date')
        .in('id', topMarketIds)
        .eq('status', 'active');

      return (marketsData || []).map(m => ({
        ...m,
        totalVolume: volumeByMarket[m.id] || 0,
      })).sort((a, b) => b.totalVolume - a.totalVolume) as TrendingMarket[];
    },
    refetchInterval: 60000,
  });

  const formatVolume = (vol: number): string => {
    if (vol >= 1_000_000) return `$${(vol / 1_000_000).toFixed(1)}M`;
    if (vol >= 1_000) return `$${(vol / 1_000).toFixed(0)}K`;
    return `$${vol.toFixed(0)}`;
  };

  const formatTimeRemaining = (dateStr: string | null): string => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Ended';
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 7) return `${diffDays}d`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w`;
    return `${Math.floor(diffDays / 30)}mo`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!markets?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 border border-border rounded bg-card">
        <TrendingUp className="w-12 h-12 text-muted-foreground mb-4" />
        <h3 className="text-xl font-bold text-foreground mb-2">
          No Trending Data
        </h3>
        <p className="text-muted-foreground text-sm">
          Check back later for trending markets
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {markets.map((market, index) => (
        <div
          key={market.id}
          onClick={() => navigate(`/event/${market.id}`)}
          className="
            flex items-center gap-4 p-4 rounded border border-border bg-card 
            hover:bg-secondary/50 cursor-pointer transition-colors
          "
        >
          {/* Rank */}
          <div className={`
            w-8 h-8 rounded flex items-center justify-center font-bold text-sm
            ${index < 3 
              ? 'bg-accent/20 text-accent' 
              : 'bg-secondary text-muted-foreground'
            }
          `}>
            {index < 3 ? <Flame className="w-4 h-4" /> : index + 1}
          </div>

          {/* Market Info */}
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-foreground truncate">
              {market.title}
            </h4>
            <div className="flex items-center gap-2 mt-1">
              <span className={`
                text-[10px] px-1.5 py-0.5 rounded font-medium
                ${PLATFORM_COLORS[market.platform] || 'bg-secondary text-muted-foreground'}
              `}>
                {market.platform}
              </span>
              <span className="text-[10px] text-muted-foreground uppercase">
                {market.category}
              </span>
            </div>
          </div>

          {/* Volume */}
          <div className="text-right">
            <div className="font-mono font-bold text-accent">
              {formatVolume(market.totalVolume)}
            </div>
            <div className="text-[10px] text-muted-foreground">24h volume</div>
          </div>

          {/* Time */}
          <div className="text-right min-w-[60px]">
            <div className="flex items-center gap-1 text-muted-foreground text-sm font-mono">
              <Clock className="w-3 h-3" />
              {formatTimeRemaining(market.resolution_date)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
