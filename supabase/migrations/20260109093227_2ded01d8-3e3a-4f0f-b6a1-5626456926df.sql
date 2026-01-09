-- Schedule fetch-manifold every 15 minutes (offset by 7 minutes)
SELECT cron.schedule(
  'fetch-manifold-markets',
  '7,22,37,52 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://fnwwiqvsefwddelakkdl.supabase.co/functions/v1/fetch-manifold',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);