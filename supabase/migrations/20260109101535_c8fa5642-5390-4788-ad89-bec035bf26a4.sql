-- Create AI matching cache table
CREATE TABLE IF NOT EXISTS public.ai_matching_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market1_id UUID REFERENCES markets(id) ON DELETE CASCADE,
  market2_id UUID REFERENCES markets(id) ON DELETE CASCADE,
  is_same_event BOOLEAN,
  confidence INTEGER,
  reasoning TEXT,
  checked_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(market1_id, market2_id)
);

-- Enable RLS
ALTER TABLE public.ai_matching_cache ENABLE ROW LEVEL SECURITY;

-- Public read policy
CREATE POLICY "AI cache is publicly readable" 
ON public.ai_matching_cache 
FOR SELECT 
USING (true);

-- Indexes for performance
CREATE INDEX idx_ai_cache_markets ON public.ai_matching_cache(market1_id, market2_id);
CREATE INDEX idx_ai_cache_date ON public.ai_matching_cache(checked_at);