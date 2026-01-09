import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Overtime V2 REST API (replaces deprecated Subgraph)
const OVERTIME_API_BASE = 'https://api.overtime.io/overtime-v2';

// Supported networks: 10 (Optimism), 42161 (Arbitrum)
const NETWORKS = [
  { id: 10, name: 'optimism' },
  { id: 42161, name: 'arbitrum' }
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Optional API key for Overtime V2
    const overtimeApiKey = Deno.env.get('OVERTIME_API_KEY') || '11111111-1111-1111-1111-111111111111';

    console.log('Fetching Overtime V2 markets...');

    let allMarkets: any[] = [];

    // Fetch from both networks
    for (const network of NETWORKS) {
      try {
        console.log(`Fetching from ${network.name} (network ${network.id})...`);

        const url = `${OVERTIME_API_BASE}/networks/${network.id}/markets?ungroup=true&status=open`;
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': overtimeApiKey
          }
        });

        if (!response.ok) {
          console.error(`Error from ${network.name}: ${response.status} ${response.statusText}`);
          continue;
        }

        const data = await response.json();
        
        // Handle both grouped and ungrouped response formats
        let markets: any[] = [];
        
        if (Array.isArray(data)) {
          markets = data;
        } else if (data.markets && Array.isArray(data.markets)) {
          markets = data.markets;
        } else if (typeof data === 'object') {
          // Grouped by sport/league - flatten
          for (const sport of Object.values(data)) {
            if (typeof sport === 'object' && sport !== null) {
              for (const league of Object.values(sport as Record<string, any>)) {
                if (Array.isArray(league)) {
                  markets = markets.concat(league);
                }
              }
            }
          }
        }

        markets = markets.map((m: any) => ({ ...m, network: network.name, networkId: network.id }));
        allMarkets = allMarkets.concat(markets);
        console.log(`Found ${markets.length} markets on ${network.name}`);

      } catch (networkError) {
        console.error(`Error fetching ${network.name}:`, networkError);
      }
    }

    if (allMarkets.length === 0) {
      console.log('No markets found from Overtime V2 API');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No active Overtime markets found',
          markets_count: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let savedCount = 0;
    let priceCount = 0;

    for (const market of allMarkets) {
      try {
        // Only process moneyline/winner markets (type 'winner' or typeId 0)
        if (market.type !== 'winner' && market.typeId !== 0) continue;
        
        // Skip if no teams
        if (!market.homeTeam || !market.awayTeam) continue;

        // Create title matching Azuro format for better matching
        const title = `${market.homeTeam} vs ${market.awayTeam}`;
        const slug = `thales-${market.network}-${market.gameId}`;

        // Extract odds from the normalizedImplied field (already probability 0-1)
        const odds = market.odds || [];
        let yesPrice = 0.5;
        
        if (odds.length >= 2) {
          // odds[0] = home win, odds[1] = away win (for 2-way)
          // odds[0] = home, odds[1] = away, odds[2] = draw (for 3-way)
          const homeOdds = odds[0]?.normalizedImplied || odds[0]?.decimal;
          
          if (typeof homeOdds === 'number') {
            // normalizedImplied is already a probability (0-1)
            if (homeOdds <= 1) {
              yesPrice = homeOdds;
            } else {
              // It's decimal odds, convert to probability
              yesPrice = 1 / homeOdds;
            }
          }
        }

        // Skip invalid odds
        if (yesPrice <= 0 || yesPrice >= 1) continue;

        // Calculate resolution date from maturity timestamp or maturityDate
        let resolutionDate: string | null = null;
        if (market.maturityDate) {
          resolutionDate = market.maturityDate;
        } else if (market.maturity) {
          resolutionDate = new Date(market.maturity * 1000).toISOString();
        }

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
            description: `${market.homeTeam} vs ${market.awayTeam} - ${market.leagueName || market.sport} (Overtime ${market.network})`,
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
            volume_24h: 0,
            total_volume: 0,
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
        message: `Saved ${savedCount} Overtime markets with ${priceCount} prices`,
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
