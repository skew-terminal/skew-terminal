import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface MarketData {
  id: string;
  slug: string;
  title: string;
  category: string;
}

interface PriceData {
  id: string;
  market_id: string;
  platform: string;
  yes_price: number;
  no_price: number;
  volume_24h: number;
  recorded_at: string;
  market: MarketData;
}

interface SpreadOpportunity {
  market_id: string;
  buy_platform: string;
  sell_platform: string;
  buy_price: number;
  sell_price: number;
  skew_percentage: number;
  potential_profit: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    console.log('Calculating arbitrage spreads across platforms...');

    // Get latest prices for each market-platform combination
    const { data: prices, error: pricesError } = await supabase
      .from('prices')
      .select(`
        id,
        market_id,
        platform,
        yes_price,
        no_price,
        volume_24h,
        recorded_at,
        market:markets!inner(id, slug, title, category)
      `)
      .order('recorded_at', { ascending: false });

    if (pricesError) {
      throw new Error(`Failed to fetch prices: ${pricesError.message}`);
    }

    console.log(`Fetched ${prices?.length || 0} price records`);

    // Group prices by market slug (to match similar markets across platforms)
    const marketPrices = new Map<string, PriceData[]>();
    
    // Also create a title-based matching for cross-platform comparison
    const titleMatches = new Map<string, PriceData[]>();
    
    for (const priceRow of prices || []) {
      // Handle Supabase's array return for joined relations
      const marketArr = priceRow.market as unknown as MarketData[];
      const market = Array.isArray(marketArr) ? marketArr[0] : marketArr;
      if (!market) continue;
      
      const price: PriceData = {
        ...priceRow,
        market
      };

      // Group by exact market_id
      const marketId = price.market_id;
      if (!marketPrices.has(marketId)) {
        marketPrices.set(marketId, []);
      }
      marketPrices.get(marketId)!.push(price);

      // Also group by normalized title for fuzzy matching
      const normalizedTitle = normalizeTitle(market.title);
      if (!titleMatches.has(normalizedTitle)) {
        titleMatches.set(normalizedTitle, []);
      }
      titleMatches.get(normalizedTitle)!.push(price);
    }

    const opportunities: SpreadOpportunity[] = [];

    // Find arbitrage opportunities within same market (different platforms)
    for (const [marketId, priceList] of marketPrices) {
      // Get latest price per platform
      const latestByPlatform = getLatestByPlatform(priceList);
      
      if (latestByPlatform.size < 2) continue;

      // Compare all platform pairs
      const platforms = Array.from(latestByPlatform.keys());
      
      for (let i = 0; i < platforms.length; i++) {
        for (let j = i + 1; j < platforms.length; j++) {
          const p1 = latestByPlatform.get(platforms[i])!;
          const p2 = latestByPlatform.get(platforms[j])!;
          
          // Check YES arbitrage: buy YES on cheaper, sell on expensive
          const yesSpread = findYesArbitrage(p1, p2, marketId);
          if (yesSpread) opportunities.push(yesSpread);
          
          // Check NO arbitrage
          const noSpread = findNoArbitrage(p1, p2, marketId);
          if (noSpread) opportunities.push(noSpread);
        }
      }
    }

    // Also check title-based matches (for similar events across platforms)
    for (const [title, priceList] of titleMatches) {
      const latestByPlatform = getLatestByPlatform(priceList);
      
      if (latestByPlatform.size < 2) continue;

      const platforms = Array.from(latestByPlatform.keys());
      
      for (let i = 0; i < platforms.length; i++) {
        for (let j = i + 1; j < platforms.length; j++) {
          const p1 = latestByPlatform.get(platforms[i])!;
          const p2 = latestByPlatform.get(platforms[j])!;
          
          // Use first market_id as reference
          const refMarketId = p1.market_id;
          
          const yesSpread = findYesArbitrage(p1, p2, refMarketId);
          if (yesSpread && !isDuplicate(opportunities, yesSpread)) {
            opportunities.push(yesSpread);
          }
        }
      }
    }

    console.log(`Found ${opportunities.length} arbitrage opportunities`);

    // Filter for significant opportunities (>1% skew)
    const significantOpps = opportunities.filter(opp => opp.skew_percentage > 1);
    
    console.log(`${significantOpps.length} opportunities with >1% skew`);

    // Deactivate old spreads
    await supabase
      .from('spreads')
      .update({ is_active: false })
      .eq('is_active', true);

    // Insert new spreads
    if (significantOpps.length > 0) {
      const { error: insertError } = await supabase
        .from('spreads')
        .insert(significantOpps.map(opp => ({
          market_id: opp.market_id,
          buy_platform: opp.buy_platform,
          sell_platform: opp.sell_platform,
          buy_price: opp.buy_price,
          sell_price: opp.sell_price,
          skew_percentage: opp.skew_percentage,
          potential_profit: opp.potential_profit,
          is_active: true,
          detected_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 min expiry
        })));

      if (insertError) {
        console.error('Error inserting spreads:', insertError);
      }
    }

    // Get top opportunities for response
    const topOpps = significantOpps
      .sort((a, b) => b.skew_percentage - a.skew_percentage)
      .slice(0, 10);

    return new Response(
      JSON.stringify({
        success: true,
        total_opportunities: opportunities.length,
        significant_opportunities: significantOpps.length,
        top_spreads: topOpps,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in calculate-spreads:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Helper functions

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .slice(0, 5) // First 5 words
    .join(' ');
}

function getLatestByPlatform(prices: PriceData[]): Map<string, PriceData> {
  const latest = new Map<string, PriceData>();
  
  for (const price of prices) {
    const existing = latest.get(price.platform);
    if (!existing || new Date(price.recorded_at) > new Date(existing.recorded_at)) {
      latest.set(price.platform, price);
    }
  }
  
  return latest;
}

function findYesArbitrage(p1: PriceData, p2: PriceData, marketId: string): SpreadOpportunity | null {
  // Buy YES where cheaper, sell where more expensive
  const buyP1 = p1.yes_price < p2.yes_price;
  const buyPrice = buyP1 ? p1.yes_price : p2.yes_price;
  const sellPrice = buyP1 ? p2.yes_price : p1.yes_price;
  const buyPlatform = buyP1 ? p1.platform : p2.platform;
  const sellPlatform = buyP1 ? p2.platform : p1.platform;
  
  const skew = ((sellPrice - buyPrice) / buyPrice) * 100;
  
  if (skew <= 0) return null;
  
  // Potential profit per $100 bet
  const potentialProfit = (sellPrice - buyPrice) * 100;
  
  return {
    market_id: marketId,
    buy_platform: buyPlatform,
    sell_platform: sellPlatform,
    buy_price: buyPrice,
    sell_price: sellPrice,
    skew_percentage: Math.round(skew * 100) / 100,
    potential_profit: Math.round(potentialProfit * 100) / 100
  };
}

function findNoArbitrage(p1: PriceData, p2: PriceData, marketId: string): SpreadOpportunity | null {
  // Buy NO where cheaper, sell where more expensive
  const buyP1 = p1.no_price < p2.no_price;
  const buyPrice = buyP1 ? p1.no_price : p2.no_price;
  const sellPrice = buyP1 ? p2.no_price : p1.no_price;
  const buyPlatform = buyP1 ? p1.platform : p2.platform;
  const sellPlatform = buyP1 ? p2.platform : p1.platform;
  
  const skew = ((sellPrice - buyPrice) / buyPrice) * 100;
  
  if (skew <= 0) return null;
  
  const potentialProfit = (sellPrice - buyPrice) * 100;
  
  return {
    market_id: marketId,
    buy_platform: buyPlatform,
    sell_platform: sellPlatform,
    buy_price: buyPrice,
    sell_price: sellPrice,
    skew_percentage: Math.round(skew * 100) / 100,
    potential_profit: Math.round(potentialProfit * 100) / 100
  };
}

function isDuplicate(opportunities: SpreadOpportunity[], newOpp: SpreadOpportunity): boolean {
  return opportunities.some(opp => 
    opp.buy_platform === newOpp.buy_platform &&
    opp.sell_platform === newOpp.sell_platform &&
    Math.abs(opp.skew_percentage - newOpp.skew_percentage) < 0.1
  );
}
