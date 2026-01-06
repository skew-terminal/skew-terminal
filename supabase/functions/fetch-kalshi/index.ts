import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// Kalshi public API base URL (no auth required for market data)
const KALSHI_API_BASE = 'https://api.elections.kalshi.com/trade-api/v2';

interface KalshiMarket {
  ticker: string;
  title: string;
  subtitle?: string;
  status: string;
  yes_bid: number;
  yes_ask: number;
  no_bid: number;
  no_ask: number;
  volume: number;
  volume_24h: number;
  open_interest: number;
  close_time?: string;
  category?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Fetching Kalshi markets data...');

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Fetch markets from Kalshi public API
    const marketsResponse = await fetch(`${KALSHI_API_BASE}/markets?limit=100&status=open`, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!marketsResponse.ok) {
      const errorText = await marketsResponse.text();
      console.error('Kalshi API error:', errorText);
      throw new Error(`Kalshi API error: ${marketsResponse.status}`);
    }

    const marketsData = await marketsResponse.json();
    const markets: KalshiMarket[] = marketsData.markets || [];
    console.log(`Found ${markets.length} markets from Kalshi`);

    // Process and store markets
    const processedMarkets = [];
    const processedPrices = [];

    for (const market of markets) {
      // Map Kalshi category to our categories
      const categoryMap: Record<string, string> = {
        'Politics': 'politics',
        'Economics': 'economics',
        'Science': 'science',
        'Sports': 'sports',
        'Entertainment': 'entertainment',
        'Crypto': 'crypto',
      };

      const marketData = {
        external_id: `kalshi_${market.ticker}`,
        name: market.title,
        description: market.subtitle || market.title,
        platform: 'kalshi' as const,
        chain: null, // Kalshi is centralized
        category: (categoryMap[market.category || ''] || 'other') as 'politics' | 'crypto' | 'sports' | 'entertainment' | 'science' | 'economics' | 'other',
        status: market.status === 'open' ? 'active' as const : 'resolved' as const,
        resolution_date: market.close_time ? new Date(market.close_time).toISOString() : null,
        total_volume: market.volume || 0,
        url: `https://kalshi.com/markets/${market.ticker}`,
      };
      processedMarkets.push(marketData);

      // Calculate mid prices from bid/ask
      const yesPrice = market.yes_bid && market.yes_ask 
        ? (market.yes_bid + market.yes_ask) / 2 / 100 
        : market.yes_bid / 100 || 0;
      const noPrice = market.no_bid && market.no_ask 
        ? (market.no_bid + market.no_ask) / 2 / 100 
        : market.no_bid / 100 || 0;

      processedPrices.push({
        market_external_id: `kalshi_${market.ticker}`,
        platform: 'kalshi' as const,
        yes_price: yesPrice,
        no_price: noPrice,
        volume_24h: market.volume_24h || 0,
      });
    }

    // Upsert markets
    const { error: marketsError } = await supabase
      .from('markets')
      .upsert(processedMarkets, { onConflict: 'external_id' });

    if (marketsError) {
      console.error('Error upserting markets:', marketsError);
    } else {
      console.log(`Upserted ${processedMarkets.length} markets`);
    }

    // Get market IDs for prices
    const { data: storedMarkets } = await supabase
      .from('markets')
      .select('id, external_id')
      .in('external_id', processedMarkets.map(m => m.external_id));

    if (storedMarkets && storedMarkets.length > 0) {
      const marketIdMap = new Map(storedMarkets.map(m => [m.external_id, m.id]));
      
      const pricesToInsert = processedPrices
        .filter(p => marketIdMap.has(p.market_external_id))
        .map(p => ({
          market_id: marketIdMap.get(p.market_external_id),
          platform: p.platform,
          yes_price: p.yes_price,
          no_price: p.no_price,
          volume_24h: p.volume_24h,
        }));

      if (pricesToInsert.length > 0) {
        const { error: pricesError } = await supabase
          .from('prices')
          .insert(pricesToInsert);

        if (pricesError) {
          console.error('Error inserting prices:', pricesError);
        } else {
          console.log(`Inserted ${pricesToInsert.length} price records`);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        markets_found: markets.length,
        markets_stored: processedMarkets.length,
        sample_markets: processedMarkets.slice(0, 5).map(m => ({
          name: m.name,
          category: m.category,
          volume: m.total_volume,
        })),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in fetch-kalshi:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
