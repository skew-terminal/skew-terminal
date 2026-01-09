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

    console.log('Fetching PredictIt markets...');

    const response = await fetch('https://www.predictit.org/api/marketdata/all/');
    
    if (!response.ok) {
      throw new Error(`PredictIt API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.markets) {
      throw new Error('No markets from PredictIt API');
    }

    console.log(`Received ${data.markets.length} markets from PredictIt`);

    let savedCount = 0;
    let pricesCount = 0;

    for (const market of data.markets.slice(0, 100)) {
      try {
        // Determine category based on market name
        let category: 'politics' | 'economics' | 'crypto' | 'other' = 'politics';
        const name = (market.name || '').toLowerCase();
        
        if (name.includes('fed') || name.includes('inflation') || name.includes('gdp') || 
            name.includes('economy') || name.includes('recession') || name.includes('rate')) {
          category = 'economics';
        } else if (name.includes('bitcoin') || name.includes('crypto') || name.includes('eth')) {
          category = 'crypto';
        }

        if (!market.contracts || market.contracts.length === 0) continue;

        // Find YES contract or use first contract
        const yesContract = market.contracts.find((c: any) => 
          c.name?.toLowerCase().includes('yes')
        ) || market.contracts[0];
        
        const yesPrice = yesContract.lastTradePrice || 0.5;
        const totalVolume = market.contracts.reduce((sum: number, c: any) => 
          sum + (parseFloat(c.totalSharesTraded) || 0), 0
        );

        // Create slug from market ID and name
        const slug = `predictit-${market.id}-${(market.shortName || market.name || '')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .substring(0, 50)}`;

        // Upsert market
        const { data: savedMarket, error: marketError } = await supabase
          .from('markets')
          .upsert({
            platform: 'predictit',
            slug: slug,
            title: market.name || market.shortName,
            category: category,
            status: 'active',
            resolution_date: market.dateEnd ? new Date(market.dateEnd).toISOString() : null,
            description: market.shortName || market.name,
            image_url: market.image || null,
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
          platform: 'predictit',
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

    console.log(`Saved ${savedCount} PredictIt markets, ${pricesCount} price records`);

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
    console.error('Error in fetch-predictit:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
