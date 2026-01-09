-- Schedule fetch-predictit every 10 minutes (offset by 3 minutes from other jobs)
SELECT cron.schedule(
  'fetch-predictit-markets',
  '3,13,23,33,43,53 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://fnwwiqvsefwddelakkdl.supabase.co/functions/v1/fetch-predictit',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);