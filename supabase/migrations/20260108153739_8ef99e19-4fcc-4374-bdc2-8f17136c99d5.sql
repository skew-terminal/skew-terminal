-- Enable pg_cron and pg_net extensions
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Grant usage to postgres role
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

-- JOB 1: Fetch Kalshi every 5 minutes
SELECT cron.schedule(
  'fetch-kalshi',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://fnwwiqvsefwddelakkdl.supabase.co/functions/v1/fetch-kalshi',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZud3dpcXZzZWZ3ZGRlbGFra2RsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3MTEyNTgsImV4cCI6MjA4MzI4NzI1OH0.Y5R7987vlARXI7SB6S6exy4bo81e5sbunjdd8TU94R4"}'::jsonb
  );
  $$
);

-- JOB 2: Fetch Polymarket 1 minute after Kalshi
SELECT cron.schedule(
  'fetch-polymarket',
  '1-56/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://fnwwiqvsefwddelakkdl.supabase.co/functions/v1/fetch-polymarket',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZud3dpcXZzZWZ3ZGRlbGFra2RsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3MTEyNTgsImV4cCI6MjA4MzI4NzI1OH0.Y5R7987vlARXI7SB6S6exy4bo81e5sbunjdd8TU94R4"}'::jsonb
  );
  $$
);

-- JOB 3: Match Markets 2 minutes after Kalshi  
SELECT cron.schedule(
  'match-markets',
  '2-57/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://fnwwiqvsefwddelakkdl.supabase.co/functions/v1/match-markets',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZud3dpcXZzZWZ3ZGRlbGFra2RsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3MTEyNTgsImV4cCI6MjA4MzI4NzI1OH0.Y5R7987vlARXI7SB6S6exy4bo81e5sbunjdd8TU94R4"}'::jsonb
  );
  $$
);

-- JOB 4: Calculate Spreads 3 minutes after Kalshi
SELECT cron.schedule(
  'calculate-spreads',
  '3-58/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://fnwwiqvsefwddelakkdl.supabase.co/functions/v1/calculate-spreads',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZud3dpcXZzZWZ3ZGRlbGFra2RsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3MTEyNTgsImV4cCI6MjA4MzI4NzI1OH0.Y5R7987vlARXI7SB6S6exy4bo81e5sbunjdd8TU94R4"}'::jsonb
  );
  $$
);