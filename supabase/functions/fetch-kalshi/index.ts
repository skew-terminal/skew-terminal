import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// Kalshi public API base URL
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
  event_ticker?: string;
}

// Category configurations for fetching
const CATEGORY_CONFIGS = [
  { 
    name: 'politics', 
    seriesTickers: ['KXELECTION', 'KXPRES', 'KXCONGRESS', 'KXGOV'],
    limit: 50 
  },
  { 
    name: 'crypto', 
    seriesTickers: ['KXBTC', 'KXETH', 'KXCRYPTO'],
    limit: 50 
  },
  { 
    name: 'economics', 
    seriesTickers: ['KXFED', 'KXGDP', 'KXINFLATION', 'KXRATE', 'KXCPI'],
    limit: 50 
  },
  { 
    name: 'sports', 
    seriesTickers: ['KXNFL', 'KXNBA', 'KXMLB', 'KXSUPERBOWL'],
    limit: 50 
  }
];

// Category mapping based on ticker prefix and title
function getCategoryFromTicker(ticker: string, title: string): 'politics' | 'crypto' | 'sports' | 'economics' | 'entertainment' | 'other' {
  const upperTicker = ticker.toUpperCase();
  const upperTitle = title.toUpperCase();
  
  // Politics & Elections
  if (upperTicker.includes('ELECTION') || 
      upperTicker.includes('PRESIDENT') || 
      upperTicker.includes('PRES') ||
      upperTicker.includes('TRUMP') ||
      upperTicker.includes('BIDEN') ||
      upperTicker.includes('CONGRESS') ||
      upperTicker.includes('GOV') ||
      upperTitle.includes('ELECTION') ||
      upperTitle.includes('PRESIDENT') ||
      upperTitle.includes('TRUMP') ||
      upperTitle.includes('BIDEN') ||
      upperTitle.includes('GOVERNOR') ||
      upperTitle.includes('SENATE') ||
      upperTitle.includes('CONGRESS')) {
    return 'politics';
  }
  
  // Crypto
  if (upperTicker.includes('BTC') || 
      upperTicker.includes('ETH') || 
      upperTicker.includes('CRYPTO') ||
      upperTicker.includes('BITCOIN') ||
      upperTicker.includes('ETHEREUM') ||
      upperTitle.includes('BITCOIN') ||
      upperTitle.includes('ETHEREUM') ||
      upperTitle.includes('CRYPTO') ||
      upperTitle.includes('BTC') ||
      upperTitle.includes('ETH')) {
    return 'crypto';
  }
  
  // Economics
  if (upperTicker.includes('FED') || 
      upperTicker.includes('GDP') || 
      upperTicker.includes('INFLATION') ||
      upperTicker.includes('RATE') ||
      upperTicker.includes('RECESSION') ||
      upperTicker.includes('CPI') ||
      upperTitle.includes('INFLATION') ||
      upperTitle.includes('UNEMPLOYMENT') ||
      upperTitle.includes('GDP') ||
      upperTitle.includes('INTEREST RATE') ||
      upperTitle.includes('RECESSION') ||
      upperTitle.includes('FEDERAL RESERVE') ||
      upperTitle.includes('CPI')) {
    return 'economics';
  }
  
  // Sports
  if (upperTicker.includes('NBA') || 
      upperTicker.includes('NFL') || 
      upperTicker.includes('MLB') ||
      upperTicker.includes('SPORTS') ||
      upperTicker.includes('SUPER') ||
      upperTitle.includes('SUPER BOWL') ||
      upperTitle.includes('SUPERBOWL') ||
      upperTitle.includes('NFL') ||
      upperTitle.includes('NBA') ||
      upperTitle.includes('MLB') ||
      upperTitle.includes('WORLD SERIES') ||
      upperTitle.includes('CHAMPIONSHIP')) {
    return 'sports';
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

// Fetch markets from a specific endpoint
async function fetchMarkets(url: string): Promise<KalshiMarket[]> {
  try {
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
    });
    
    if (!response.ok) {
      console.error(`Kalshi API error for ${url}: ${response.status}`);
      return [];
    }
    
    const data = await response.json();
    return data.markets || [];
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
    return [];
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Fetching Kalshi markets from multiple categories...');

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    const allMarkets: KalshiMarket[] = [];
    const categoryStats: Record<string, number> = {};

    // 1. Fetch general markets (top 100 by volume)
    console.log('Fetching general markets...');
    const generalMarkets = await fetchMarkets(
      `${KALSHI_API_BASE}/markets?limit=100&status=open`
    );
    allMarkets.push(...generalMarkets);
    categoryStats['general'] = generalMarkets.length;
    console.log(`Got ${generalMarkets.length} general markets`);

    // 2. Try to fetch from specific event tickers for more variety
    const eventTickers = [
      'TRUMPPOPVOTE', 'PRES', 'SENATE', 'GOVERNOR',  // Politics
      'BTCMAX', 'BTCMIN', 'ETHMAX',                   // Crypto
      'FEDFUNDS', 'CPI', 'UNEMPLOYMENT',              // Economics
      'SUPERBOWL', 'NFLPLAYOFFS'                      // Sports
    ];

    for (const eventTicker of eventTickers) {
      try {
        const markets = await fetchMarkets(
          `${KALSHI_API_BASE}/markets?limit=20&status=open&event_ticker=${eventTicker}`
        );
        if (markets.length > 0) {
          allMarkets.push(...markets);
          categoryStats[eventTicker] = markets.length;
          console.log(`Got ${markets.length} markets for ${eventTicker}`);
        }
      } catch (e) {
        // Silently skip if event ticker doesn't exist
      }
    }

    // Deduplicate by ticker and filter out obvious parlays
    const uniqueMarkets = new Map<string, KalshiMarket>();
    for (const market of allMarkets) {
      if (!uniqueMarkets.has(market.ticker)) {
        // Skip obvious parlays (MULTIGAME in ticker or multiple comma-separated items)
        const commaCount = (market.title.match(/,/g) || []).length;
        const isParlay = market.ticker.includes('MULTIGAME') ||
                         market.ticker.includes('PARLAY') ||
                         commaCount > 3; // More than 3 commas = likely parlay
        
        if (!isParlay) {
          uniqueMarkets.set(market.ticker, market);
        }
      }
    }

    const markets = Array.from(uniqueMarkets.values());
    console.log(`Total unique markets: ${markets.length}`);

    // Process and store markets
    let marketsUpserted = 0;
    let pricesInserted = 0;
    const categoryCounts: Record<string, number> = {};

    for (const market of markets) {
      const category = getCategoryFromTicker(market.ticker, market.title);
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      
      const slug = `kalshi-${market.ticker}`;
      
      // Upsert market
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
        console.error('Error upserting market:', marketError.message);
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
        yes_price: Math.max(0.01, Math.min(0.99, yesPrice)),
        no_price: Math.max(0.01, Math.min(0.99, noPrice)),
        volume_24h: market.volume_24h || 0,
        total_volume: market.volume || 0
      });

      if (!priceError) pricesInserted++;
    }

    console.log(`Upserted ${marketsUpserted} markets, inserted ${pricesInserted} prices`);
    console.log('Category distribution:', categoryCounts);

    return new Response(
      JSON.stringify({
        success: true,
        total_fetched: allMarkets.length,
        unique_markets: markets.length,
        markets_upserted: marketsUpserted,
        prices_inserted: pricesInserted,
        category_distribution: categoryCounts,
        fetch_stats: categoryStats
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
