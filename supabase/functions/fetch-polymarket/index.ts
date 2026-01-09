import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Priority categories to fetch first (matching for arbitrage)
const PRIORITY_TAGS = [
  'politics',
  'us-politics',
  'elections',
  'crypto',
  'bitcoin',
  'ethereum',
  'economics',
  'finance',
  'fed',
  'world',
  'global'
];

// Minimum volume filter ($10,000)
const MIN_VOLUME = 10000;

// Map Polymarket category to our internal categories
function mapCategory(market: any): 'politics' | 'crypto' | 'sports' | 'economics' | 'entertainment' | 'other' {
  const polyCategory = (market.category || market.tags?.[0] || '').toLowerCase();
  const title = (market.question || market.title || '').toLowerCase();
  
  // Check title + category for better matching
  const combined = `${polyCategory} ${title}`;
  
  if (combined.includes('politic') || combined.includes('election') || 
      combined.includes('trump') || combined.includes('biden') ||
      combined.includes('president') || combined.includes('congress') ||
      combined.includes('senate') || combined.includes('republican') ||
      combined.includes('democrat') || combined.includes('vote')) {
    return 'politics';
  }
  
  if (combined.includes('crypto') || combined.includes('bitcoin') || 
      combined.includes('btc') || combined.includes('ethereum') ||
      combined.includes('eth') || combined.includes('solana') ||
      combined.includes('defi') || combined.includes('nft')) {
    return 'crypto';
  }
  
  if (combined.includes('sport') || combined.includes('nfl') || 
      combined.includes('nba') || combined.includes('mlb') ||
      combined.includes('super bowl') || combined.includes('world cup') ||
      combined.includes('championship') || combined.includes('playoffs')) {
    return 'sports';
  }
  
  if (combined.includes('econom') || combined.includes('finance') || 
      combined.includes('fed') || combined.includes('inflation') ||
      combined.includes('recession') || combined.includes('gdp') ||
      combined.includes('interest rate') || combined.includes('stock') ||
      combined.includes('market')) {
    return 'economics';
  }
  
  if (combined.includes('entertain') || combined.includes('oscar') || 
      combined.includes('grammy') || combined.includes('emmy') ||
      combined.includes('celebrity') || combined.includes('movie')) {
    return 'entertainment';
  }
  
  return 'other';
}

// Check if market has priority category
function isPriorityMarket(market: any): boolean {
  const tags = market.tags || [];
  const category = (market.category || '').toLowerCase();
  const title = (market.question || market.title || '').toLowerCase();
  
  // Check tags
  for (const tag of tags) {
    if (PRIORITY_TAGS.some(p => tag.toLowerCase().includes(p))) {
      return true;
    }
  }
  
  // Check category and title
  return PRIORITY_TAGS.some(p => category.includes(p) || title.includes(p));
}

// Get volume from market
function getVolume(market: any): number {
  return parseFloat(market.volumeNum || market.volume || market.volume24hr || '0') || 0;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Fetching Polymarket markets with priority categories...');
    
    // Fetch more markets (200 limit)
    const marketsResponse = await fetch('https://gamma-api.polymarket.com/markets?closed=false&limit=500');
    
    if (!marketsResponse.ok) {
      throw new Error(`Polymarket API error: ${marketsResponse.status}`);
    }
    
    const allMarkets = await marketsResponse.json();
    console.log(`Received ${allMarkets.length} total markets from Polymarket`);
    
    // Filter by minimum volume
    const highVolumeMarkets = allMarkets.filter((m: any) => getVolume(m) >= MIN_VOLUME);
    console.log(`${highVolumeMarkets.length} markets with volume >= $${MIN_VOLUME.toLocaleString()}`);
    
    // Sort: priority categories first, then by volume
    const sortedMarkets = highVolumeMarkets.sort((a: any, b: any) => {
      const aPriority = isPriorityMarket(a) ? 1 : 0;
      const bPriority = isPriorityMarket(b) ? 1 : 0;
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority; // Priority first
      }
      
      return getVolume(b) - getVolume(a); // Then by volume
    });
    
    // Take top 200
    const marketsToProcess = sortedMarkets.slice(0, 200);
    
    const priorityCount = marketsToProcess.filter((m: any) => isPriorityMarket(m)).length;
    console.log(`Processing ${marketsToProcess.length} markets (${priorityCount} priority)`);
    
    let savedMarkets = 0;
    let savedPrices = 0;
    const categoryStats: Record<string, number> = {};
    
    // Process markets
    for (const market of marketsToProcess) {
      try {
        const category = mapCategory(market);
        categoryStats[category] = (categoryStats[category] || 0) + 1;

        // Create a unique slug from the market
        const slug = `polymarket-${market.id || market.conditionId || market.slug}`;
        const title = market.question || market.title || 'Unknown Market';

        // Upsert market to database
        const { data: savedMarket, error: marketError } = await supabase
          .from('markets')
          .upsert({
            slug: slug,
            title: title,
            category: category,
            status: 'active',
            platform: 'polymarket',
            resolution_date: market.endDate || market.end_date_iso || null,
            description: market.description || null,
            image_url: market.image || null,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'slug'
          })
          .select()
          .single();

        if (marketError) {
          console.error('Error saving market:', marketError.message);
          continue;
        }

        savedMarkets++;

        // Get prices from market data
        let yesPrice = 0.5;
        let noPrice = 0.5;
        
        // Try to get prices from outcomePrices array
        if (market.outcomePrices && Array.isArray(market.outcomePrices) && market.outcomePrices.length >= 2) {
          yesPrice = parseFloat(market.outcomePrices[0]) || 0.5;
          noPrice = parseFloat(market.outcomePrices[1]) || 0.5;
        } else if (market.bestBid !== undefined && market.bestAsk !== undefined) {
          yesPrice = (parseFloat(market.bestBid) + parseFloat(market.bestAsk)) / 2;
          noPrice = 1 - yesPrice;
        }

        // Ensure prices are valid
        yesPrice = Math.max(0.01, Math.min(0.99, yesPrice));
        noPrice = Math.max(0.01, Math.min(0.99, noPrice));

        // Insert price record
        const { error: priceError } = await supabase
          .from('prices')
          .insert({
            market_id: savedMarket.id,
            platform: 'polymarket',
            yes_price: yesPrice,
            no_price: noPrice,
            volume_24h: parseFloat(market.volume24hr || market.volume || '0') || 0,
            total_volume: getVolume(market),
            recorded_at: new Date().toISOString()
          });

        if (priceError) {
          console.error('Error saving price:', priceError.message);
        } else {
          savedPrices++;
        }

      } catch (error) {
        console.error('Error processing market:', error);
      }
    }

    console.log(`Successfully saved ${savedMarkets} markets and ${savedPrices} prices`);
    console.log('Category breakdown:', categoryStats);

    return new Response(
      JSON.stringify({ 
        success: true, 
        markets_fetched: allMarkets.length,
        high_volume_markets: highVolumeMarkets.length,
        priority_markets: priorityCount,
        markets_saved: savedMarkets,
        prices_saved: savedPrices,
        categories: categoryStats,
        min_volume_filter: MIN_VOLUME
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in fetch-polymarket:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
