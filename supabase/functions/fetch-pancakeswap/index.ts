import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// PancakeSwap Prediction Contract on BSC
const BSC_RPC = 'https://bsc-dataseed.binance.org/';
const PREDICTION_CONTRACT = '0x18B2A687610328590Bc8F2e5fEdDe3b582A49cdA';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    console.log('Fetching PancakeSwap Predictions from BSC...');

    // Get current epoch
    const epochResponse = await fetch(BSC_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_call',
        params: [{
          to: PREDICTION_CONTRACT,
          data: '0x76671808' // currentEpoch() selector
        }, 'latest']
      })
    });

    const epochResult = await epochResponse.json();
    
    if (epochResult.error) {
      throw new Error(`RPC error: ${epochResult.error.message}`);
    }

    const currentEpoch = parseInt(epochResult.result, 16);
    console.log(`Current PancakeSwap epoch: ${currentEpoch}`);

    let marketsUpserted = 0;
    let pricesInserted = 0;

    // Check if contract is paused
    const pausedResponse = await fetch(BSC_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 2,
        method: 'eth_call',
        params: [{
          to: PREDICTION_CONTRACT,
          data: '0x5c975abb' // paused() selector
        }, 'latest']
      })
    });
    const pausedResult = await pausedResponse.json();
    const isPaused = pausedResult.result && pausedResult.result !== '0x0000000000000000000000000000000000000000000000000000000000000000';
    console.log(`Contract paused: ${isPaused}`);

    // Fetch rounds - try older ones (100-200 epochs back for historical data)
    for (let i = 100; i <= 110; i++) {
      const epoch = currentEpoch - i;
      
      try {
        // Encode the rounds(epoch) call
        const epochHex = epoch.toString(16).padStart(64, '0');
        const callData = `0x8e7ea5b2${epochHex}`; // rounds(uint256) selector
        
        const roundResponse = await fetch(BSC_RPC, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: epoch,
            method: 'eth_call',
            params: [{
              to: PREDICTION_CONTRACT,
              data: callData
            }, 'latest']
          })
        });

        const roundResult = await roundResponse.json();
        
        console.log(`Epoch ${epoch} result:`, roundResult.error ? 'error' : (roundResult.result ? `data len ${roundResult.result.length}` : 'empty'));
        
        if (roundResult.error || !roundResult.result || roundResult.result === '0x') {
          console.log(`Round ${epoch} skipped:`, roundResult.error?.message || 'empty result');
          continue;
        }

        // Parse the round data
        const data = roundResult.result.slice(2);
        
        // Log first round data for debugging
        if (i === 0) {
          console.log(`Data length: ${data.length}, first 200 chars: ${data.slice(0, 200)}`);
        }
        
        // Extract values (positions based on struct layout)
        const totalAmount = BigInt('0x' + data.slice(576, 640));
        const bullAmount = BigInt('0x' + data.slice(640, 704));
        const bearAmount = BigInt('0x' + data.slice(704, 768));
        
        if (i === 0) {
          console.log(`Epoch ${epoch}: total=${totalAmount}, bull=${bullAmount}, bear=${bearAmount}`);
        }
        
        if (totalAmount === BigInt(0)) continue;

        const totalBNB = Number(totalAmount) / 1e18;
        const bullBNB = Number(bullAmount) / 1e18;
        const bearBNB = Number(bearAmount) / 1e18;

        // Calculate probabilities
        const bullProb = bullBNB / totalBNB;
        const bearProb = bearBNB / totalBNB;

        const slug = `pancakeswap-epoch-${epoch}`;
        const title = `BNB Price Round ${epoch}`;

        // Upsert market
        const { data: marketData, error: marketError } = await supabase
          .from('markets')
          .upsert({
            slug,
            title,
            description: 'BNB/USD 5-minute price prediction on PancakeSwap',
            category: 'crypto',
            platform: 'pancakeswap',
            status: 'active',
            resolution_date: new Date(Date.now() + 5 * 60000).toISOString(),
            updated_at: new Date().toISOString()
          }, { onConflict: 'slug' })
          .select('id')
          .single();

        if (marketError) {
          console.error('Error upserting market:', marketError.message);
          continue;
        }

        marketsUpserted++;

        // Insert price data
        const { error: priceError } = await supabase.from('prices').insert({
          market_id: marketData.id,
          platform: 'pancakeswap',
          yes_price: Math.round(bullProb * 100) / 100,
          no_price: Math.round(bearProb * 100) / 100,
          volume_24h: totalBNB,
          total_volume: totalBNB
        });

        if (!priceError) pricesInserted++;

        // Also track as whale trade if >50 BNB
        if (totalBNB > 50) {
          const { data: wallet } = await supabase
            .from('whale_wallets')
            .upsert({
              address: PREDICTION_CONTRACT,
              chain: 'bsc',
              label: 'PancakeSwap Prediction',
              is_tracked: true,
              last_active_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }, { onConflict: 'address' })
            .select('id')
            .single();

          if (wallet) {
            await supabase.from('whale_trades').upsert({
              wallet_id: wallet.id,
              tx_hash: `pancake-epoch-${epoch}`,
              amount: totalBNB,
              action: 'prediction',
              side: bullProb > 0.5 ? 'bull' : 'bear',
              price: bullProb * 100,
              executed_at: new Date().toISOString()
            }, { onConflict: 'tx_hash' });
          }
        }
      } catch (err) {
        console.error(`Error processing epoch ${epoch}:`, err);
      }
    }

    console.log(`Upserted ${marketsUpserted} markets, inserted ${pricesInserted} prices`);

    return new Response(
      JSON.stringify({
        success: true,
        current_epoch: currentEpoch,
        markets_upserted: marketsUpserted,
        prices_inserted: pricesInserted
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in fetch-pancakeswap:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
