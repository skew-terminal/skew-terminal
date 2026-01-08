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

    console.log('Fetching Polymarket markets...');
    
    // Fetch markets from Polymarket API
    const marketsResponse = await fetch('https://gamma-api.polymarket.com/markets?closed=false&limit=100');
    
    if (!marketsResponse.ok) {
      throw new Error(`Polymarket API error: ${marketsResponse.status}`);
    }
    
    const marketsData = await marketsResponse.json();
    console.log(`Received ${marketsData.length} markets from Polymarket`);
    
    let savedMarkets = 0;
    let savedPrices = 0;
    
    // Process markets
    for (const market of marketsData.slice(0, 100)) {
      try {
        // Map category from Polymarket to our categories
        let category: 'politics' | 'crypto' | 'sports' | 'economics' | 'entertainment' | 'other' = 'other';
        const polyCategory = (market.category || market.tags?.[0] || '').toLowerCase();
        
        if (polyCategory.includes('politic') || polyCategory.includes('election') || polyCategory.includes('trump') || polyCategory.includes('biden')) {
          category = 'politics';
        } else if (polyCategory.includes('crypto') || polyCategory.includes('bitcoin') || polyCategory.includes('ethereum')) {
          category = 'crypto';
        } else if (polyCategory.includes('sport') || polyCategory.includes('nfl') || polyCategory.includes('nba')) {
          category = 'sports';
        } else if (polyCategory.includes('econom') || polyCategory.includes('finance') || polyCategory.includes('fed')) {
          category = 'economics';
        } else if (polyCategory.includes('entertain') || polyCategory.includes('pop') || polyCategory.includes('celebrity')) {
          category = 'entertainment';
        }

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
          // Use bid/ask if available
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
            total_volume: parseFloat(market.volumeNum || market.volume || '0') || 0,
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

    return new Response(
      JSON.stringify({ 
        success: true, 
        markets_fetched: marketsData.length,
        markets_saved: savedMarkets,
        prices_saved: savedPrices
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
