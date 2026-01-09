import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Thales/Overtime Subgraph endpoints for different chains
const SUBGRAPHS = {
  optimism: 'https://api.thegraph.com/subgraphs/name/thales-markets/sport-markets-optimism',
  arbitrum: 'https://api.thegraph.com/subgraphs/name/thales-markets/sport-markets-arbitrum',
};

const THALES_QUERY = `
  query GetSportMarkets($first: Int!) {
    sportMarkets(
      first: $first
      orderBy: timestamp
      orderDirection: desc
      where: { isResolved: false, isCanceled: false }
    ) {
      id
      gameId
      homeTeam
      awayTeam
      homeOdds
      awayOdds
      drawOdds
      timestamp
      maturityDate
      tags
      isResolved
      finalResult
      poolSize
      numberOfParticipants
    }
  }
`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Fetching Thales/Overtime markets...');

    let allMarkets: any[] = [];
    
    // Fetch from both chains
    for (const [chain, url] of Object.entries(SUBGRAPHS)) {
      try {
        console.log(`Fetching from ${chain}...`);
        
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: THALES_QUERY,
            variables: { first: 100 }
          })
        });

        const result = await response.json();
        
        if (result.data?.sportMarkets) {
          const markets = result.data.sportMarkets.map((m: any) => ({ ...m, chain }));
          allMarkets = allMarkets.concat(markets);
          console.log(`Found ${result.data.sportMarkets.length} markets on ${chain}`);
        } else if (result.errors) {
          console.error(`Subgraph error on ${chain}:`, result.errors);
        }
      } catch (chainError) {
        console.error(`Error fetching ${chain}:`, chainError);
      }
    }

    if (allMarkets.length === 0) {
      console.log('No markets found from any Thales subgraph');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No active Thales markets found',
          markets_count: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let savedCount = 0;
    let priceCount = 0;

    for (const market of allMarkets) {
      try {
        // Skip if no teams
        if (!market.homeTeam || !market.awayTeam) continue;

        // Create title matching Azuro format for better matching
        const title = `${market.homeTeam} vs ${market.awayTeam}`;
        const slug = `thales-${market.chain}-${market.gameId}`;
        
        // Convert odds to probability (Thales uses decimal odds like 1.5, 2.0)
        // Decimal odds of 2.0 = 50% probability, 1.5 = 66.7% probability
        const homeOdds = parseFloat(market.homeOdds || '0');
        const awayOdds = parseFloat(market.awayOdds || '0');
        
        // Skip if no valid odds
        if (homeOdds <= 0 || awayOdds <= 0) continue;

        // Convert decimal odds to probability
        const homeProb = homeOdds > 0 ? 1 / homeOdds : 0.5;
        const awayProb = awayOdds > 0 ? 1 / awayOdds : 0.5;
        
        // Normalize to sum to 1 (remove vig)
        const total = homeProb + awayProb;
        const yesPrice = total > 0 ? homeProb / total : 0.5;

        // Calculate resolution date from maturityDate (Unix timestamp)
        const resolutionDate = market.maturityDate 
          ? new Date(parseInt(market.maturityDate) * 1000).toISOString()
          : null;

        // Upsert market
        const { data: savedMarket, error: marketError } = await supabase
          .from('markets')
          .upsert({
            slug,
            platform: 'thales',
            title,
            category: 'sports',
            status: 'active',
            resolution_date: resolutionDate,
            description: `${market.homeTeam} vs ${market.awayTeam} - Thales Overtime (${market.chain})`,
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

        savedCount++;

        // Insert price record
        const { error: priceError } = await supabase
          .from('prices')
          .insert({
            market_id: savedMarket.id,
            platform: 'thales',
            yes_price: yesPrice,
            no_price: 1 - yesPrice,
            volume_24h: parseFloat(market.poolSize || '0'),
            total_volume: parseFloat(market.poolSize || '0'),
            recorded_at: new Date().toISOString()
          });

        if (!priceError) {
          priceCount++;
        } else {
          console.error('Error saving price:', priceError.message);
        }

      } catch (error) {
        console.error('Error processing market:', error);
      }
    }

    console.log(`Successfully saved ${savedCount} markets, ${priceCount} prices`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Saved ${savedCount} Thales markets with ${priceCount} prices`,
        markets_count: savedCount,
        prices_count: priceCount,
        fetched_count: allMarkets.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in fetch-thales:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
