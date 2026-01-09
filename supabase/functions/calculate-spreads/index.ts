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

// Parlay detection patterns
const PARLAY_PATTERNS = [
  /(.+)\s+AND\s+(.+)/i,           // "Lakers AND Celtics win"
  /(.+)\s+&\s+(.+)/i,             // "Lakers & Celtics"
  /(.+),\s*(.+)\s+both\s+win/i,   // "Lakers, Celtics both win"
  /parlay[:\s]+(.+)/i,            // "Parlay: ..."
];

// Team name normalization for matching
const TEAM_ALIASES: Record<string, string[]> = {
  'lakers': ['los angeles lakers', 'la lakers'],
  'celtics': ['boston celtics'],
  'warriors': ['golden state warriors', 'gs warriors', 'gsw'],
  'bucks': ['milwaukee bucks'],
  'nuggets': ['denver nuggets'],
  'heat': ['miami heat'],
  'suns': ['phoenix suns'],
  'eagles': ['philadelphia eagles', 'philly eagles'],
  'chiefs': ['kansas city chiefs', 'kc chiefs'],
  'bills': ['buffalo bills'],
  'ravens': ['baltimore ravens'],
  'lions': ['detroit lions'],
  'cowboys': ['dallas cowboys'],
  'packers': ['green bay packers', 'gb packers'],
};

// Extract parlay components from title
function extractParlayComponents(title: string): string[] | null {
  for (const pattern of PARLAY_PATTERNS) {
    const match = title.match(pattern);
    if (match) {
      return match.slice(1).map(s => s.trim().toLowerCase());
    }
  }
  return null;
}

// Normalize team name for matching
function normalizeTeam(name: string): string {
  const lower = name.toLowerCase().trim();
  
  for (const [canonical, aliases] of Object.entries(TEAM_ALIASES)) {
    if (lower.includes(canonical) || aliases.some(a => lower.includes(a))) {
      return canonical;
    }
  }
  
  const winMatch = lower.match(/(.+?)\s+win/);
  if (winMatch) return winMatch[1].trim();
  
  return lower;
}

// Find single market matching a parlay component
function findSingleMarket(
  component: string, 
  singlePrices: Map<string, PriceData>
): PriceData | null {
  const normalizedComponent = normalizeTeam(component);
  
  for (const [_, price] of singlePrices) {
    const marketTitle = price.market.title.toLowerCase();
    const normalizedMarket = normalizeTeam(marketTitle);
    
    if (
      normalizedMarket.includes(normalizedComponent) ||
      normalizedComponent.includes(normalizedMarket) ||
      marketTitle.includes(normalizedComponent)
    ) {
      return price;
    }
  }
  
  return null;
}

// Calculate parlay arbitrage opportunities
function findParlayArbitrage(
  parlayPrice: PriceData,
  singlePrices: Map<string, PriceData>
): SpreadOpportunity | null {
  const components = extractParlayComponents(parlayPrice.market.title);
  if (!components || components.length < 2) return null;
  
  console.log(`Checking parlay: "${parlayPrice.market.title}" -> components: ${components.join(', ')}`);
  
  const matchedSingles: PriceData[] = [];
  for (const component of components) {
    const single = findSingleMarket(component, singlePrices);
    if (single) {
      matchedSingles.push(single);
      console.log(`  Found match: "${component}" -> "${single.market.title}" @ ${single.yes_price}`);
    } else {
      console.log(`  No match for: "${component}"`);
    }
  }
  
  if (matchedSingles.length !== components.length) return null;
  
  // Calculate implied parlay price from singles (multiply probabilities)
  const impliedParlayPrice = matchedSingles.reduce((acc, s) => acc * s.yes_price, 1);
  const parlayYesPrice = parlayPrice.yes_price;
  
  console.log(`  Parlay: $${parlayYesPrice.toFixed(3)}, Implied: $${impliedParlayPrice.toFixed(3)}`);
  
  const skew = ((impliedParlayPrice - parlayYesPrice) / parlayYesPrice) * 100;
  
  if (Math.abs(skew) < 2) return null; // Minimum 2% skew for parlays
  
  const buyPlatform = skew > 0 ? parlayPrice.platform : matchedSingles[0].platform;
  const sellPlatform = skew > 0 ? matchedSingles[0].platform : parlayPrice.platform;
  const buyPrice = skew > 0 ? parlayYesPrice : impliedParlayPrice;
  const sellPrice = skew > 0 ? impliedParlayPrice : parlayYesPrice;
  
  const potentialProfit = Math.abs(impliedParlayPrice - parlayYesPrice) * 100;
  
  console.log(`  PARLAY ARB: ${Math.abs(skew).toFixed(1)}% skew, $${potentialProfit.toFixed(2)} profit potential`);
  
  return {
    market_id: parlayPrice.market_id,
    buy_platform: buyPlatform + ' (parlay)',
    sell_platform: sellPlatform + ' (singles)',
    buy_price: buyPrice,
    sell_price: sellPrice,
    skew_percentage: Math.round(Math.abs(skew) * 100) / 100,
    potential_profit: Math.round(potentialProfit * 100) / 100
  };
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
        market:markets!inner(id, slug, title, category, platform)
      `)
      .order('recorded_at', { ascending: false });

    if (pricesError) {
      throw new Error(`Failed to fetch prices: ${pricesError.message}`);
    }

    console.log(`Fetched ${prices?.length || 0} price records`);

    // Get market mappings from match-markets function
    const { data: mappings } = await supabase
      .from('market_mappings')
      .select('market_a_id, market_b_id, similarity_score');

    console.log(`Found ${mappings?.length || 0} market mappings`);

    // Create price lookup by market_id
    const priceByMarket = new Map<string, PriceData>();
    
    // Group prices by market slug (to match similar markets across platforms)
    const marketPrices = new Map<string, PriceData[]>();
    
    // Also create a title-based matching for cross-platform comparison
    const titleMatches = new Map<string, PriceData[]>();
    
    for (const priceRow of prices || []) {
      const marketArr = priceRow.market as unknown as MarketData[];
      const market = Array.isArray(marketArr) ? marketArr[0] : marketArr;
      if (!market) continue;
      
      const price: PriceData = {
        ...priceRow,
        market
      };

      const existing = priceByMarket.get(price.market_id);
      if (!existing || new Date(price.recorded_at) > new Date(existing.recorded_at)) {
        priceByMarket.set(price.market_id, price);
      }

      const marketId = price.market_id;
      if (!marketPrices.has(marketId)) {
        marketPrices.set(marketId, []);
      }
      marketPrices.get(marketId)!.push(price);

      const normalizedTitle = normalizeTitle(market.title);
      if (!titleMatches.has(normalizedTitle)) {
        titleMatches.set(normalizedTitle, []);
      }
      titleMatches.get(normalizedTitle)!.push(price);
    }

    const opportunities: SpreadOpportunity[] = [];

    // Find arbitrage opportunities within same market (different platforms)
    for (const [marketId, priceList] of marketPrices) {
      const latestByPlatform = getLatestByPlatform(priceList);
      
      if (latestByPlatform.size < 2) continue;

      const platforms = Array.from(latestByPlatform.keys());
      
      for (let i = 0; i < platforms.length; i++) {
        for (let j = i + 1; j < platforms.length; j++) {
          const p1 = latestByPlatform.get(platforms[i])!;
          const p2 = latestByPlatform.get(platforms[j])!;
          
          const yesSpread = findYesArbitrage(p1, p2, marketId);
          if (yesSpread) opportunities.push(yesSpread);
          
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
          
          const refMarketId = p1.market_id;
          
          const yesSpread = findYesArbitrage(p1, p2, refMarketId);
          if (yesSpread && !isDuplicate(opportunities, yesSpread)) {
            opportunities.push(yesSpread);
          }
        }
      }
    }

    // Check opportunities from market_mappings (matched markets across platforms)
    if (mappings && mappings.length > 0) {
      for (const mapping of mappings) {
        const priceA = priceByMarket.get(mapping.market_a_id);
        const priceB = priceByMarket.get(mapping.market_b_id);
        
        if (!priceA || !priceB) continue;
        if (priceA.platform === priceB.platform) continue;
        
        const yesSpread = findYesArbitrage(priceA, priceB, priceA.market_id);
        if (yesSpread && !isDuplicate(opportunities, yesSpread)) {
          opportunities.push(yesSpread);
          console.log(`Mapped market spread: ${yesSpread.skew_percentage}% - ${priceA.market.title.substring(0, 40)}`);
        }
        
        const noSpread = findNoArbitrage(priceA, priceB, priceA.market_id);
        if (noSpread && !isDuplicate(opportunities, noSpread)) {
          opportunities.push(noSpread);
        }
      }
    }

    // === PARLAY ARBITRAGE ===
    console.log('Checking for parlay arbitrage opportunities...');
    
    // Get all single-game prices from Azuro (sports)
    const azuroSingles = new Map<string, PriceData>();
    for (const [_, price] of priceByMarket) {
      if (price.platform === 'azuro') {
        azuroSingles.set(price.market_id, price);
      }
    }
    
    console.log(`Found ${azuroSingles.size} Azuro single markets for parlay matching`);
    
    // Check each Kalshi market for parlay patterns
    for (const [_, price] of priceByMarket) {
      if (price.platform !== 'kalshi') continue;
      
      const parlayArb = findParlayArbitrage(price, azuroSingles);
      if (parlayArb && !isDuplicate(opportunities, parlayArb)) {
        opportunities.push(parlayArb);
        console.log(`Found parlay arb: ${parlayArb.skew_percentage}% on "${price.market.title.substring(0, 50)}"`);
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
          expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString()
        })));

      if (insertError) {
        console.error('Error inserting spreads:', insertError);
      }
    }

    const topOpps = significantOpps
      .sort((a, b) => b.skew_percentage - a.skew_percentage)
      .slice(0, 10);

    return new Response(
      JSON.stringify({
        success: true,
        total_opportunities: opportunities.length,
        significant_opportunities: significantOpps.length,
        parlay_arbs: opportunities.filter(o => o.buy_platform.includes('parlay') || o.sell_platform.includes('parlay')).length,
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
    .slice(0, 5)
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
  const buyP1 = p1.yes_price < p2.yes_price;
  const buyPrice = buyP1 ? p1.yes_price : p2.yes_price;
  const sellPrice = buyP1 ? p2.yes_price : p1.yes_price;
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

function findNoArbitrage(p1: PriceData, p2: PriceData, marketId: string): SpreadOpportunity | null {
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
