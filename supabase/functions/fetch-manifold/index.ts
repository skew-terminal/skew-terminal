import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Fetching Manifold markets...');

    // Fetch top markets by liquidity
    // Fetch markets (no sort param - API doesn't support it)
    const response = await fetch('https://api.manifold.markets/v0/markets?limit=200');
    
    if (!response.ok) {
      throw new Error(`Manifold API error: ${response.status}`);
    }
    
    const markets = await response.json();

    console.log(`Received ${markets.length} markets from Manifold`);

    let savedCount = 0;
    let pricesCount = 0;

    for (const market of markets) {
      try {
        // Only binary markets
        if (market.outcomeType !== 'BINARY') continue;

        // Skip closed/resolved markets
        if (market.isResolved) continue;
        if (market.closeTime && market.closeTime < Date.now()) continue;

        // Determine category from tags and question text
        let category: 'politics' | 'crypto' | 'sports' | 'economics' | 'entertainment' | 'other' = 'other';
        const tags = (market.tags || []).map((t: string) => t.toLowerCase());
        const question = (market.question || '').toLowerCase();
        
        if (tags.some((t: string) => ['politics', 'election', 'elections', 'trump', 'biden', 'president', 'congress'].includes(t)) ||
            question.includes('trump') || question.includes('biden') || question.includes('election')) {
          category = 'politics';
        } else if (tags.some((t: string) => ['crypto', 'bitcoin', 'ethereum', 'cryptocurrency'].includes(t)) ||
                   question.includes('bitcoin') || question.includes('crypto') || question.includes('eth')) {
          category = 'crypto';
        } else if (tags.some((t: string) => ['sports', 'nba', 'nfl', 'soccer', 'football', 'baseball', 'hockey'].includes(t))) {
          category = 'sports';
        } else if (tags.some((t: string) => ['economics', 'economy', 'fed', 'inflation', 'recession', 'stocks'].includes(t)) ||
                   question.includes('fed') || question.includes('inflation') || question.includes('recession')) {
          category = 'economics';
        } else if (tags.some((t: string) => ['movies', 'tv', 'entertainment', 'music', 'celebrity'].includes(t))) {
          category = 'entertainment';
        }

        const yesPrice = market.probability || 0.5;
        const totalVolume = market.volume || 0;

        // Create slug from market ID
        const slug = `manifold-${market.id}`;

        // Upsert market
        const { data: savedMarket, error: marketError } = await supabase
          .from('markets')
          .upsert({
            platform: 'manifold',
            slug: slug,
            title: market.question,
            category: category,
            status: 'active',
            resolution_date: market.closeTime ? new Date(market.closeTime).toISOString() : null,
            description: market.textDescription || market.question,
            image_url: market.coverImageUrl || null,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'slug'
          })
          .select()
          .single();

        if (marketError) {
          console.error('Market upsert error:', marketError.message);
          continue;
        }

        // Insert price data
        const { error: priceError } = await supabase.from('prices').insert({
          market_id: savedMarket.id,
          platform: 'manifold',
          yes_price: yesPrice,
          no_price: 1 - yesPrice,
          volume_24h: 0,
          total_volume: totalVolume,
          recorded_at: new Date().toISOString()
        });

        if (!priceError) {
          pricesCount++;
        }

        savedCount++;

      } catch (error: unknown) {
        console.error('Error processing market:', error instanceof Error ? error.message : error);
      }
    }

    console.log(`Saved ${savedCount} Manifold markets, ${pricesCount} price records`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Saved ${savedCount} markets, ${pricesCount} prices`,
        markets_count: savedCount,
        prices_count: pricesCount
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in fetch-manifold:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
