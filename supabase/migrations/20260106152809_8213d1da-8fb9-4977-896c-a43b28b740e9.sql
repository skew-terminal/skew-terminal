-- Create enum for market status
CREATE TYPE public.market_status AS ENUM ('active', 'resolved', 'suspended');

-- Create enum for market category
CREATE TYPE public.market_category AS ENUM ('crypto', 'politics', 'sports', 'economy', 'other');

-- Create enum for platform
CREATE TYPE public.platform AS ENUM ('polymarket', 'kalshi', 'drift', 'other');

-- Markets table - stores prediction market events
CREATE TABLE public.markets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  category public.market_category NOT NULL DEFAULT 'other',
  status public.market_status NOT NULL DEFAULT 'active',
  resolution_date TIMESTAMPTZ,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Prices table - stores price data from different platforms
CREATE TABLE public.prices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  market_id UUID NOT NULL REFERENCES public.markets(id) ON DELETE CASCADE,
  platform public.platform NOT NULL,
  yes_price DECIMAL(10,4) NOT NULL,
  no_price DECIMAL(10,4) NOT NULL,
  volume_24h DECIMAL(18,2) DEFAULT 0,
  total_volume DECIMAL(18,2) DEFAULT 0,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Spreads table - stores calculated arbitrage opportunities
CREATE TABLE public.spreads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  market_id UUID NOT NULL REFERENCES public.markets(id) ON DELETE CASCADE,
  buy_platform public.platform NOT NULL,
  sell_platform public.platform NOT NULL,
  buy_price DECIMAL(10,4) NOT NULL,
  sell_price DECIMAL(10,4) NOT NULL,
  skew_percentage DECIMAL(6,2) NOT NULL,
  potential_profit DECIMAL(10,2),
  is_active BOOLEAN NOT NULL DEFAULT true,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Whale wallets table - tracks large traders
CREATE TABLE public.whale_wallets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  address TEXT NOT NULL UNIQUE,
  label TEXT,
  chain TEXT NOT NULL DEFAULT 'polygon',
  total_pnl DECIMAL(18,2) DEFAULT 0,
  pnl_24h DECIMAL(18,2) DEFAULT 0,
  pnl_change DECIMAL(6,2) DEFAULT 0,
  trade_count INTEGER DEFAULT 0,
  win_rate DECIMAL(5,2) DEFAULT 0,
  last_active_at TIMESTAMPTZ,
  is_tracked BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Whale trades table - stores individual whale transactions
CREATE TABLE public.whale_trades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_id UUID NOT NULL REFERENCES public.whale_wallets(id) ON DELETE CASCADE,
  market_id UUID REFERENCES public.markets(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  side TEXT NOT NULL,
  amount DECIMAL(18,2) NOT NULL,
  price DECIMAL(10,4),
  tx_hash TEXT,
  executed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.markets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spreads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whale_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whale_trades ENABLE ROW LEVEL SECURITY;

-- Public read access for all tables (market data is public)
CREATE POLICY "Markets are publicly readable" ON public.markets FOR SELECT USING (true);
CREATE POLICY "Prices are publicly readable" ON public.prices FOR SELECT USING (true);
CREATE POLICY "Spreads are publicly readable" ON public.spreads FOR SELECT USING (true);
CREATE POLICY "Whale wallets are publicly readable" ON public.whale_wallets FOR SELECT USING (true);
CREATE POLICY "Whale trades are publicly readable" ON public.whale_trades FOR SELECT USING (true);

-- Create indexes for performance
CREATE INDEX idx_prices_market_id ON public.prices(market_id);
CREATE INDEX idx_prices_recorded_at ON public.prices(recorded_at DESC);
CREATE INDEX idx_spreads_market_id ON public.spreads(market_id);
CREATE INDEX idx_spreads_skew ON public.spreads(skew_percentage DESC);
CREATE INDEX idx_spreads_active ON public.spreads(is_active) WHERE is_active = true;
CREATE INDEX idx_whale_trades_wallet_id ON public.whale_trades(wallet_id);
CREATE INDEX idx_whale_trades_executed_at ON public.whale_trades(executed_at DESC);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply triggers
CREATE TRIGGER update_markets_updated_at
  BEFORE UPDATE ON public.markets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_whale_wallets_updated_at
  BEFORE UPDATE ON public.whale_wallets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.prices;
ALTER PUBLICATION supabase_realtime ADD TABLE public.spreads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.whale_trades;