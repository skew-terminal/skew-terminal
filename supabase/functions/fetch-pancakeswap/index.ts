import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const BSC_RPC_URL = Deno.env.get('BSC_RPC_URL')!;

// PancakeSwap Prediction Contract on BSC
const PREDICTION_CONTRACT = '0x18B2A687610328590Bc8F2e5fEdDe3b582A49cdA';

// Contract ABI for reading rounds
const PREDICTION_ABI = [
  'function currentEpoch() view returns (uint256)',
  'function rounds(uint256) view returns (tuple(uint256 epoch, uint256 startTimestamp, uint256 lockTimestamp, uint256 closeTimestamp, int256 lockPrice, int256 closePrice, uint256 lockOracleId, uint256 closeOracleId, uint256 totalAmount, uint256 bullAmount, uint256 bearAmount, uint256 rewardBaseCalAmount, uint256 rewardAmount, bool oracleCalled))'
];

interface PredictionRound {
  epoch: number;
  bullAmount: string;
  bearAmount: string;
  totalAmount: string;
  lockPrice: string;
  startTimestamp: number;
  lockTimestamp: number;
  closeTimestamp: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    console.log('Fetching PancakeSwap Predictions from BSC...');

    // Get current epoch
    const epochResponse = await fetch(BSC_RPC_URL, {
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

    // Fetch last 5 rounds
    const rounds: PredictionRound[] = [];
    
    for (let i = 0; i < 5; i++) {
      const epoch = currentEpoch - i;
      
      // Encode the rounds(epoch) call
      const epochHex = epoch.toString(16).padStart(64, '0');
      const callData = `0x8e7ea5b2${epochHex}`; // rounds(uint256) selector
      
      const roundResponse = await fetch(BSC_RPC_URL, {
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
      
      if (!roundResult.error && roundResult.result && roundResult.result !== '0x') {
        // Parse the round data (simplified - actual decoding would need proper ABI parsing)
        const data = roundResult.result.slice(2);
        
        // Extract key values (positions based on struct layout)
        const totalAmount = BigInt('0x' + data.slice(576, 640)).toString();
        const bullAmount = BigInt('0x' + data.slice(640, 704)).toString();
        const bearAmount = BigInt('0x' + data.slice(704, 768)).toString();
        
        if (BigInt(totalAmount) > 0) {
          rounds.push({
            epoch,
            totalAmount,
            bullAmount,
            bearAmount,
            lockPrice: '0',
            startTimestamp: 0,
            lockTimestamp: 0,
            closeTimestamp: 0
          });
        }
      }
    }

    console.log(`Fetched ${rounds.length} active PancakeSwap rounds`);

    // Store as whale trades (large bets)
    for (const round of rounds) {
      const totalBNB = parseFloat(round.totalAmount) / 1e18;
      
      if (totalBNB > 10) { // Only track rounds with >10 BNB
        // Get or create whale wallet for PancakeSwap contract
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
          const bullBNB = parseFloat(round.bullAmount) / 1e18;
          const bearBNB = parseFloat(round.bearAmount) / 1e18;
          const bullPercent = (bullBNB / totalBNB) * 100;

          await supabase.from('whale_trades').upsert({
            wallet_id: wallet.id,
            tx_hash: `pancake-epoch-${round.epoch}`,
            amount: totalBNB,
            action: 'prediction',
            side: bullPercent > 50 ? 'bull' : 'bear',
            price: bullPercent,
            executed_at: new Date().toISOString()
          }, { onConflict: 'tx_hash' });
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        current_epoch: currentEpoch,
        rounds_fetched: rounds.length,
        rpc_status: 'connected'
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
