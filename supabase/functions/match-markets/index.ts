import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ========== ENTITY EXTRACTION SYSTEM ==========
// Each entity has canonical name and variations

interface EntityDefinition {
  canonical: string;
  type: 'person' | 'event' | 'asset' | 'org' | 'date';
  patterns: RegExp[];
  requiredContext?: RegExp[]; // Additional context required for match
}

const ENTITIES: EntityDefinition[] = [
  // === POLITICAL FIGURES ===
  { 
    canonical: 'trump', 
    type: 'person',
    patterns: [/\btrump\b/i, /\bdonald\s+trump\b/i, /\bdonald\s+j\.?\s*trump\b/i]
  },
  { 
    canonical: 'biden', 
    type: 'person',
    patterns: [/\bbiden\b/i, /\bjoe\s+biden\b/i]
  },
  { 
    canonical: 'harris', 
    type: 'person',
    patterns: [/\bharris\b/i, /\bkamala\s+harris\b/i, /\bkamala\b/i]
  },
  { 
    canonical: 'desantis', 
    type: 'person',
    patterns: [/\bdesantis\b/i, /\bron\s+desantis\b/i]
  },
  { 
    canonical: 'newsom', 
    type: 'person',
    patterns: [/\bnewsom\b/i, /\bgavin\s+newsom\b/i]
  },
  { 
    canonical: 'vance', 
    type: 'person',
    patterns: [/\bvance\b/i, /\bjd\s+vance\b/i, /\bj\.?d\.?\s+vance\b/i]
  },
  { 
    canonical: 'musk', 
    type: 'person',
    patterns: [/\bmusk\b/i, /\belon\s+musk\b/i, /\belon\b/i]
  },
  { 
    canonical: 'putin', 
    type: 'person',
    patterns: [/\bputin\b/i, /\bvladimir\s+putin\b/i]
  },
  { 
    canonical: 'zelensky', 
    type: 'person',
    patterns: [/\bzelensk[yi]\b/i, /\bzelensky\b/i]
  },
  { 
    canonical: 'xi', 
    type: 'person',
    patterns: [/\bxi\s+jinping\b/i, /\bxi\b/i]
  },
  
  // === ELECTIONS & POLITICAL EVENTS ===
  { 
    canonical: 'president_2024', 
    type: 'event',
    patterns: [
      /\b2024\b.*\bpresident/i, 
      /\bpresident.*\b2024\b/i,
      /\b2024\b.*\belection\b/i,
      /\belection\b.*\b2024\b/i,
      /\bpresidential\s+election\s+2024\b/i
    ]
  },
  { 
    canonical: 'president_2028', 
    type: 'event',
    patterns: [
      /\b2028\b.*\bpresident/i, 
      /\bpresident.*\b2028\b/i,
      /\b2028\b.*\belection\b/i
    ]
  },
  { 
    canonical: 'gop_nominee_2024', 
    type: 'event',
    patterns: [
      /\brepublican\s+nomin/i,
      /\bgop\s+nomin/i,
      /\brepublican\s+primary/i,
      /\bgop\s+primary/i
    ],
    requiredContext: [/\b2024\b/]
  },
  { 
    canonical: 'dem_nominee_2024', 
    type: 'event',
    patterns: [
      /\bdemocrat(ic)?\s+nomin/i,
      /\bdem\s+nomin/i,
      /\bdemocrat(ic)?\s+primary/i
    ],
    requiredContext: [/\b2024\b/]
  },
  { 
    canonical: 'electoral_college', 
    type: 'event',
    patterns: [/\belectoral\s+college\b/i, /\belectoral\s+vote/i]
  },
  { 
    canonical: 'popular_vote', 
    type: 'event',
    patterns: [/\bpopular\s+vote\b/i]
  },
  
  // === ECONOMIC EVENTS ===
  { 
    canonical: 'fed_rate', 
    type: 'event',
    patterns: [
      /\bfed(eral\s+reserve)?\b.*\brate/i, 
      /\bfomc\b/i,
      /\binterest\s+rate\b/i,
      /\brate\s+(hike|cut|decision)\b/i
    ]
  },
  { 
    canonical: 'inflation_cpi', 
    type: 'event',
    patterns: [/\binflation\b/i, /\bcpi\b/i, /\bconsumer\s+price\s+index\b/i]
  },
  { 
    canonical: 'recession', 
    type: 'event',
    patterns: [/\brecession\b/i, /\beconomic\s+downturn\b/i]
  },
  { 
    canonical: 'gdp', 
    type: 'event',
    patterns: [/\bgdp\b/i, /\bgross\s+domestic\s+product\b/i]
  },
  { 
    canonical: 'unemployment', 
    type: 'event',
    patterns: [/\bunemployment\b/i, /\bjobless\b/i]
  },
  
  // === CRYPTO ASSETS ===
  { 
    canonical: 'bitcoin', 
    type: 'asset',
    patterns: [/\bbitcoin\b/i, /\bbtc\b/i]
  },
  { 
    canonical: 'ethereum', 
    type: 'asset',
    patterns: [/\bethereum\b/i, /\beth\b/i]
  },
  { 
    canonical: 'solana', 
    type: 'asset',
    patterns: [/\bsolana\b/i, /\bsol\b/i]
  },
  
  // === PRICE TARGETS ===
  { 
    canonical: 'btc_100k', 
    type: 'event',
    patterns: [
      /\bbitcoin\b.*\b100\s*k\b/i, 
      /\bbtc\b.*\b100\s*k\b/i,
      /\bbitcoin\b.*\$?100,?000\b/i,
      /\bbtc\b.*\$?100,?000\b/i
    ]
  },
  { 
    canonical: 'btc_150k', 
    type: 'event',
    patterns: [
      /\bbitcoin\b.*\b150\s*k\b/i, 
      /\bbtc\b.*\b150\s*k\b/i,
      /\bbitcoin\b.*\$?150,?000\b/i
    ]
  },
  { 
    canonical: 'eth_10k', 
    type: 'event',
    patterns: [
      /\bethereum\b.*\b10\s*k\b/i, 
      /\beth\b.*\b10\s*k\b/i,
      /\bethereum\b.*\$?10,?000\b/i
    ]
  },
  
  // === MAJOR EVENTS ===
  { 
    canonical: 'super_bowl', 
    type: 'event',
    patterns: [/\bsuper\s*bowl\b/i]
  },
  { 
    canonical: 'world_cup', 
    type: 'event',
    patterns: [/\bworld\s+cup\b/i, /\bfifa\s+world\s+cup\b/i]
  },
  { 
    canonical: 'olympics_2024', 
    type: 'event',
    patterns: [/\bolympic/i],
    requiredContext: [/\b2024\b/]
  },
  { 
    canonical: 'olympics_2028', 
    type: 'event',
    patterns: [/\bolympic/i],
    requiredContext: [/\b2028\b/]
  },
  
  // === GEOPOLITICS ===
  { 
    canonical: 'ukraine_war', 
    type: 'event',
    patterns: [
      /\bukraine\b.*\b(war|conflict|invasion)\b/i,
      /\b(war|conflict|invasion)\b.*\bukraine\b/i,
      /\brussia\b.*\bukraine\b/i
    ]
  },
  { 
    canonical: 'taiwan', 
    type: 'event',
    patterns: [/\btaiwan\b.*\b(china|invasion|conflict)\b/i, /\btaiwan\b/i]
  },
  
  // === TIME PERIODS ===
  { canonical: 'year_2024', type: 'date', patterns: [/\b2024\b/] },
  { canonical: 'year_2025', type: 'date', patterns: [/\b2025\b/] },
  { canonical: 'year_2026', type: 'date', patterns: [/\b2026\b/] },
  { canonical: 'year_2028', type: 'date', patterns: [/\b2028\b/] },
  
  // === SPECIFIC QUESTIONS ===
  { 
    canonical: 'trump_win_2024', 
    type: 'event',
    patterns: [
      /\btrump\b.*\b(win|elected|president)\b.*\b2024\b/i,
      /\b2024\b.*\btrump\b.*\b(win|elected|president)\b/i,
      /\btrump\b.*\bwin\b/i
    ],
    requiredContext: [/\b(2024|election|president)/i]
  },
  { 
    canonical: 'harris_win_2024', 
    type: 'event',
    patterns: [
      /\bharris\b.*\b(win|elected|president)\b/i,
      /\bkamala\b.*\b(win|elected|president)\b/i
    ],
    requiredContext: [/\b(2024|election|president)/i]
  },
];

// Stop words to ignore in word overlap
const STOP_WORDS = new Set([
  'will', 'the', 'in', 'on', 'to', 'a', 'be', 'at', 'by', 'for', 'of',
  'is', 'it', 'an', 'or', 'as', 'if', 'no', 'yes', 'and', 'with', 'this',
  'that', 'from', 'has', 'have', 'not', 'but', 'are', 'was', 'were', 'been',
  'before', 'after', 'during', 'above', 'below', 'between', 'under', 'over',
  'win', 'what', 'who', 'which', 'when', 'where', 'how', 'why',
  'market', 'prediction', 'bet', 'odds', 'price', 'contract'
]);

// Question types that must match
const QUESTION_PATTERNS = {
  win: [/\bwin\b/i, /\bwinner\b/i, /\bwinning\b/i, /\belected\b/i],
  lose: [/\blose\b/i, /\bloser\b/i, /\blosing\b/i, /\bdefeat\b/i],
  above: [/\babove\b/i, /\bover\b/i, /\bexceed\b/i, /\bmore\s+than\b/i, /\bgreater\s+than\b/i, /\b>\b/],
  below: [/\bbelow\b/i, /\bunder\b/i, /\bless\s+than\b/i, /\b<\b/],
  reach: [/\breach\b/i, /\bhit\b/i, /\btouch\b/i],
  before: [/\bbefore\b/i, /\bby\b/i, /\bprior\s+to\b/i],
  after: [/\bafter\b/i, /\bfollowing\b/i],
};

interface Market {
  id: string;
  title: string;
  category: string;
  slug: string;
  platform: string;
  resolution_date?: string;
}

interface ExtractedEntities {
  entities: string[];
  types: Record<string, string>;
  year: number | null;
  questionType: string | null;
  numbers: number[];
}

// Extract all entities from title
function extractEntities(title: string): ExtractedEntities {
  const entities: string[] = [];
  const types: Record<string, string> = {};
  
  for (const def of ENTITIES) {
    // Check if any pattern matches
    const matchesPattern = def.patterns.some(p => p.test(title));
    
    if (matchesPattern) {
      // Check required context if specified
      if (def.requiredContext) {
        const hasContext = def.requiredContext.some(p => p.test(title));
        if (!hasContext) continue;
      }
      
      entities.push(def.canonical);
      types[def.canonical] = def.type;
    }
  }
  
  // Extract year
  const yearMatch = title.match(/\b(202[4-9]|203[0-9])\b/);
  const year = yearMatch ? parseInt(yearMatch[1]) : null;
  
  // Detect question type
  let questionType: string | null = null;
  for (const [qType, patterns] of Object.entries(QUESTION_PATTERNS)) {
    if (patterns.some(p => p.test(title))) {
      questionType = qType;
      break;
    }
  }
  
  // Extract significant numbers (prices, percentages)
  const numbers: number[] = [];
  const numMatches = title.matchAll(/\$?(\d{1,3}(?:,\d{3})*|\d+)(?:\s*k)?\b/gi);
  for (const m of numMatches) {
    let num = parseInt(m[1].replace(/,/g, ''));
    if (m[0].toLowerCase().includes('k')) num *= 1000;
    if (num >= 50 && num !== year) numbers.push(num);
  }
  
  return { entities, types, year, questionType, numbers };
}

// Question semantics detection
interface QuestionSemantics {
  type: 'candidate_wins' | 'winner_attribute' | 'event_outcome' | 'price_target' | 'other';
  subject: string | null;  // Who/what the question is about
  attribute: string | null; // For winner_attribute type
}

function extractQuestionSemantics(title: string): QuestionSemantics {
  const normalized = title.toLowerCase();
  
  // Pattern 1: "Will [Winner/Election winner] be [Catholic/etc]" - asking about winner's attribute
  if (/\b(winner|elected|next president)\b.*\bbe\s+\w+/i.test(title)) {
    const attrMatch = title.match(/\bbe\s+(\w+)/i);
    return { 
      type: 'winner_attribute', 
      subject: null, 
      attribute: attrMatch?.[1]?.toLowerCase() || null 
    };
  }
  
  // Pattern 2: "Will [Candidate Name] win/be elected" - specific candidate outcome
  const candidateMatch = title.match(/\bwill\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(win|be\s+elected|become|get|receive)\b/i);
  if (candidateMatch) {
    return { 
      type: 'candidate_wins', 
      subject: candidateMatch[1].toLowerCase(), 
      attribute: null 
    };
  }
  
  // Pattern 3: "Who will win" - general question (should NOT match specific)
  if (/\bwho\s+will\s+(win|be)\b/i.test(title)) {
    return { type: 'other', subject: null, attribute: null };
  }
  
  // Pattern 4: Price target questions
  if (/\$?\d+[,.]?\d*\s*k?\b/i.test(title) && /\b(reach|hit|above|below|over|under)\b/i.test(title)) {
    const priceMatch = title.match(/\$?(\d+[,.]?\d*)\s*k?/i);
    return { 
      type: 'price_target', 
      subject: priceMatch?.[1] || null, 
      attribute: null 
    };
  }
  
  // Pattern 5: Event outcome (will X happen before Y)
  if (/\bbefore\b/i.test(title) || /\bby\s+(end\s+of|january|february|march|april|may|june|july|august|september|october|november|december|\d{4})\b/i.test(title)) {
    return { type: 'event_outcome', subject: null, attribute: null };
  }
  
  return { type: 'other', subject: null, attribute: null };
}

// Check if two questions are semantically compatible
function areQuestionsCompatible(sem1: QuestionSemantics, sem2: QuestionSemantics): { compatible: boolean; reason: string } {
  // Same type is good start
  if (sem1.type !== sem2.type) {
    return { compatible: false, reason: `type mismatch: ${sem1.type} vs ${sem2.type}` };
  }
  
  // For candidate_wins, subjects must match or be related
  if (sem1.type === 'candidate_wins' && sem2.type === 'candidate_wins') {
    if (sem1.subject && sem2.subject && sem1.subject !== sem2.subject) {
      // Check if they're related (e.g., "Donald" and "Trump")
      const relatedPairs = [
        ['donald', 'trump'], ['joe', 'biden'], ['kamala', 'harris'],
        ['ron', 'desantis'], ['gavin', 'newsom'], ['jd', 'vance']
      ];
      
      const areRelated = relatedPairs.some(pair => 
        (pair.includes(sem1.subject!) && pair.includes(sem2.subject!)) ||
        sem1.subject!.includes(sem2.subject!) ||
        sem2.subject!.includes(sem1.subject!)
      );
      
      if (!areRelated) {
        return { compatible: false, reason: `candidate mismatch: ${sem1.subject} vs ${sem2.subject}` };
      }
    }
  }
  
  // For winner_attribute, attributes must match
  if (sem1.type === 'winner_attribute' && sem2.type === 'winner_attribute') {
    if (sem1.attribute && sem2.attribute && sem1.attribute !== sem2.attribute) {
      return { compatible: false, reason: `attribute mismatch: ${sem1.attribute} vs ${sem2.attribute}` };
    }
  }
  
  return { compatible: true, reason: 'compatible' };
}

// Calculate similarity between two markets
function calculateSimilarity(market1: Market, market2: Market): { score: number; reason: string; isValid: boolean } {
  const ext1 = extractEntities(market1.title);
  const ext2 = extractEntities(market2.title);
  
  let score = 0;
  const reasons: string[] = [];
  
  // === HARD FILTERS (must match) ===
  
  // 1. Must have at least one common non-date entity
  const nonDateEntities1 = ext1.entities.filter(e => ext1.types[e] !== 'date');
  const nonDateEntities2 = ext2.entities.filter(e => ext2.types[e] !== 'date');
  const commonEntities = nonDateEntities1.filter(e => nonDateEntities2.includes(e));
  
  if (commonEntities.length === 0) {
    return { score: 0, reason: 'no common entities', isValid: false };
  }
  
  // 2. If both have years, they must match
  if (ext1.year && ext2.year && ext1.year !== ext2.year) {
    return { score: 0, reason: `year mismatch: ${ext1.year} vs ${ext2.year}`, isValid: false };
  }
  
  // 3. Question type must be compatible
  if (ext1.questionType && ext2.questionType) {
    const incompatible = [
      ['win', 'lose'],
      ['above', 'below'],
      ['before', 'after']
    ];
    
    for (const [a, b] of incompatible) {
      if ((ext1.questionType === a && ext2.questionType === b) ||
          (ext1.questionType === b && ext2.questionType === a)) {
        return { score: 0, reason: `question type mismatch: ${ext1.questionType} vs ${ext2.questionType}`, isValid: false };
      }
    }
  }
  
  // 4. If both have significant numbers, they should be close
  if (ext1.numbers.length > 0 && ext2.numbers.length > 0) {
    const hasMatchingNumber = ext1.numbers.some(n1 => 
      ext2.numbers.some(n2 => Math.abs(n1 - n2) / Math.max(n1, n2) < 0.1) // Within 10%
    );
    if (!hasMatchingNumber) {
      return { score: 0, reason: `number mismatch: [${ext1.numbers}] vs [${ext2.numbers}]`, isValid: false };
    }
  }
  
  // 5. CRITICAL: Question semantics must be compatible
  const sem1 = extractQuestionSemantics(market1.title);
  const sem2 = extractQuestionSemantics(market2.title);
  
  const { compatible, reason: compatReason } = areQuestionsCompatible(sem1, sem2);
  if (!compatible) {
    return { score: 0, reason: compatReason, isValid: false };
  }
  
  // === SCORING ===
  
  // 1. Entity overlap (50% weight)
  const entityScore = commonEntities.length / Math.max(nonDateEntities1.length, nonDateEntities2.length);
  score += 0.5 * entityScore;
  reasons.push(`entities:${commonEntities.join(',')}`);
  
  // 2. Category match (15% weight)
  if (market1.category === market2.category) {
    score += 0.15;
  }
  
  // 3. Question type match (15% weight)
  if (ext1.questionType && ext1.questionType === ext2.questionType) {
    score += 0.15;
    reasons.push(`question:${ext1.questionType}`);
  }
  
  // 4. Year match (10% weight)
  if (ext1.year && ext1.year === ext2.year) {
    score += 0.1;
    reasons.push(`year:${ext1.year}`);
  }
  
  // 5. Word overlap bonus (10% weight)
  const words1 = new Set(
    market1.title.toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 3 && !STOP_WORDS.has(w))
  );
  const words2 = new Set(
    market2.title.toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 3 && !STOP_WORDS.has(w))
  );
  
  const wordIntersection = [...words1].filter(w => words2.has(w));
  const wordUnion = new Set([...words1, ...words2]);
  const wordOverlap = wordIntersection.length / wordUnion.size;
  score += 0.1 * wordOverlap;
  
  // === BOOST for high-confidence matches ===
  
  // Boost if multiple strong entities match (person + event)
  const personMatches = commonEntities.filter(e => ext1.types[e] === 'person');
  const eventMatches = commonEntities.filter(e => ext1.types[e] === 'event');
  
  if (personMatches.length > 0 && eventMatches.length > 0) {
    score += 0.15;
    reasons.push('person+event');
  }
  
  return { 
    score: Math.min(score, 1), 
    reason: reasons.join(' | '), 
    isValid: true 
  };
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

    console.log('Starting improved market matching with entity extraction...');

    // Get markets for matching
    const { data: allMarkets, error: marketsError } = await supabase
      .from('markets')
      .select('id, title, category, slug, platform, resolution_date')
      .eq('status', 'active')
      .in('platform', ['polymarket', 'kalshi', 'predictit', 'manifold'])
      .in('category', ['politics', 'crypto', 'other'])
      .limit(600);

    if (marketsError) throw marketsError;

    // Pre-filter: only keep markets that have at least one extractable entity
    const marketsWithEntities: Array<Market & { extracted: ExtractedEntities }> = [];
    
    for (const market of allMarkets || []) {
      const extracted = extractEntities(market.title);
      // Must have at least one non-date entity
      const hasUsefulEntities = extracted.entities.some(e => extracted.types[e] !== 'date');
      
      if (hasUsefulEntities) {
        marketsWithEntities.push({ ...market as Market, extracted });
      }
    }

    console.log(`Found ${marketsWithEntities.length} markets with extractable entities (from ${allMarkets?.length || 0} total)`);

    // Group by platform
    const marketsByPlatform: Record<string, Array<Market & { extracted: ExtractedEntities }>> = {};
    
    for (const market of marketsWithEntities) {
      const platform = market.platform;
      if (!marketsByPlatform[platform]) {
        marketsByPlatform[platform] = [];
      }
      // Limit per platform to avoid timeout
      if (marketsByPlatform[platform].length < 80) {
        marketsByPlatform[platform].push(market);
      }
    }

    const platforms = Object.keys(marketsByPlatform);
    const platformCounts: Record<string, number> = {};
    for (const p of platforms) {
      platformCounts[p] = marketsByPlatform[p].length;
    }
    console.log(`Loaded markets: ${JSON.stringify(platformCounts)}`);

    // Clear old mappings first
    await supabase
      .from('market_mappings')
      .delete()
      .eq('manual_verified', false);

    const THRESHOLD = 0.55; // Higher threshold for quality
    let matchCount = 0;
    const matches: Array<{ platforms: string; titles: string[]; score: number; reason: string }> = [];

    // Compare platforms
    for (let i = 0; i < platforms.length; i++) {
      for (let j = i + 1; j < platforms.length; j++) {
        const platform1 = platforms[i];
        const platform2 = platforms[j];
        
        const markets1 = marketsByPlatform[platform1];
        const markets2 = marketsByPlatform[platform2];

        console.log(`Matching ${platform1} (${markets1.length}) vs ${platform2} (${markets2.length})`);

        for (const m1 of markets1) {
          let bestMatch: typeof m1 | null = null;
          let bestScore = 0;
          let bestReason = '';

          for (const m2 of markets2) {
            // Quick pre-check: must share at least one entity
            const quickCheck = m1.extracted.entities.some(e => 
              m2.extracted.entities.includes(e) && m1.extracted.types[e] !== 'date'
            );
            if (!quickCheck) continue;

            const { score, reason, isValid } = calculateSimilarity(m1, m2);
            
            if (isValid && score > bestScore && score >= THRESHOLD) {
              bestScore = score;
              bestMatch = m2;
              bestReason = reason;
            }
          }

          if (bestMatch && bestScore >= THRESHOLD) {
            const { error } = await supabase
              .from('market_mappings')
              .upsert({
                market_id_platform1: m1.id,
                market_id_platform2: bestMatch.id,
                platform1: platform1,
                platform2: platform2,
                similarity_score: bestScore,
                manual_verified: false,
                updated_at: new Date().toISOString()
              }, {
                onConflict: 'market_id_platform1,market_id_platform2'
              });

            if (!error) {
              matchCount++;
              matches.push({
                platforms: `${platform1}<>${platform2}`,
                titles: [m1.title.substring(0, 60), bestMatch.title.substring(0, 60)],
                score: Math.round(bestScore * 100),
                reason: bestReason
              });
              console.log(`✓ [${Math.round(bestScore * 100)}%] ${m1.title.substring(0, 45)} <-> ${bestMatch.title.substring(0, 45)}`);
            }
          }
        }
      }
    }

    console.log(`\nSuccessfully matched ${matchCount} high-quality markets`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        matched: matchCount,
        threshold: THRESHOLD,
        platforms: platformCounts,
        totalWithEntities: marketsWithEntities.length,
        matches: matches.slice(0, 30)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in match-markets:', message);
    return new Response(
      JSON.stringify({ error: message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
