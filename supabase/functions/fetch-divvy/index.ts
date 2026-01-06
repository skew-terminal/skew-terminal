import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const SOLANA_RPC_URL = Deno.env.get('SOLANA_RPC_URL')!;

// Divvy.bet Program ID on Solana
const DIVVY_PROGRAM_ID = 'DivvyBetProgramIdHere'; // TODO: Replace with actual program ID

interface DivvyMarket {
  pubkey: string;
  title: string;
  description: string;
  yesPrice: number;
  noPrice: number;
  volume: number;
  endTime: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    console.log('Fetching Divvy.bet markets from Solana...');
    
    // Fetch program accounts from Divvy.bet
    // Note: This is a simplified example - actual implementation would need
    // to decode Divvy.bet's specific account structure
    const response = await fetch(SOLANA_RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getProgramAccounts',
        params: [
          DIVVY_PROGRAM_ID,
          {
            encoding: 'base64',
            filters: [
              { dataSize: 500 } // Approximate size of market account
            ]
          }
        ]
      })
    });

    const rpcResult = await response.json();
    
    if (rpcResult.error) {
      console.log('Divvy.bet program not found or no markets available:', rpcResult.error);
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Divvy.bet integration ready - awaiting program ID configuration',
          markets_count: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const accounts = rpcResult.result || [];
    console.log(`Found ${accounts.length} Divvy.bet accounts`);

    // Process and store markets
    // TODO: Implement actual account deserialization based on Divvy.bet's IDL
    const processedMarkets: DivvyMarket[] = [];

    for (const market of processedMarkets) {
      // Upsert market
      const { data: marketData, error: marketError } = await supabase
        .from('markets')
        .upsert({
          slug: `divvy-${market.pubkey}`,
          title: market.title,
          description: market.description,
          category: 'other',
          status: 'active',
          resolution_date: new Date(market.endTime * 1000).toISOString(),
          updated_at: new Date().toISOString()
        }, { onConflict: 'slug' })
        .select('id')
        .single();

      if (marketError) {
        console.error('Error upserting Divvy market:', marketError);
        continue;
      }

      // Insert price data
      await supabase.from('prices').insert({
        market_id: marketData.id,
        platform: 'divvy',
        yes_price: market.yesPrice,
        no_price: market.noPrice,
        volume_24h: market.volume,
        total_volume: market.volume
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Divvy.bet fetch completed',
        markets_count: processedMarkets.length,
        rpc_status: 'connected'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in fetch-divvy:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
