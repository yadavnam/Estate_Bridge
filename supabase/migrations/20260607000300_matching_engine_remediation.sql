-- 1. Add Unique Constraint on (requirement_id, property_id) to prevent duplicate matches
CREATE UNIQUE INDEX IF NOT EXISTS idx_matching_reqs_unique_pair 
ON public.matching_requests(requirement_id, property_id);

-- 2. Create the Trigger Function with Optimized Geographic Filtering and Cleanup
CREATE OR REPLACE FUNCTION public.recalculate_matches_on_change()
RETURNS TRIGGER AS $$
DECLARE
    v_rec RECORD;
    v_score NUMERIC;
BEGIN
    -- Handling changes on requirements
    IF TG_TABLE_NAME = 'requirements' THEN
        -- If deactivated or soft-deleted, purge all matches for this requirement
        IF NEW.deleted_at IS NOT NULL OR NEW.status = 'Withdrawn' THEN
            DELETE FROM public.matching_requests WHERE requirement_id = NEW.requirement_id;
            RETURN NEW;
        END IF;

        -- Loop through and upsert compatibility matches for active properties in the same city
        FOR v_rec IN 
            SELECT property_id, dealer_id 
            FROM public.dealer_properties 
            WHERE deleted_at IS NULL 
              AND status = 'Active' 
              AND LOWER(city) = LOWER(NEW.city)
        LOOP
            v_score := public.calculate_match_score(v_rec.property_id, NEW.requirement_id);
            IF v_score > 0 THEN
                INSERT INTO public.matching_requests (requirement_id, property_id, dealer_id, match_score, status)
                VALUES (NEW.requirement_id, v_rec.property_id, v_rec.dealer_id, v_score, 'Submitted')
                ON CONFLICT (requirement_id, property_id) 
                DO UPDATE SET match_score = EXCLUDED.match_score;
            ELSE
                DELETE FROM public.matching_requests 
                WHERE requirement_id = NEW.requirement_id 
                  AND property_id = v_rec.property_id;
            END IF;
        END LOOP;

        -- Cleanup any matches for this requirement that are in a different city now
        -- (e.g. if the requirement's city was changed)
        DELETE FROM public.matching_requests
        WHERE requirement_id = NEW.requirement_id
          AND property_id NOT IN (
              SELECT property_id 
              FROM public.dealer_properties 
              WHERE LOWER(city) = LOWER(NEW.city)
          );

    -- Handling changes on properties
    ELSIF TG_TABLE_NAME = 'dealer_properties' THEN
        -- If deactivated or soft-deleted, purge all matches for this property
        IF NEW.deleted_at IS NOT NULL OR NEW.status <> 'Active' THEN
            DELETE FROM public.matching_requests WHERE property_id = NEW.property_id;
            RETURN NEW;
        END IF;

        -- Loop through and upsert compatibility matches for active requirements in the same city
        FOR v_rec IN 
            SELECT requirement_id 
            FROM public.requirements 
            WHERE deleted_at IS NULL 
              AND status <> 'Withdrawn' 
              AND LOWER(city) = LOWER(NEW.city)
        LOOP
            v_score := public.calculate_match_score(NEW.property_id, v_rec.requirement_id);
            IF v_score > 0 THEN
                INSERT INTO public.matching_requests (requirement_id, property_id, dealer_id, match_score, status)
                VALUES (v_rec.requirement_id, NEW.property_id, NEW.dealer_id, v_score, 'Submitted')
                ON CONFLICT (requirement_id, property_id) 
                DO UPDATE SET match_score = EXCLUDED.match_score;
            ELSE
                DELETE FROM public.matching_requests 
                WHERE requirement_id = v_rec.requirement_id 
                  AND property_id = NEW.property_id;
            END IF;
        END LOOP;

        -- Cleanup any matches for this property that are in a different city now
        -- (e.g. if the property's city was changed)
        DELETE FROM public.matching_requests
        WHERE property_id = NEW.property_id
          AND requirement_id NOT IN (
              SELECT requirement_id 
              FROM public.requirements 
              WHERE LOWER(city) = LOWER(NEW.city)
          );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Bind the Triggers to requirements and dealer_properties tables
DROP TRIGGER IF EXISTS recalculate_matches_requirements ON public.requirements;
CREATE TRIGGER recalculate_matches_requirements
    AFTER INSERT OR UPDATE OF property_type, budget_min, budget_max, city, area, area_min, area_max, deleted_at, status
    ON public.requirements
    FOR EACH ROW EXECUTE FUNCTION public.recalculate_matches_on_change();

DROP TRIGGER IF EXISTS recalculate_matches_properties ON public.dealer_properties;
CREATE TRIGGER recalculate_matches_properties
    AFTER INSERT OR UPDATE OF property_type, price, city, area, area_size, status, deleted_at
    ON public.dealer_properties
    FOR EACH ROW EXECUTE FUNCTION public.recalculate_matches_on_change();
