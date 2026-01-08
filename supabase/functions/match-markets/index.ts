import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Stop words to ignore in matching
const STOP_WORDS = new Set([
  'will', 'the', 'in', 'on', 'to', 'a', 'be', 'at', 'by', 'for', 'of',
  'is', 'it', 'an', 'or', 'as', 'if', 'no', 'yes', 'and', 'with', 'this',
  'that', 'from', 'has', 'have', 'not', 'but', 'are', 'was', 'were', 'been'
]);

// Important keywords that strongly indicate a match
const IMPORTANT_KEYWORDS = [
  'trump', 'biden', 'election', 'president', 'bitcoin', 'btc', 'ethereum', 'eth',
  'super bowl', 'superbowl', 'nfl', 'nba', 'mlb', 'world cup', 'champions',
  'fed', 'inflation', 'recession', 'gdp', 'interest rate',
  'oscar', 'grammy', 'emmy', 'elon', 'musk', 'tesla',
  // Sports teams
  'eagles', 'chiefs', 'bills', 'ravens', 'lions', 'cowboys', 'packers',
  'texans', 'steelers', 'broncos', 'dolphins', 'vikings', 'chargers',
  'philadelphia', 'kansas city', 'buffalo', 'baltimore', 'detroit', 'houston',
  'celtics', 'lakers', 'warriors', 'bucks', 'nuggets', 'heat', 'suns',
  'boston', 'los angeles', 'golden state', 'milwaukee', 'denver', 'miami', 'phoenix'
];

interface Market {
  id: string;
  title: string;
  category: string;
  slug: string;
  resolution_date?: string;
}

// Extract meaningful keywords from title
function extractKeywords(title: string): string[] {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 2 && !STOP_WORDS.has(word));
}

// Check if title contains important keywords
function findImportantKeywords(title: string): string[] {
  const lowerTitle = title.toLowerCase();
  return IMPORTANT_KEYWORDS.filter(keyword => lowerTitle.includes(keyword));
}

// Calculate basic Jaccard similarity
function basicSimilarity(title1: string, title2: string): number {
  const words1 = new Set(extractKeywords(title1));
  const words2 = new Set(extractKeywords(title2));
  
  if (words1.size === 0 || words2.size === 0) return 0;
  
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size;
}

// Advanced similarity calculation with multiple factors
function calculateAdvancedSimilarity(market1: Market, market2: Market): number {
  let score = 0;
  
  // 1. Basic title similarity (50% weight)
  const titleSimilarity = basicSimilarity(market1.title, market2.title);
  score += titleSimilarity * 0.5;
  
  // 2. Keyword matching (30% weight) - important keywords
  const keywords1 = extractKeywords(market1.title);
  const keywords2 = extractKeywords(market2.title);
  const commonKeywords = keywords1.filter(k => keywords2.includes(k));
  const keywordScore = commonKeywords.length / Math.max(keywords1.length, keywords2.length, 1);
  score += keywordScore * 0.3;
  
  // 3. Important keyword matching (bonus)
  const important1 = findImportantKeywords(market1.title);
  const important2 = findImportantKeywords(market2.title);
  const commonImportant = important1.filter(k => important2.includes(k));
  if (commonImportant.length > 0) {
    score += 0.15 * commonImportant.length; // Big bonus for matching important keywords
  }
  
  // 4. Category bonus (10% weight)
  if (market1.category === market2.category) {
    score += 0.1;
  }
  
  // 5. Date proximity bonus (10% weight)
  if (market1.resolution_date && market2.resolution_date) {
    try {
      const date1 = new Date(market1.resolution_date).getTime();
      const date2 = new Date(market2.resolution_date).getTime();
      const daysDiff = Math.abs(date1 - date2) / (1000 * 60 * 60 * 24);
      if (daysDiff < 7) {
        score += 0.1;
      } else if (daysDiff < 30) {
        score += 0.05;
      }
    } catch {
      // Ignore date parsing errors
    }
  }
  
  return Math.min(score, 1); // Cap at 1.0
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

    console.log('Starting advanced market matching...');

    // Get Kalshi markets with resolution date
    const { data: kalshiMarkets, error: kalshiError } = await supabase
      .from('markets')
      .select('id, title, category, slug, resolution_date')
      .eq('platform', 'kalshi');

    if (kalshiError) throw kalshiError;

    // Get Polymarket markets with resolution date
    const { data: polymarketMarkets, error: polyError } = await supabase
      .from('markets')
      .select('id, title, category, slug, resolution_date')
      .eq('platform', 'polymarket');

    if (polyError) throw polyError;

    console.log(`Found ${kalshiMarkets?.length || 0} Kalshi and ${polymarketMarkets?.length || 0} Polymarket markets`);

    if (!kalshiMarkets?.length || !polymarketMarkets?.length) {
      return new Response(
        JSON.stringify({ success: true, matched: 0, message: 'Not enough markets to match' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let matchCount = 0;
    const matches: Array<{ kalshi: string; poly: string; score: number; reason: string }> = [];
    const THRESHOLD = 0.4; // Lowered from 0.5

    // Match each Kalshi market with best Polymarket match
    for (const kalshi of kalshiMarkets) {
      let bestMatch: Market | null = null;
      let bestScore = 0;
      let matchReason = '';

      for (const poly of polymarketMarkets) {
        const score = calculateAdvancedSimilarity(kalshi as Market, poly as Market);
        
        if (score > bestScore && score >= THRESHOLD) {
          bestScore = score;
          bestMatch = poly as Market;
          
          // Determine reason for match
          const commonImportant = findImportantKeywords(kalshi.title)
            .filter(k => findImportantKeywords(poly.title).includes(k));
          if (commonImportant.length > 0) {
            matchReason = `keyword:${commonImportant[0]}`;
          } else if (kalshi.category === poly.category) {
            matchReason = `category:${kalshi.category}`;
          } else {
            matchReason = 'title_similarity';
          }
        }
      }

      if (bestMatch && bestScore >= THRESHOLD) {
        const { error } = await supabase
          .from('market_mappings')
          .upsert({
            market_a_id: kalshi.id,
            market_b_id: bestMatch.id,
            similarity_score: bestScore,
            manual_verified: false,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'market_a_id,market_b_id'
          });

        if (!error) {
          matchCount++;
          matches.push({
            kalshi: kalshi.title.substring(0, 50),
            poly: bestMatch.title.substring(0, 50),
            score: Math.round(bestScore * 100),
            reason: matchReason
          });
          console.log(`Matched (${matchReason}): "${kalshi.title.substring(0, 35)}..." <-> "${bestMatch.title.substring(0, 35)}..." (${Math.round(bestScore * 100)}%)`);
        }
      }
    }

    console.log(`Successfully matched ${matchCount} markets`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        matched: matchCount,
        total_kalshi: kalshiMarkets.length,
        total_polymarket: polymarketMarkets.length,
        threshold: THRESHOLD,
        matches: matches.slice(0, 20) // Return first 20 matches
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
