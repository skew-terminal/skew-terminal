-- Add platform columns to market_mappings table
ALTER TABLE public.market_mappings 
ADD COLUMN IF NOT EXISTS platform1 text,
ADD COLUMN IF NOT EXISTS platform2 text;

-- Add index for faster queries by platform pair
CREATE INDEX IF NOT EXISTS idx_market_mappings_platforms ON public.market_mappings(platform1, platform2);