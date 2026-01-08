import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Azuro SubGraph endpoint - using Polygon (highest liquidity)
const AZURO_SUBGRAPH_URL = 'https://thegraph.azuro.org/subgraphs/name/azuro-protocol/azuro-api-polygon-v3';

// Simpler query by games instead of conditions (faster, no timeout)
const AZURO_QUERY = `
  query GetGames($first: Int!) {
    games(
      first: $first
      orderBy: startsAt
      orderDirection: desc
      where: { status: Created }
    ) {
      id
      gameId
      title
      startsAt
      sport {
        name
      }
      league {
        name
        country {
          name
        }
      }
      participants {
        name
      }
      conditions(first: 1) {
        conditionId
        status
        outcomes {
          outcomeId
          currentOdds
        }
      }
    }
  }
`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    console.log('Fetching Azuro games from SubGraph...');

    const response = await fetch(AZURO_SUBGRAPH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: AZURO_QUERY,
        variables: { first: 50 }
      })
    });

    const result = await response.json();
    
    if (result.errors) {
      console.error('Azuro GraphQL errors:', result.errors);
      throw new Error(result.errors[0].message);
    }

    if (!result.data?.games) {
      throw new Error('No games data from Azuro SubGraph');
    }

    const games = result.data.games;
    console.log(`Fetched ${games.length} Azuro games`);

    let marketsUpserted = 0;
    let pricesInserted = 0;

    for (const game of games) {
      try {
        // Build title from participants or use provided title
        let title = game.title;
        if (!title && game.participants?.length >= 2) {
          title = game.participants.map((p: { name: string }) => p.name).join(' vs ');
        }
        if (!title) continue;

        // Add league info to title for better matching
        const fullTitle = game.league?.name 
          ? `${title} - ${game.league.name}`
          : title;

        const slug = `azuro-${game.gameId}`;
        const sportName = game.sport?.name || 'Sports';
        
        // Determine category (all Azuro is sports)
        const category = 'sports';

        // Upsert market with platform field
        const { data: marketData, error: marketError } = await supabase
          .from('markets')
          .upsert({
            slug,
            title: fullTitle,
            description: `${sportName}: ${game.league?.country?.name || ''} ${game.league?.name || ''}`.trim(),
            category,
            platform: 'azuro',
            status: 'active',
            resolution_date: new Date(parseInt(game.startsAt) * 1000).toISOString(),
            updated_at: new Date().toISOString()
          }, { onConflict: 'slug' })
          .select('id')
          .single();

        if (marketError) {
          console.error('Error upserting market:', marketError.message);
          continue;
        }

        marketsUpserted++;

        // Process conditions for odds - log first game to debug
        if (marketsUpserted === 1) {
          console.log('Sample game conditions:', JSON.stringify(game.conditions));
        }

        const condition = game.conditions?.[0];
        if (condition?.outcomes?.length >= 2) {
          const odds1 = parseFloat(condition.outcomes[0].currentOdds || '0');
          const odds2 = parseFloat(condition.outcomes[1].currentOdds || '0');
          
          if (odds1 > 0 && odds2 > 0) {
            // Convert decimal odds to probability: prob = 1/odds
            const prob1 = 1 / odds1;
            const prob2 = 1 / odds2;
            
            // Normalize to sum to 1
            const total = prob1 + prob2;
            const yesPrice = Math.round((prob1 / total) * 100) / 100;
            const noPrice = Math.round((prob2 / total) * 100) / 100;

            const { error: priceError } = await supabase.from('prices').insert({
              market_id: marketData.id,
              platform: 'azuro',
              yes_price: yesPrice,
              no_price: noPrice,
              volume_24h: 0,
              total_volume: 0
            });

            if (!priceError) pricesInserted++;
          }
        } else {
          // Fallback: create 50/50 odds if no conditions
          const { error: priceError } = await supabase.from('prices').insert({
            market_id: marketData.id,
            platform: 'azuro',
            yes_price: 0.5,
            no_price: 0.5,
            volume_24h: 0,
            total_volume: 0
          });

          if (!priceError) pricesInserted++;
        }
      } catch (err) {
        console.error('Error processing game:', err);
      }
    }

    console.log(`Upserted ${marketsUpserted} markets, inserted ${pricesInserted} prices`);

    return new Response(
      JSON.stringify({
        success: true,
        games_fetched: games.length,
        markets_upserted: marketsUpserted,
        prices_inserted: pricesInserted
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in fetch-azuro:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});