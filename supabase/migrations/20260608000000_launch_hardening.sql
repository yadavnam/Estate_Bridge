-- 1. HARDEN NOTIFICATIONS ROW LEVEL SECURITY (RLS)
-- Drop the wildcard insert policy to deny direct insertion by client roles (authenticated, anon).
-- Only triggers or service role contexts (which bypass RLS) can create notifications.
DROP POLICY IF EXISTS notify_insert ON public.notifications;

-- 2. CREATE OTP RATE LIMITING DATABASE TABLE
CREATE TABLE IF NOT EXISTS public.otp_rate_limits (
    rate_limit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_address VARCHAR(50) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Index columns for fast check lookups
CREATE INDEX IF NOT EXISTS idx_otp_rate_limits_ip ON public.otp_rate_limits(ip_address);
CREATE INDEX IF NOT EXISTS idx_otp_rate_limits_phone ON public.otp_rate_limits(phone_number);
CREATE INDEX IF NOT EXISTS idx_otp_rate_limits_created ON public.otp_rate_limits(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE public.otp_rate_limits ENABLE ROW LEVEL SECURITY;

-- Block all client reads/writes (only system functions/service role may access)
DROP POLICY IF EXISTS otp_rate_limits_admin_all ON public.otp_rate_limits;
CREATE POLICY otp_rate_limits_admin_all ON public.otp_rate_limits
    FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

-- 3. CREATE TRANSACTION-SAFE RATE LIMITING ENFORCEMENT RPC
CREATE OR REPLACE FUNCTION public.check_and_increment_otp_limit(
    p_ip VARCHAR,
    p_phone VARCHAR
)
RETURNS BOOLEAN AS $$
DECLARE
    v_phone_10m_count INT := 0;
    v_ip_10m_count INT := 0;
    v_phone_24h_count INT := 0;
    v_now TIMESTAMP WITH TIME ZONE := CURRENT_TIMESTAMP;
BEGIN
    -- 1. Phone number 10-minute check (Limit: 5 requests / 10 minutes)
    SELECT COUNT(*) INTO v_phone_10m_count
    FROM public.otp_rate_limits
    WHERE phone_number = p_phone
      AND created_at >= (v_now - INTERVAL '10 minutes');

    IF v_phone_10m_count >= 5 THEN
        RETURN FALSE;
    END IF;

    -- 2. IP address 10-minute check (Limit: 20 requests / 10 minutes)
    SELECT COUNT(*) INTO v_ip_10m_count
    FROM public.otp_rate_limits
    WHERE ip_address = p_ip
      AND created_at >= (v_now - INTERVAL '10 minutes');

    IF v_ip_10m_count >= 20 THEN
        RETURN FALSE;
    END IF;

    -- 3. Phone number 24-hour check (Limit: 20 requests / 24 hours)
    SELECT COUNT(*) INTO v_phone_24h_count
    FROM public.otp_rate_limits
    WHERE phone_number = p_phone
      AND created_at >= (v_now - INTERVAL '24 hours');

    IF v_phone_24h_count >= 20 THEN
        RETURN FALSE;
    END IF;

    -- All limits passed, log request
    INSERT INTO public.otp_rate_limits (ip_address, phone_number, created_at)
    VALUES (p_ip, p_phone, v_now);

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. CONFIGURE AUTOMATED PURGE CRON JOB
-- Cleans up stale rate-limiting records older than 30 days
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- SELECT cron.unschedule('purge-stale-otp-rate-limits');
SELECT cron.schedule(
    'purge-stale-otp-rate-limits',
    '0 2 * * *', -- Runs daily at 2:00 AM
    $$
    DELETE FROM public.otp_rate_limits
    WHERE created_at < (CURRENT_TIMESTAMP - INTERVAL '30 days');
    $$
);
