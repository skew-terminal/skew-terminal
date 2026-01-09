import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Claude API configuration
const CLAUDE_API_KEY = Deno.env.get('CLAUDE_API_KEY') || '';
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';

// Quick filter to reduce AI calls (FREE)
function quickFilter(market1: any, market2: any): boolean {
  // 1. Category must match
  if (market1.category !== market2.category) return false;
  
  // 2. End dates within 7 days (if available)
  if (market1.resolution_date && market2.resolution_date) {
    const date1 = new Date(market1.resolution_date);
    const date2 = new Date(market2.resolution_date);
    const daysDiff = Math.abs(date1.getTime() - date2.getTime()) / (1000 * 60 * 60 * 24);
    if (daysDiff > 7) return false;
  }
  
  // 3. At least 2 common keywords
  const keywords1 = extractKeywords(market1.title);
  const keywords2 = extractKeywords(market2.title);
  const commonKeywords = keywords1.filter(k => keywords2.includes(k));
  if (commonKeywords.length < 2) return false;
  
  return true; // Candidate for AI check
}

function extractKeywords(title: string): string[] {
  const stopWords = ['will', 'the', 'in', 'on', 'at', 'to', 'a', 'be', 'by', 'for', 'of', 'is', 'win', 'wins', 'what', 'who', 'when', 'where', 'how', 'which'];
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopWords.includes(word));
}

// Check if events are the same using Claude AI
async function checkWithClaude(market1: any, market2: any): Promise<any> {
  const prompt = `Are these two prediction market events asking about THE SAME outcome? Be very strict.

Event 1:
Title: "${market1.title}"
Platform: ${market1.platform}
Category: ${market1.category}
End date: ${market1.resolution_date || 'N/A'}
Description: ${market1.description || 'N/A'}

Event 2:
Title: "${market2.title}"
Platform: ${market2.platform}
Category: ${market2.category}
End date: ${market2.resolution_date || 'N/A'}
Description: ${market2.description || 'N/A'}

RULES for matching:
1. Must resolve to EXACTLY the same outcome (same person, team, price level, event)
2. Must have same timeframe (within a few days)
3. Must be asking the same specific question
4. "Trump wins election" = "Donald Trump elected president" → SAME
5. "Lakers win championship" ≠ "Lakers win next game" → DIFFERENT
6. "Bitcoin $100k" ≠ "Bitcoin $90k" → DIFFERENT
7. "Fed cuts rates March" = "Federal Reserve lowers rates in March" → SAME

Respond ONLY with valid JSON (no markdown, no backticks):
{"same_event": true/false, "confidence": 0-100, "reasoning": "brief explanation"}`;

  try {
    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 200,
        messages: [
          { role: 'user', content: prompt }
        ]
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Claude API error:', error);
      return { same_event: false, confidence: 0, reasoning: 'API error' };
    }

    const data = await response.json();
    const textContent = data.content[0].text;
    
    // Parse JSON response
    const cleaned = textContent.replace(/```json\n?|```\n?/g, '').trim();
    const result = JSON.parse(cleaned);
    
    return result;
    
  } catch (error) {
    console.error('Error calling Claude API:', error);
    return { same_event: false, confidence: 0, reasoning: 'Error' };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Starting AI-powered market matching...');

    // Get all platforms
    const platforms = ['kalshi', 'polymarket', 'azuro', 'predictit', 'manifold'];
    const allMarkets: Record<string, any[]> = {};

    for (const platform of platforms) {
      const { data } = await supabase
        .from('markets')
        .select('id, title, category, slug, platform, resolution_date, description')
        .eq('platform', platform)
        .eq('status', 'active')
        .limit(100);
      
      allMarkets[platform] = data || [];
      console.log(`Loaded ${data?.length || 0} markets from ${platform}`);
    }

    let matchCount = 0;
    let aiCallsCount = 0;
    let filteredOutCount = 0;
    let cacheHits = 0;

    // Match all platform pairs
    for (let i = 0; i < platforms.length; i++) {
      for (let j = i + 1; j < platforms.length; j++) {
        const platform1 = platforms[i];
        const platform2 = platforms[j];
        
        console.log(`\n=== Matching ${platform1} vs ${platform2} ===`);

        for (const market1 of allMarkets[platform1]) {
          for (const market2 of allMarkets[platform2]) {
            
            // STEP 1: Quick filter (FREE)
            if (!quickFilter(market1, market2)) {
              filteredOutCount++;
              continue;
            }

            // STEP 2: Check cache first (FREE)
            const { data: cached } = await supabase
              .from('ai_matching_cache')
              .select('*')
              .eq('market1_id', market1.id)
              .eq('market2_id', market2.id)
              .single();

            let aiResult;
            
            const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
            
            if (cached && cached.checked_at > sevenDaysAgo) {
              // Use cache if less than 7 days old
              aiResult = {
                same_event: cached.is_same_event,
                confidence: cached.confidence,
                reasoning: cached.reasoning
              };
              cacheHits++;
              console.log(`Cache hit for "${market1.title.substring(0, 30)}..." vs "${market2.title.substring(0, 30)}..."`);
            } else {
              // STEP 3: Ask Claude AI (PAID)
              aiResult = await checkWithClaude(market1, market2);
              aiCallsCount++;
              
              console.log(`AI Check: "${market1.title.substring(0, 40)}..." vs "${market2.title.substring(0, 40)}..."`);
              console.log(`Result: ${aiResult.same_event ? 'MATCH' : 'NO MATCH'} (confidence: ${aiResult.confidence}%)`);
              console.log(`Reasoning: ${aiResult.reasoning}`);

              // Save to cache
              await supabase.from('ai_matching_cache').upsert({
                market1_id: market1.id,
                market2_id: market2.id,
                is_same_event: aiResult.same_event,
                confidence: aiResult.confidence,
                reasoning: aiResult.reasoning,
                checked_at: new Date().toISOString()
              }, {
                onConflict: 'market1_id,market2_id'
              });
            }

            // Save mapping if confident match
            if (aiResult.same_event && aiResult.confidence >= 80) {
              const { error } = await supabase.from('market_mappings').upsert({
                market_id_platform1: market1.id,
                market_id_platform2: market2.id,
                platform1: platform1,
                platform2: platform2,
                similarity_score: aiResult.confidence / 100,
                manual_verified: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }, {
                onConflict: 'market_id_platform1,market_id_platform2'
              });

              if (!error) {
                matchCount++;
                console.log(`✅ SAVED MATCH #${matchCount}`);
              } else {
                console.error('Error saving match:', error);
              }
            }
          }
        }
      }
    }

    console.log(`\n=== SUMMARY ===`);
    console.log(`Total matches found: ${matchCount}`);
    console.log(`AI API calls made: ${aiCallsCount}`);
    console.log(`Cache hits: ${cacheHits}`);
    console.log(`Filtered out (quick check): ${filteredOutCount}`);
    console.log(`Estimated cost: $${(aiCallsCount * 0.00135).toFixed(4)}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        matches: matchCount,
        ai_calls: aiCallsCount,
        cache_hits: cacheHits,
        filtered_out: filteredOutCount,
        estimated_cost: aiCallsCount * 0.00135
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in match-markets:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
