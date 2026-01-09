import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Key entities for matching - patterns that indicate same underlying event
const KEY_ENTITIES: Record<string, string[]> = {
  // Political figures
  'trump': ['trump', 'donald trump', 'donald j trump', 'dt', 'trump 2024', 'trump 2028'],
  'biden': ['biden', 'joe biden', 'joseph biden', 'president biden'],
  'harris': ['harris', 'kamala harris', 'kamala', 'vp harris'],
  'desantis': ['desantis', 'ron desantis', 'governor desantis'],
  'newsom': ['newsom', 'gavin newsom', 'governor newsom'],
  'musk': ['musk', 'elon musk', 'elon'],
  
  // Elections
  'election 2024': ['2024 election', 'election 2024', 'presidential 2024', '2024 presidential'],
  'election 2028': ['2028 election', 'election 2028', 'presidential 2028', '2028 presidential'],
  'gop nominee': ['republican nominee', 'gop nominee', 'republican nomination', 'gop nomination'],
  'dem nominee': ['democrat nominee', 'dem nominee', 'democratic nomination', 'dnc nominee'],
  
  // Economic events  
  'fed rate': ['federal reserve', 'fed rate', 'interest rate', 'rate hike', 'rate cut', 'fomc', 'fed meeting'],
  'inflation': ['inflation', 'cpi', 'consumer price index', 'pce'],
  'recession': ['recession', 'economic downturn', 'gdp negative', 'gdp contraction'],
  'unemployment': ['unemployment', 'jobless', 'jobs report', 'nonfarm payroll'],
  'gdp': ['gdp', 'gross domestic product', 'economic growth'],
  
  // Crypto prices
  'btc 100k': ['bitcoin 100k', 'btc 100k', 'bitcoin $100,000', 'btc $100k', 'bitcoin 100,000'],
  'btc 150k': ['bitcoin 150k', 'btc 150k', 'bitcoin $150,000', 'btc $150k'],
  'btc 200k': ['bitcoin 200k', 'btc 200k', 'bitcoin $200,000', 'btc $200k'],
  'eth 10k': ['ethereum 10k', 'eth 10k', 'ethereum $10,000', 'eth $10k'],
  'eth 5k': ['ethereum 5k', 'eth 5k', 'ethereum $5,000', 'eth $5k'],
  'solana 500': ['solana 500', 'sol 500', 'solana $500'],
  
  // Major events
  'super bowl': ['super bowl', 'superbowl', 'sb '],
  'world cup': ['world cup', 'fifa world cup'],
  'olympics': ['olympics', 'olympic games', 'summer olympics', 'winter olympics'],
  
  // Tech/Companies
  'tesla': ['tesla', 'tsla'],
  'apple': ['apple', 'aapl', 'iphone'],
  'nvidia': ['nvidia', 'nvda'],
  'openai': ['openai', 'chatgpt', 'gpt-5', 'gpt5'],
};

// Stop words to ignore
const STOP_WORDS = new Set([
  'will', 'the', 'in', 'on', 'to', 'a', 'be', 'at', 'by', 'for', 'of',
  'is', 'it', 'an', 'or', 'as', 'if', 'no', 'yes', 'and', 'with', 'this',
  'that', 'from', 'has', 'have', 'not', 'but', 'are', 'was', 'were', 'been',
  'before', 'after', 'during', 'above', 'below', 'between', 'under', 'over'
]);

interface Market {
  id: string;
  title: string;
  category: string;
  slug: string;
  platform: string;
  resolution_date?: string;
}

// Extract key entities from title
function extractKeyEntities(title: string): string[] {
  const found: string[] = [];
  const normalized = title.toLowerCase();
  
  for (const [entity, patterns] of Object.entries(KEY_ENTITIES)) {
    if (patterns.some(p => normalized.includes(p))) {
      found.push(entity);
    }
  }
  
  return found;
}

// Extract meaningful words from title
function extractWords(title: string): string[] {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !STOP_WORDS.has(word));
}

// Basic word overlap score
function wordOverlap(title1: string, title2: string): number {
  const words1 = new Set(extractWords(title1));
  const words2 = new Set(extractWords(title2));
  
  if (words1.size === 0 || words2.size === 0) return 0;
  
  const intersection = [...words1].filter(w => words2.has(w));
  const union = new Set([...words1, ...words2]);
  
  return intersection.length / union.size;
}

// Extract year from title if present
function extractYear(title: string): number | null {
  const yearMatch = title.match(/\b(202[4-9]|203[0-9])\b/);
  return yearMatch ? parseInt(yearMatch[1]) : null;
}

// Extract price target from title if present (for crypto)
function extractPriceTarget(title: string): number | null {
  const priceMatch = title.match(/\$?([\d,]+)k?\b/i);
  if (priceMatch) {
    let value = parseInt(priceMatch[1].replace(/,/g, ''));
    if (title.toLowerCase().includes('k')) value *= 1000;
    return value;
  }
  return null;
}

// Calculate advanced similarity score
function calculateSimilarity(market1: Market, market2: Market): { score: number; reason: string } {
  let score = 0;
  let reasons: string[] = [];
  
  // 1. Key entities match (50% weight - MOST IMPORTANT)
  const entities1 = extractKeyEntities(market1.title);
  const entities2 = extractKeyEntities(market2.title);
  const commonEntities = entities1.filter(e => entities2.includes(e));
  
  if (commonEntities.length > 0) {
    const entityScore = commonEntities.length / Math.max(entities1.length, entities2.length, 1);
    score += 0.5 * entityScore;
    reasons.push(`entities:${commonEntities.join(',')}`);
  }
  
  // 2. Category match (20% weight)
  if (market1.category === market2.category) {
    score += 0.2;
    reasons.push(`category:${market1.category}`);
  }
  
  // 3. Title word overlap (30% weight)
  const titleSim = wordOverlap(market1.title, market2.title);
  score += 0.3 * titleSim;
  if (titleSim > 0.2) {
    reasons.push(`words:${Math.round(titleSim * 100)}%`);
  }
  
  // BONUS: Same year mentioned
  const year1 = extractYear(market1.title);
  const year2 = extractYear(market2.title);
  if (year1 && year2 && year1 === year2) {
    score += 0.1;
    reasons.push(`year:${year1}`);
  }
  
  // BONUS: Similar price target (for crypto markets)
  if (market1.category === 'crypto' && market2.category === 'crypto') {
    const price1 = extractPriceTarget(market1.title);
    const price2 = extractPriceTarget(market2.title);
    if (price1 && price2 && Math.abs(price1 - price2) / Math.max(price1, price2) < 0.1) {
      score += 0.15;
      reasons.push(`price:~$${price1}`);
    }
  }
  
  // BONUS: Date proximity
  if (market1.resolution_date && market2.resolution_date) {
    try {
      const date1 = new Date(market1.resolution_date).getTime();
      const date2 = new Date(market2.resolution_date).getTime();
      const daysDiff = Math.abs(date1 - date2) / (1000 * 60 * 60 * 24);
      if (daysDiff < 7) {
        score += 0.1;
        reasons.push('date:<7d');
      } else if (daysDiff < 30) {
        score += 0.05;
        reasons.push('date:<30d');
      }
    } catch {
      // Ignore date parsing errors
    }
  }
  
  return { score: Math.min(score, 1), reason: reasons.join(' | ') };
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

    console.log('Starting enhanced market matching...');

    // Get all markets by platform
    const { data: allMarkets, error: marketsError } = await supabase
      .from('markets')
      .select('id, title, category, slug, platform, resolution_date')
      .eq('status', 'active');

    if (marketsError) throw marketsError;

    // Group by platform
    const marketsByPlatform: Record<string, Market[]> = {};
    for (const market of allMarkets || []) {
      if (!marketsByPlatform[market.platform]) {
        marketsByPlatform[market.platform] = [];
      }
      marketsByPlatform[market.platform].push(market as Market);
    }

    const platforms = Object.keys(marketsByPlatform);
    console.log(`Found markets: ${platforms.map(p => `${p}=${marketsByPlatform[p].length}`).join(', ')}`);

    const THRESHOLD = 0.3; // Lowered threshold for more matches
    let matchCount = 0;
    const matches: Array<{ platforms: string; titles: string[]; score: number; reason: string }> = [];
    const potentialMatches: Array<{ platforms: string; titles: string[]; score: number; reason: string }> = [];

    // Compare each pair of platforms
    for (let i = 0; i < platforms.length; i++) {
      for (let j = i + 1; j < platforms.length; j++) {
        const platform1 = platforms[i];
        const platform2 = platforms[j];
        const markets1 = marketsByPlatform[platform1];
        const markets2 = marketsByPlatform[platform2];

        console.log(`Comparing ${platform1} (${markets1.length}) vs ${platform2} (${markets2.length})...`);

        for (const m1 of markets1) {
          let bestMatch: Market | null = null;
          let bestScore = 0;
          let bestReason = '';

          for (const m2 of markets2) {
            const { score, reason } = calculateSimilarity(m1, m2);
            
            // Log potential matches (score > 0.2)
            if (score > 0.2 && score < THRESHOLD) {
              potentialMatches.push({
                platforms: `${platform1}<>${platform2}`,
                titles: [m1.title.substring(0, 40), m2.title.substring(0, 40)],
                score: Math.round(score * 100),
                reason
              });
            }
            
            if (score > bestScore && score >= THRESHOLD) {
              bestScore = score;
              bestMatch = m2;
              bestReason = reason;
            }
          }

          if (bestMatch && bestScore >= THRESHOLD) {
            const { error } = await supabase
              .from('market_mappings')
              .upsert({
                market_a_id: m1.id,
                market_b_id: bestMatch.id,
                platform1: platform1,
                platform2: platform2,
                similarity_score: bestScore,
                manual_verified: false,
                updated_at: new Date().toISOString()
              }, {
                onConflict: 'market_a_id,market_b_id'
              });

            if (!error) {
              matchCount++;
              matches.push({
                platforms: `${platform1}<>${platform2}`,
                titles: [m1.title.substring(0, 50), bestMatch.title.substring(0, 50)],
                score: Math.round(bestScore * 100),
                reason: bestReason
              });
              console.log(`✓ MATCH [${Math.round(bestScore * 100)}%] ${bestReason}`);
              console.log(`  ${platform1}: "${m1.title.substring(0, 50)}"`);
              console.log(`  ${platform2}: "${bestMatch.title.substring(0, 50)}"`);
            }
          }
        }
      }
    }

    // Log some potential matches that didn't quite make it
    if (potentialMatches.length > 0) {
      console.log(`\n--- ${potentialMatches.length} POTENTIAL matches (20-30% score) ---`);
      for (const pm of potentialMatches.slice(0, 10)) {
        console.log(`  [${pm.score}%] ${pm.reason}: "${pm.titles[0]}..." <> "${pm.titles[1]}..."`);
      }
    }

    console.log(`\nSuccessfully matched ${matchCount} markets`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        matched: matchCount,
        threshold: THRESHOLD,
        platforms: Object.fromEntries(
          Object.entries(marketsByPlatform).map(([k, v]) => [k, v.length])
        ),
        matches: matches.slice(0, 30),
        potential_matches: potentialMatches.slice(0, 20),
        key_entities_used: Object.keys(KEY_ENTITIES).length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in match-markets:', message);
    return new Response(
      JSON.stringify({ error: message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
