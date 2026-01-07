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
    let marketsUpserted = 0;
    let pricesInserted = 0;

    for (const market of markets) {
      // Map Kalshi category to our categories
      const categoryMap: Record<string, 'politics' | 'crypto' | 'sports' | 'economy' | 'other'> = {
        'Politics': 'politics',
        'Economics': 'economy',
        'Science': 'other',
        'Sports': 'sports',
        'Entertainment': 'other',
        'Crypto': 'crypto',
      };

      const slug = `kalshi-${market.ticker}`;
      
      // Upsert market with correct schema (slug, title)
      const { data: marketData, error: marketError } = await supabase
        .from('markets')
        .upsert({
          slug,
          title: market.title,
          description: market.subtitle || market.title,
          category: categoryMap[market.category || ''] || 'other',
          status: market.status === 'open' ? 'active' : 'resolved',
          resolution_date: market.close_time ? new Date(market.close_time).toISOString() : null,
          updated_at: new Date().toISOString()
        }, { onConflict: 'slug' })
        .select('id')
        .single();

      if (marketError) {
        console.error('Error upserting Kalshi market:', marketError);
        continue;
      }

      marketsUpserted++;

      // Calculate mid prices from bid/ask
      const yesPrice = market.yes_bid && market.yes_ask 
        ? (market.yes_bid + market.yes_ask) / 2 / 100 
        : (market.yes_bid || 50) / 100;
      const noPrice = market.no_bid && market.no_ask 
        ? (market.no_bid + market.no_ask) / 2 / 100 
        : (market.no_bid || 50) / 100;

      // Insert price data
      const { error: priceError } = await supabase.from('prices').insert({
        market_id: marketData.id,
        platform: 'kalshi',
        yes_price: Math.round(yesPrice * 100) / 100,
        no_price: Math.round(noPrice * 100) / 100,
        volume_24h: market.volume_24h || 0,
        total_volume: market.volume || 0
      });

      if (!priceError) pricesInserted++;
    }

    console.log(`Upserted ${marketsUpserted} markets, inserted ${pricesInserted} prices`);

    return new Response(
      JSON.stringify({
        success: true,
        markets_found: markets.length,
        markets_upserted: marketsUpserted,
        prices_inserted: pricesInserted,
        sample_markets: markets.slice(0, 3).map(m => ({
          title: m.title,
          category: m.category,
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
