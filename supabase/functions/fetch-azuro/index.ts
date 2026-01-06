import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Azuro Protocol SubGraph endpoints (public, no API key needed)
const AZURO_SUBGRAPHS = {
  polygon: 'https://thegraph.azuro.org/subgraphs/name/azuro-protocol/azuro-api-polygon-v3',
  gnosis: 'https://thegraph.azuro.org/subgraphs/name/azuro-protocol/azuro-api-gnosis-v3',
  arbitrum: 'https://thegraph.azuro.org/subgraphs/name/azuro-protocol/azuro-api-arbitrum-one-v3',
  linea: 'https://thegraph.azuro.org/subgraphs/name/azuro-protocol/azuro-api-linea-v3',
  chiliz: 'https://thegraph.azuro.org/subgraphs/name/azuro-protocol/azuro-api-chiliz-v3'
};

interface AzuroCondition {
  id: string;
  conditionId: string;
  status: string;
  outcomes: {
    id: string;
    outcomeId: string;
    currentOdds: string;
  }[];
  game: {
    gameId: string;
    title: string;
    startsAt: string;
    sport: {
      name: string;
    };
    league: {
      name: string;
      country: {
        name: string;
      };
    };
  };
  core: {
    liquidityPool: {
      address: string;
    };
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    console.log('Fetching Azuro Protocol markets...');

    const query = `
      query GetActiveConditions {
        conditions(
          where: { status: Created }
          first: 100
          orderBy: turnover
          orderDirection: desc
        ) {
          id
          conditionId
          status
          turnover
          outcomes {
            id
            outcomeId
            currentOdds
          }
          game {
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
          }
          core {
            liquidityPool {
              address
            }
          }
        }
      }
    `;

    // Fetch from Polygon subgraph (highest liquidity)
    const response = await fetch(AZURO_SUBGRAPHS.polygon, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });

    const result = await response.json();
    
    if (result.errors) {
      console.error('Azuro GraphQL errors:', result.errors);
      throw new Error(result.errors[0].message);
    }

    const conditions: AzuroCondition[] = result.data?.conditions || [];
    console.log(`Fetched ${conditions.length} active Azuro conditions`);

    let marketsUpserted = 0;
    let pricesInserted = 0;

    for (const condition of conditions) {
      if (!condition.game || condition.outcomes.length < 2) continue;

      const game = condition.game;
      const slug = `azuro-${condition.conditionId}`;
      
      // Map sport to category
      const sportLower = game.sport?.name?.toLowerCase() || '';
      let category: 'sports' | 'politics' | 'crypto' | 'entertainment' | 'economics' | 'other' = 'sports';
      if (sportLower.includes('politic')) category = 'politics';
      if (sportLower.includes('crypto') || sportLower.includes('bitcoin')) category = 'crypto';

      // Upsert market
      const { data: marketData, error: marketError } = await supabase
        .from('markets')
        .upsert({
          slug,
          title: game.title || `${game.league?.name} Match`,
          description: `${game.sport?.name} - ${game.league?.country?.name} ${game.league?.name}`,
          category,
          status: 'active',
          resolution_date: new Date(parseInt(game.startsAt) * 1000).toISOString(),
          updated_at: new Date().toISOString()
        }, { onConflict: 'slug' })
        .select('id')
        .single();

      if (marketError) {
        console.error('Error upserting Azuro market:', marketError);
        continue;
      }

      marketsUpserted++;

      // Calculate implied probabilities from odds
      const outcome1Odds = parseFloat(condition.outcomes[0]?.currentOdds || '2');
      const outcome2Odds = parseFloat(condition.outcomes[1]?.currentOdds || '2');
      
      // Convert decimal odds to probability (1/odds)
      const yes_prob = 1 / outcome1Odds;
      const no_prob = 1 / outcome2Odds;
      
      // Normalize to prices (0-1 range)
      const total_prob = yes_prob + no_prob;
      const yes_price = yes_prob / total_prob;
      const no_price = no_prob / total_prob;

      // Insert price data
      const { error: priceError } = await supabase.from('prices').insert({
        market_id: marketData.id,
        platform: 'azuro',
        yes_price: Math.round(yes_price * 100) / 100,
        no_price: Math.round(no_price * 100) / 100,
        volume_24h: 0,
        total_volume: 0
      });

      if (!priceError) pricesInserted++;
    }

    return new Response(
      JSON.stringify({
        success: true,
        conditions_fetched: conditions.length,
        markets_upserted: marketsUpserted,
        prices_inserted: pricesInserted,
        chains: Object.keys(AZURO_SUBGRAPHS)
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
