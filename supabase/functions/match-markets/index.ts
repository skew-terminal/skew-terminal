import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Key entities for matching - patterns that indicate same underlying event
const KEY_ENTITIES: Record<string, string[]> = {
  // Political figures
  'trump': ['trump', 'donald trump'],
  'biden': ['biden', 'joe biden'],
  'harris': ['harris', 'kamala harris', 'kamala'],
  'desantis': ['desantis', 'ron desantis'],
  'newsom': ['newsom', 'gavin newsom'],
  'musk': ['musk', 'elon musk', 'elon'],
  
  // Elections
  'election 2024': ['2024 election', 'election 2024', 'presidential 2024'],
  'election 2028': ['2028 election', 'election 2028', 'presidential 2028'],
  'gop nominee': ['republican nominee', 'gop nominee', 'republican nomination'],
  'dem nominee': ['democrat nominee', 'democratic nomination'],
  
  // Economic events  
  'fed rate': ['federal reserve', 'fed rate', 'interest rate', 'rate hike', 'rate cut', 'fomc'],
  'inflation': ['inflation', 'cpi', 'consumer price'],
  'recession': ['recession', 'economic downturn'],
  'gdp': ['gdp', 'gross domestic product'],
  
  // Crypto prices
  'btc 100k': ['bitcoin 100k', 'btc 100k', 'bitcoin $100'],
  'btc 150k': ['bitcoin 150k', 'btc 150k', 'bitcoin $150'],
  'eth 10k': ['ethereum 10k', 'eth 10k', 'ethereum $10'],
  
  // Major events
  'super bowl': ['super bowl', 'superbowl'],
  'world cup': ['world cup', 'fifa world cup'],
  'olympics': ['olympics', 'olympic games'],
};

// Stop words to ignore
const STOP_WORDS = new Set([
  'will', 'the', 'in', 'on', 'to', 'a', 'be', 'at', 'by', 'for', 'of',
  'is', 'it', 'an', 'or', 'as', 'if', 'no', 'yes', 'and', 'with', 'this',
  'that', 'from', 'has', 'have', 'not', 'but', 'are', 'was', 'were', 'been',
  'before', 'after', 'during', 'above', 'below', 'between', 'under', 'over',
  'win', 'game', 'match', 'vs', 'against'
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

// Basic word overlap score (Jaccard)
function wordOverlap(title1: string, title2: string): number {
  const words1 = new Set(extractWords(title1));
  const words2 = new Set(extractWords(title2));
  
  if (words1.size === 0 || words2.size === 0) return 0;
  
  const intersection = [...words1].filter(w => words2.has(w));
  const union = new Set([...words1, ...words2]);
  
  return intersection.length / union.size;
}

// Extract year from title
function extractYear(title: string): number | null {
  const yearMatch = title.match(/\b(202[4-9]|203[0-9])\b/);
  return yearMatch ? parseInt(yearMatch[1]) : null;
}

// Calculate similarity score
function calculateSimilarity(market1: Market, market2: Market): { score: number; reason: string } {
  let score = 0;
  const reasons: string[] = [];
  
  // 1. Key entities match (50% weight)
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

    console.log('Starting optimized market matching...');

    // Get only politics and crypto markets for matching (skip sports - too many)
    const { data: allMarkets, error: marketsError } = await supabase
      .from('markets')
      .select('id, title, category, slug, platform, resolution_date')
      .eq('status', 'active')
      .in('platform', ['polymarket', 'kalshi', 'predictit', 'manifold'])
      .in('category', ['politics', 'crypto', 'other'])
      .limit(500);

    if (marketsError) throw marketsError;

    // Group by platform and category
    const marketsByPlatformCategory: Record<string, Record<string, Market[]>> = {};
    
    for (const market of allMarkets || []) {
      const platform = market.platform as string;
      const category = market.category as string;
      
      if (!marketsByPlatformCategory[platform]) {
        marketsByPlatformCategory[platform] = {};
      }
      if (!marketsByPlatformCategory[platform][category]) {
        marketsByPlatformCategory[platform][category] = [];
      }
      
      // Limit per platform per category to avoid timeout
      if (marketsByPlatformCategory[platform][category].length < 100) {
        marketsByPlatformCategory[platform][category].push(market as Market);
      }
    }

    const platforms = Object.keys(marketsByPlatformCategory);
    const platformCounts: Record<string, number> = {};
    for (const p of platforms) {
      platformCounts[p] = Object.values(marketsByPlatformCategory[p]).flat().length;
    }
    console.log(`Loaded markets: ${JSON.stringify(platformCounts)}`);

    const THRESHOLD = 0.4;
    let matchCount = 0;
    const matches: Array<{ platforms: string; titles: string[]; score: number; reason: string }> = [];

    // Compare platforms, but only within SAME CATEGORY
    for (let i = 0; i < platforms.length; i++) {
      for (let j = i + 1; j < platforms.length; j++) {
        const platform1 = platforms[i];
        const platform2 = platforms[j];
        
        // Get common categories between platforms
        const categories1 = Object.keys(marketsByPlatformCategory[platform1]);
        const categories2 = Object.keys(marketsByPlatformCategory[platform2]);
        const commonCategories = categories1.filter(c => categories2.includes(c));

        for (const category of commonCategories) {
          const markets1 = marketsByPlatformCategory[platform1][category] || [];
          const markets2 = marketsByPlatformCategory[platform2][category] || [];

          if (markets1.length === 0 || markets2.length === 0) continue;

          console.log(`Matching ${platform1} vs ${platform2} [${category}]: ${markets1.length} x ${markets2.length}`);

          for (const m1 of markets1) {
            let bestMatch: Market | null = null;
            let bestScore = 0;
            let bestReason = '';

            for (const m2 of markets2) {
              const { score, reason } = calculateSimilarity(m1, m2);
              
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
                  market_id_platform1: m1.id,
                  market_id_platform2: bestMatch.id,
                  platform1: platform1,
                  platform2: platform2,
                  similarity_score: bestScore,
                  manual_verified: false,
                  updated_at: new Date().toISOString()
                }, {
                  onConflict: 'market_id_platform1,market_id_platform2'
                });

              if (!error) {
                matchCount++;
                matches.push({
                  platforms: `${platform1}<>${platform2}`,
                  titles: [m1.title.substring(0, 50), bestMatch.title.substring(0, 50)],
                  score: Math.round(bestScore * 100),
                  reason: bestReason
                });
                console.log(`✓ [${Math.round(bestScore * 100)}%] ${m1.title.substring(0, 40)} <> ${bestMatch.title.substring(0, 40)}`);
              }
            }
          }
        }
      }
    }

    console.log(`\nSuccessfully matched ${matchCount} markets`);

    // Now run calculate-spreads for the matches
    if (matchCount > 0) {
      console.log('Triggering spread calculation...');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        matched: matchCount,
        threshold: THRESHOLD,
        platforms: platformCounts,
        matches: matches.slice(0, 50)
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
