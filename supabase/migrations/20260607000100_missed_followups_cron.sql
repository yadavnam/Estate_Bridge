-- Ensure cron extension is active
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule background cron job running hourly
SELECT cron.schedule(
    'mark-missed-followups-hourly',
    '0 * * * *',
    $$
    UPDATE public.follow_ups
    SET status = 'Missed'
    WHERE status = 'Pending'
      AND next_followup_date < (CURRENT_TIMESTAMP - INTERVAL '12 hours');
    $$
);
