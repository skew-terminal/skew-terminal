import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ChevronRight, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const CATEGORIES = ['all', 'politics', 'crypto', 'sports', 'economy', 'other'] as const;
type CategoryFilter = typeof CATEGORIES[number];

const PLATFORM_COLORS: Record<string, string> = {
  kalshi: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  polymarket: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  manifold: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  predictit: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  azuro: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  metaculus: 'bg-green-500/20 text-green-400 border-green-500/30',
};

interface MarketWithPrices {
  id: string;
  title: string;
  slug: string;
  category: string;
  platform: string;
  resolution_date: string | null;
  prices: {
    yes_price: number;
    no_price: number;
    volume_24h: number;
    platform: string;
  }[];
}

export const MarketsTable = () => {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const navigate = useNavigate();

  const { data: markets, isLoading } = useQuery({
    queryKey: ['markets-table', category],
    queryFn: async () => {
      let query = supabase
        .from('markets')
        .select(`
          id,
          title,
          slug,
          category,
          platform,
          resolution_date,
          prices (
            yes_price,
            no_price,
            volume_24h,
            platform
          )
        `)
        .eq('status', 'active')
        .order('updated_at', { ascending: false })
        .limit(100);

      if (category !== 'all') {
        query = query.eq('category', category as 'crypto' | 'economy' | 'other' | 'politics' | 'sports');
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as MarketWithPrices[];
    },
    refetchInterval: 60000,
  });

  const filteredMarkets = useMemo(() => {
    if (!markets) return [];
    if (!search) return markets;
    
    const searchLower = search.toLowerCase();
    return markets.filter(m => 
      m.title.toLowerCase().includes(searchLower) ||
      m.platform.toLowerCase().includes(searchLower)
    );
  }, [markets, search]);

  const getLatestPrice = (prices: MarketWithPrices['prices']) => {
    if (!prices || prices.length === 0) return { yes: 0.5, no: 0.5, volume: 0 };
    const latest = prices[0];
    return {
      yes: Number(latest.yes_price) || 0.5,
      no: Number(latest.no_price) || 0.5,
      volume: Number(latest.volume_24h) || 0,
    };
  };

  const formatVolume = (vol: number): string => {
    if (vol >= 1_000_000) return `$${(vol / 1_000_000).toFixed(1)}M`;
    if (vol >= 1_000) return `$${(vol / 1_000).toFixed(0)}K`;
    if (vol > 0) return `$${vol.toFixed(0)}`;
    return '-';
  };

  const formatDate = (dateStr: string | null): string => {
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

  const handleRowClick = (market: MarketWithPrices) => {
    navigate(`/event/${market.id}`);
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search markets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-card border-border"
          />
        </div>

        <div className="flex gap-1 flex-wrap">
          {CATEGORIES.map(cat => (
            <Button
              key={cat}
              size="sm"
              variant={category === cat ? "default" : "outline"}
              onClick={() => setCategory(cat)}
              className={`text-xs ${category === cat ? 'bg-primary text-primary-foreground' : ''}`}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="border border-border rounded bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border">
              <TableHead className="text-muted-foreground text-[10px] uppercase tracking-wider w-[40%]">Event</TableHead>
              <TableHead className="text-muted-foreground text-[10px] uppercase tracking-wider">Platform</TableHead>
              <TableHead className="text-muted-foreground text-[10px] uppercase tracking-wider text-right">YES Price</TableHead>
              <TableHead className="text-muted-foreground text-[10px] uppercase tracking-wider text-right">NO Price</TableHead>
              <TableHead className="text-muted-foreground text-[10px] uppercase tracking-wider text-right">Volume (24h)</TableHead>
              <TableHead className="text-muted-foreground text-[10px] uppercase tracking-wider text-right">Ends</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                    Loading markets...
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredMarkets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  No markets found
                </TableCell>
              </TableRow>
            ) : (
              filteredMarkets.map((market, i) => {
                const price = getLatestPrice(market.prices);
                return (
                  <TableRow 
                    key={market.id}
                    className={`
                      cursor-pointer border-border hover:bg-secondary/50 transition-colors
                      ${i % 2 === 0 ? 'bg-transparent' : 'bg-white/[0.02]'}
                    `}
                    onClick={() => handleRowClick(market)}
                  >
                    <TableCell className="py-3">
                      <div className="flex flex-col gap-1">
                        <span className="font-medium text-foreground line-clamp-1">
                          {market.title}
                        </span>
                        <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-secondary text-muted-foreground w-fit">
                          {market.category}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`
                        text-xs px-2 py-1 rounded border font-medium
                        ${PLATFORM_COLORS[market.platform] || 'bg-secondary text-secondary-foreground border-border'}
                      `}>
                        {market.platform}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono text-accent font-semibold">
                      ${price.yes.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground">
                      ${price.no.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground">
                      {formatVolume(price.volume)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground text-sm">
                      {formatDate(market.resolution_date)}
                    </TableCell>
                    <TableCell>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Results count */}
      {!isLoading && filteredMarkets.length > 0 && (
        <div className="text-xs text-muted-foreground text-right">
          Showing {filteredMarkets.length} markets
        </div>
      )}
    </div>
  );
};
