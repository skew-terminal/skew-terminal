import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Normalize market title for matching
function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Calculate Jaccard similarity between two strings
function calculateSimilarity(str1: string, str2: string): number {
  const normalized1 = normalizeTitle(str1);
  const normalized2 = normalizeTitle(str2);
  
  const words1 = new Set(normalized1.split(' ').filter(w => w.length > 2));
  const words2 = new Set(normalized2.split(' ').filter(w => w.length > 2));
  
  if (words1.size === 0 || words2.size === 0) return 0;
  
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size;
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

    console.log('Starting market matching...');

    // Get Kalshi markets
    const { data: kalshiMarkets, error: kalshiError } = await supabase
      .from('markets')
      .select('id, title, category, slug')
      .eq('platform', 'kalshi');

    if (kalshiError) throw kalshiError;

    // Get Polymarket markets
    const { data: polymarketMarkets, error: polyError } = await supabase
      .from('markets')
      .select('id, title, category, slug')
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
    const matches: Array<{ kalshi: string; poly: string; score: number }> = [];

    // Match each Kalshi market with best Polymarket match
    for (const kalshi of kalshiMarkets) {
      let bestMatch = null;
      let bestScore = 0;

      for (const poly of polymarketMarkets) {
        const similarity = calculateSimilarity(kalshi.title, poly.title);
        
        // Boost score if same category
        const categoryBoost = kalshi.category === poly.category ? 1.2 : 1;
        const finalScore = similarity * categoryBoost;
        
        if (finalScore > bestScore && finalScore > 0.5) {
          bestScore = finalScore;
          bestMatch = poly;
        }
      }

      if (bestMatch && bestScore > 0.5) {
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
            score: Math.round(bestScore * 100)
          });
          console.log(`Matched: "${kalshi.title.substring(0, 40)}..." <-> "${bestMatch.title.substring(0, 40)}..." (${Math.round(bestScore * 100)}%)`);
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
        matches: matches.slice(0, 10) // Return first 10 matches
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
