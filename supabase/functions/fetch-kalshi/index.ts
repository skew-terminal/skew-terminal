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

// Category mapping based on ticker prefix and title
function getCategoryFromTicker(ticker: string, title: string): 'politics' | 'crypto' | 'sports' | 'economics' | 'entertainment' | 'other' {
  const upperTicker = ticker.toUpperCase();
  const upperTitle = title.toUpperCase();
  
  // Politics & Elections
  if (upperTicker.includes('ELECTION') || 
      upperTicker.includes('PRESIDENT') || 
      upperTicker.includes('TRUMP') ||
      upperTicker.includes('BIDEN') ||
      upperTicker.includes('CONGRESS') ||
      upperTicker.startsWith('KXELECT') ||
      upperTitle.includes('ELECTION') ||
      upperTitle.includes('PRESIDENT') ||
      upperTitle.includes('TRUMP') ||
      upperTitle.includes('BIDEN')) {
    return 'politics';
  }
  
  // Crypto
  if (upperTicker.includes('BTC') || 
      upperTicker.includes('ETH') || 
      upperTicker.includes('CRYPTO') ||
      upperTicker.includes('BITCOIN') ||
      upperTicker.includes('ETHEREUM') ||
      upperTicker.startsWith('KXBTC') ||
      upperTicker.startsWith('KXETH') ||
      upperTitle.includes('BITCOIN') ||
      upperTitle.includes('ETHEREUM') ||
      upperTitle.includes('CRYPTO')) {
    return 'crypto';
  }
  
  // Sports
  if (upperTicker.includes('NBA') || 
      upperTicker.includes('NFL') || 
      upperTicker.includes('MLB') ||
      upperTicker.includes('SPORTS') ||
      upperTicker.includes('SUPER') ||
      upperTicker.startsWith('KXNBA') ||
      upperTicker.startsWith('KXNFL') ||
      upperTicker.startsWith('KXMLB') ||
      upperTitle.includes(' NBA ') ||
      upperTitle.includes(' NFL ') ||
      upperTitle.includes(' MLB ') ||
      upperTitle.includes('SUPERBOWL') ||
      upperTitle.includes('SUPER BOWL') ||
      upperTitle.includes('WINS BY') ||
      upperTitle.includes('POINTS SCORED') ||
      upperTitle.includes('BOSTON') ||
      upperTitle.includes('LAKERS') ||
      upperTitle.includes('CELTICS')) {
    return 'sports';
  }
  
  // Economics
  if (upperTicker.includes('FED') || 
      upperTicker.includes('GDP') || 
      upperTicker.includes('INFLATION') ||
      upperTicker.includes('RATE') ||
      upperTicker.includes('RECESSION') ||
      upperTicker.startsWith('KXFED') ||
      upperTicker.startsWith('KXGDP') ||
      upperTitle.includes('INFLATION') ||
      upperTitle.includes('UNEMPLOYMENT') ||
      upperTitle.includes('GDP') ||
      upperTitle.includes('INTEREST RATE') ||
      upperTitle.includes('RECESSION')) {
    return 'economics';
  }
  
  // Entertainment
  if (upperTicker.includes('OSCAR') ||
      upperTicker.includes('EMMY') ||
      upperTitle.includes('OSCAR') ||
      upperTitle.includes('EMMY') ||
      upperTitle.includes('MOVIE') ||
      upperTitle.includes('GRAMMY')) {
    return 'entertainment';
  }
  
  return 'other';
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
      const category = getCategoryFromTicker(market.ticker, market.title);
      const slug = `kalshi-${market.ticker}`;
      
      // Upsert market with correct schema (slug, title)
      const { data: marketData, error: marketError } = await supabase
        .from('markets')
        .upsert({
          slug,
          title: market.title,
          description: market.subtitle || market.title,
          category,
          platform: 'kalshi',
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
