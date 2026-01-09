-- Rename columns to be platform-agnostic
ALTER TABLE public.market_mappings 
  RENAME COLUMN market_a_id TO market_id_platform1;

ALTER TABLE public.market_mappings 
  RENAME COLUMN market_b_id TO market_id_platform2;

-- Drop old constraint if exists and add new unique constraint
ALTER TABLE public.market_mappings
  DROP CONSTRAINT IF EXISTS market_mappings_market_a_id_market_b_id_key;

ALTER TABLE public.market_mappings
  ADD CONSTRAINT unique_market_pair UNIQUE (market_id_platform1, market_id_platform2);