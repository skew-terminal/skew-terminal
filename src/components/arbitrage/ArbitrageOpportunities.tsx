import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ExternalLink, Zap, Info, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Spread {
  id: string;
  market_id: string;
  buy_platform: string;
  sell_platform: string;
  buy_price: number;
  sell_price: number;
  skew_percentage: number;
  potential_profit: number;
  is_active: boolean;
  detected_at: string;
  expires_at: string | null;
  market?: {
    id: string;
    title: string;
    category: string;
    resolution_date: string | null;
  };
}

const PLATFORM_COLORS: Record<string, string> = {
  kalshi: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  polymarket: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  manifold: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  predictit: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  azuro: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  metaculus: 'bg-green-500/20 text-green-400 border-green-500/30',
};

export const ArbitrageOpportunities = () => {
  const navigate = useNavigate();
  
  const { data: spreads, isLoading, error } = useQuery({
    queryKey: ['arbitrage-opportunities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('spreads')
        .select(`
          *,
          market:markets!market_id (
            id,
            title,
            category,
            resolution_date
          )
        `)
        .eq('is_active', true)
        .gte('skew_percentage', 2)
        .order('skew_percentage', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as Spread[];
    },
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-destructive gap-2">
        <AlertTriangle className="w-8 h-8" />
        <p>Failed to load opportunities</p>
      </div>
    );
  }

  if (!spreads?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 border border-border rounded bg-card">
        <div className="text-6xl mb-4">🔍</div>
        <h3 className="text-xl font-bold text-foreground mb-2">
          No Arbitrage Opportunities Found
        </h3>
        <p className="text-muted-foreground text-sm mb-4">
          We're constantly scanning. Check back in a few minutes!
        </p>
        <p className="text-xs text-muted-foreground font-mono">
          Last scan: {new Date().toLocaleTimeString()}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {spreads.map((spread) => {
        const buyPrice = Number(spread.buy_price);
        const sellPrice = Number(spread.sell_price);
        const totalCost = buyPrice + (1 - sellPrice);
        const profit = 1 - totalCost;
        const isRare = spread.skew_percentage > 5;
        const isExtreme = spread.skew_percentage > 100;

        return (
          <div
            key={spread.id}
            className={`
              p-5 rounded border transition-all
              ${isRare 
                ? 'bg-gradient-to-br from-destructive/10 to-orange-900/10 border-destructive/30' 
                : 'bg-gradient-to-br from-accent/5 to-emerald-900/10 border-accent/20'
              }
            `}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-3">
                {isRare && (
                  <span className="px-2 py-1 text-xs font-bold bg-destructive text-destructive-foreground rounded">
                    🔥 RARE
                  </span>
                )}
                {isExtreme && (
                  <span className="px-2 py-1 text-xs font-bold bg-yellow-500 text-black rounded flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    VERIFY
                  </span>
                )}
                <div>
                  <h3 className="font-bold text-foreground text-lg">
                    {spread.market?.title || 'Unknown Market'}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Arbitrage Opportunity Detected
                  </p>
                </div>
              </div>

              <div className="text-right">
                <div className={`text-2xl font-mono font-bold ${isRare ? 'text-destructive' : 'text-accent'}`}>
                  {spread.skew_percentage.toFixed(2)}%
                </div>
                <p className="text-xs text-muted-foreground">Guaranteed ROI</p>
              </div>
            </div>

            {/* Strategy */}
            <div className="bg-background/50 rounded p-4 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-accent" />
                <span className="text-sm font-semibold text-foreground">
                  Hedged Betting Strategy
                </span>
              </div>

              <div className="space-y-3">
                {/* Step 1 */}
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-accent/20 text-accent flex items-center justify-center text-xs font-bold">
                    1
                  </div>
                  <div className="flex-1">
                    <span className="text-sm text-foreground">
                      Buy <span className="font-bold text-accent">YES</span> on{' '}
                      <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${PLATFORM_COLORS[spread.buy_platform] || 'bg-secondary'}`}>
                        {spread.buy_platform}
                      </span>
                    </span>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className="font-mono font-bold text-accent text-lg">
                        ${buyPrice.toFixed(3)}
                      </span>
                      <span className="text-xs text-muted-foreground">per share</span>
                    </div>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-destructive/20 text-destructive flex items-center justify-center text-xs font-bold">
                    2
                  </div>
                  <div className="flex-1">
                    <span className="text-sm text-foreground">
                      Buy <span className="font-bold text-destructive">NO</span> on{' '}
                      <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${PLATFORM_COLORS[spread.sell_platform] || 'bg-secondary'}`}>
                        {spread.sell_platform}
                      </span>
                    </span>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className="font-mono font-bold text-foreground text-lg">
                        ${(1 - sellPrice).toFixed(3)}
                      </span>
                      <span className="text-xs text-muted-foreground">per share</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Profit Calculation */}
              <div className="mt-4 pt-4 border-t border-border">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Total Cost</p>
                    <p className="font-mono font-bold text-foreground text-lg">
                      ${totalCost.toFixed(3)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Guaranteed Payout</p>
                    <p className="font-mono font-bold text-foreground text-lg">
                      $1.000
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Pure Profit</p>
                    <p className="font-mono font-bold text-accent text-lg">
                      +${profit.toFixed(3)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-3 flex items-start gap-2 text-xs text-muted-foreground bg-secondary/50 rounded p-2">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  No matter the outcome, you profit ${profit.toFixed(3)} per $1 invested
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button 
                className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground font-bold"
                onClick={() => navigate(`/event/${spread.market_id}`)}
              >
                <Zap className="w-4 h-4 mr-2" />
                Execute Strategy
              </Button>
              <Button 
                variant="outline" 
                className="border-border"
                onClick={() => navigate(`/event/${spread.market_id}`)}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Details
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
