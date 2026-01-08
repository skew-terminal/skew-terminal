-- Add platform column to markets table
ALTER TABLE public.markets ADD COLUMN IF NOT EXISTS platform text NOT NULL DEFAULT 'kalshi';

-- Create index for faster platform queries
CREATE INDEX IF NOT EXISTS idx_markets_platform ON public.markets(platform);

-- Create market_mappings table for matching markets across platforms
CREATE TABLE IF NOT EXISTS public.market_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market_a_id UUID NOT NULL REFERENCES public.markets(id) ON DELETE CASCADE,
  market_b_id UUID NOT NULL REFERENCES public.markets(id) ON DELETE CASCADE,
  similarity_score DECIMAL NOT NULL,
  manual_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(market_a_id, market_b_id)
);

-- Enable RLS
ALTER TABLE public.market_mappings ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Market mappings are publicly readable" 
ON public.market_mappings 
FOR SELECT 
USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_market_mappings_updated_at
BEFORE UPDATE ON public.market_mappings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();