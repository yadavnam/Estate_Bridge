-- ============================================================
-- Run this in Supabase Dashboard → SQL Editor
-- Fixes: "Rate limit verification failed" error
-- ============================================================

-- Step 1: Ensure otp_rate_limits table exists
CREATE TABLE IF NOT EXISTS public.otp_rate_limits (
    rate_limit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_address    VARCHAR(50)  NOT NULL,
    phone_number  VARCHAR(20)  NOT NULL,
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Step 2: Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_otp_rate_limits_ip      ON public.otp_rate_limits(ip_address);
CREATE INDEX IF NOT EXISTS idx_otp_rate_limits_phone   ON public.otp_rate_limits(phone_number);
CREATE INDEX IF NOT EXISTS idx_otp_rate_limits_created ON public.otp_rate_limits(created_at);

-- Step 3: Enable RLS
ALTER TABLE public.otp_rate_limits ENABLE ROW LEVEL SECURITY;

-- Step 4: Allow service_role full access (needed for SECURITY DEFINER function)
DROP POLICY IF EXISTS otp_rate_limits_admin_all ON public.otp_rate_limits;
CREATE POLICY otp_rate_limits_admin_all ON public.otp_rate_limits
    FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

-- Step 5: Re-create the RPC function with SECURITY DEFINER
-- This makes it run as the function owner (postgres), bypassing RLS
CREATE OR REPLACE FUNCTION public.check_and_increment_otp_limit(
    p_ip    VARCHAR,
    p_phone VARCHAR
)
RETURNS BOOLEAN AS $$
DECLARE
    v_phone_10m_count INT := 0;
    v_ip_10m_count    INT := 0;
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

    -- All limits passed — log this request
    INSERT INTO public.otp_rate_limits (ip_address, phone_number, created_at)
    VALUES (p_ip, p_phone, v_now);

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Grant execute permission to service_role explicitly
GRANT EXECUTE ON FUNCTION public.check_and_increment_otp_limit(VARCHAR, VARCHAR) TO service_role;

-- Verify: should return TRUE for a test call
-- SELECT public.check_and_increment_otp_limit('127.0.0.1', '+910000000000');
