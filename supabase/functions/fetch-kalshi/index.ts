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

// Sleep function for rate limiting
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

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

// Fetch markets with retry logic for rate limiting
async function fetchWithRetry(url: string, maxRetries = 3): Promise<KalshiMarket[]> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        headers: { 'Accept': 'application/json' },
      });
      
      if (response.status === 429) {
        const waitTime = Math.pow(2, attempt) * 2000; // Exponential backoff: 2s, 4s, 8s
        console.log(`Rate limited (429), waiting ${waitTime/1000}s before retry ${attempt + 1}/${maxRetries}...`);
        await sleep(waitTime);
        continue;
      }
      
      if (!response.ok) {
        console.error(`Kalshi API error for ${url}: ${response.status}`);
        return [];
      }
      
      const data = await response.json();
      return data.markets || [];
    } catch (error) {
      console.error(`Error fetching ${url} (attempt ${attempt + 1}):`, error);
      if (attempt < maxRetries - 1) {
        await sleep(2000);
      }
    }
  }
  return [];
}

// Fetch markets in batches with delays
async function fetchInBatches(
  baseUrl: string, 
  totalLimit: number, 
  batchSize: number = 50,
  delayBetweenBatches: number = 1500
): Promise<KalshiMarket[]> {
  const results: KalshiMarket[] = [];
  
  for (let offset = 0; offset < totalLimit; offset += batchSize) {
    const url = `${baseUrl}&limit=${batchSize}&offset=${offset}`;
    console.log(`Fetching batch: offset=${offset}, limit=${batchSize}`);
    
    const batch = await fetchWithRetry(url);
    results.push(...batch);
    
    if (batch.length < batchSize) {
      // No more results
      break;
    }
    
    // Pause between batches to avoid rate limiting
    if (offset + batchSize < totalLimit) {
      console.log(`Pausing ${delayBetweenBatches}ms before next batch...`);
      await sleep(delayBetweenBatches);
    }
  }
  
  return results;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Fetching Kalshi markets with rate limit handling...');

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    const allMarkets: KalshiMarket[] = [];
    const categoryStats: Record<string, number> = {};

    // 1. Fetch general markets in batches (200 total, 50 per batch)
    console.log('Fetching general markets in batches...');
    const generalMarkets = await fetchInBatches(
      `${KALSHI_API_BASE}/markets?status=open`,
      200, // total limit
      50,  // batch size
      1500 // 1.5s between batches
    );
    allMarkets.push(...generalMarkets);
    categoryStats['general'] = generalMarkets.length;
    console.log(`Got ${generalMarkets.length} general markets`);

    // 2. Fetch from specific event tickers with delays
    const eventTickers = [
      'TRUMPPOPVOTE', 'PRES', 'SENATE', 'GOVERNOR',  // Politics
      'BTCMAX', 'BTCMIN', 'ETHMAX',                   // Crypto
      'FEDFUNDS', 'CPI', 'UNEMPLOYMENT',              // Economics
      'SUPERBOWL', 'NFLPLAYOFFS'                      // Sports
    ];

    console.log('Fetching specific event tickers...');
    for (let i = 0; i < eventTickers.length; i++) {
      const eventTicker = eventTickers[i];
      
      // Delay between event ticker requests
      if (i > 0) {
        await sleep(1000); // 1s between each event ticker
      }
      
      const markets = await fetchWithRetry(
        `${KALSHI_API_BASE}/markets?limit=30&status=open&event_ticker=${eventTicker}`
      );
      
      if (markets.length > 0) {
        allMarkets.push(...markets);
        categoryStats[eventTicker] = markets.length;
        console.log(`Got ${markets.length} markets for ${eventTicker}`);
      }
    }

    // Deduplicate by ticker and filter out obvious parlays
    const uniqueMarkets = new Map<string, KalshiMarket>();
    for (const market of allMarkets) {
      if (!uniqueMarkets.has(market.ticker)) {
        const commaCount = (market.title.match(/,/g) || []).length;
        const isParlay = market.ticker.includes('MULTIGAME') ||
                         market.ticker.includes('PARLAY') ||
                         commaCount > 3;
        
        if (!isParlay) {
          uniqueMarkets.set(market.ticker, market);
        }
      }
    }

    const markets = Array.from(uniqueMarkets.values());
    console.log(`Total unique markets: ${markets.length}`);

    // Process and store markets with batching
    let marketsUpserted = 0;
    let pricesInserted = 0;
    const categoryCounts: Record<string, number> = {};

    for (let i = 0; i < markets.length; i++) {
      const market = markets[i];
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

      // Progress logging every 50 markets
      if ((i + 1) % 50 === 0) {
        console.log(`Processed ${i + 1}/${markets.length} markets...`);
      }
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
