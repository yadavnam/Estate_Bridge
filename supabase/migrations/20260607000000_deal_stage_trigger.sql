-- Trigger function to enforce dealer stage transition authority at DB/API layer
CREATE OR REPLACE FUNCTION check_deal_stage_transition_authority()
RETURNS TRIGGER AS $$
BEGIN
    -- Verify if the modifying user is a dealer
    IF is_dealer(auth.uid()) THEN
        -- 1. Block transition to prohibited stages
        IF new.current_stage IN ('Token Paid', 'Documentation', 'Registration', 'Closed Won') THEN
            IF old.current_stage IS NULL OR old.current_stage <> new.current_stage THEN
                RAISE EXCEPTION 'Database Lifecycle Restriction: Dealers are not authorized to transition deals to %.', new.current_stage;
            END IF;
        END IF;

        -- 2. Block transition out of prohibited stages
        IF old.current_stage IN ('Token Paid', 'Documentation', 'Registration', 'Closed Won') THEN
            IF old.current_stage <> new.current_stage THEN
                RAISE EXCEPTION 'Database Lifecycle Restriction: Dealers are not authorized to transition deals out of %.', old.current_stage;
            END IF;
        END IF;
    END IF;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind the trigger to the deals table
DROP TRIGGER IF EXISTS enforce_deal_stage_restrictions ON public.deals;
CREATE TRIGGER enforce_deal_stage_restrictions
  BEFORE UPDATE ON public.deals
  FOR EACH ROW EXECUTE FUNCTION check_deal_stage_transition_authority();
