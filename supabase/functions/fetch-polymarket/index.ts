import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BITQUERY_API_KEY = Deno.env.get('BITQUERY_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// Polymarket CTF Exchange contract on Polygon
const POLYMARKET_CTF_ADDRESS = '0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Fetching Polymarket data via Bitquery...');

    if (!BITQUERY_API_KEY) {
      throw new Error('BITQUERY_API_KEY not configured');
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // GraphQL query to fetch recent trades from Polymarket CTF Exchange
    const query = `
      query PolymarketTrades {
        EVM(network: matic, dataset: realtime) {
          DEXTrades(
            where: {
              Trade: {
                Dex: {
                  SmartContract: {
                    is: "${POLYMARKET_CTF_ADDRESS}"
                  }
                }
              }
            }
            limit: { count: 100 }
            orderBy: { descending: Block_Time }
          ) {
            Block {
              Time
            }
            Trade {
              Amount
              AmountInUSD
              Price
              Side {
                Currency {
                  Symbol
                  Name
                  SmartContract
                }
                Amount
                AmountInUSD
              }
              Buyer
              Seller
            }
            Transaction {
              Hash
            }
          }
        }
      }
    `;

    const response = await fetch('https://streaming.bitquery.io/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': BITQUERY_API_KEY,
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Bitquery API error:', errorText);
      throw new Error(`Bitquery API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Bitquery response:', JSON.stringify(data).substring(0, 500));

    const trades = data?.data?.EVM?.DEXTrades || [];
    console.log(`Found ${trades.length} trades from Polymarket`);

    // Process and store trades
    const processedTrades = [];
    for (const trade of trades) {
      const tradeData = {
        platform: 'polymarket' as const,
        market_id: trade.Trade?.Side?.Currency?.SmartContract || 'unknown',
        trade_type: 'buy' as const,
        amount: parseFloat(trade.Trade?.Amount) || 0,
        price: parseFloat(trade.Trade?.Price) || 0,
        tx_hash: trade.Transaction?.Hash,
        traded_at: trade.Block?.Time ? new Date(trade.Block.Time).toISOString() : new Date().toISOString(),
      };
      processedTrades.push(tradeData);
    }

    // Insert trades into whale_trades table (for large trades)
    const largeTrades = processedTrades.filter(t => t.amount > 1000);
    if (largeTrades.length > 0) {
      const { error: insertError } = await supabase
        .from('whale_trades')
        .upsert(largeTrades, { onConflict: 'tx_hash' });

      if (insertError) {
        console.error('Error inserting trades:', insertError);
      } else {
        console.log(`Inserted ${largeTrades.length} whale trades`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        trades_found: trades.length,
        whale_trades_stored: largeTrades.length,
        sample_trades: processedTrades.slice(0, 5),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in fetch-polymarket:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
