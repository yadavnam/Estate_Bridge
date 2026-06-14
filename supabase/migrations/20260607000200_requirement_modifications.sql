-- TABLE: REQUIREMENT_MODIFICATION_REQUESTS
CREATE TABLE IF NOT EXISTS public.requirement_modification_requests (
    request_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requirement_id UUID NOT NULL REFERENCES public.requirements(requirement_id) ON DELETE CASCADE,
    lead_employee_id UUID NOT NULL REFERENCES public.employees(employee_id) ON DELETE CASCADE,
    proposed_specs JSONB NOT NULL, -- Holds: property_type, budget_min, budget_max, city, area, area_min, area_max, additional_notes
    status VARCHAR(50) NOT NULL DEFAULT 'Pending', -- 'Pending', 'Confirmed', 'Approved', 'Rejected'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT check_req_mod_status CHECK (status IN ('Pending', 'Confirmed', 'Approved', 'Rejected'))
);

-- Enable RLS
ALTER TABLE public.requirement_modification_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY req_mod_admin_all ON public.requirement_modification_requests
    FOR ALL TO authenticated USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

CREATE POLICY req_mod_employee_all ON public.requirement_modification_requests
    FOR ALL TO authenticated USING (is_employee(auth.uid()));

CREATE POLICY req_mod_customer_select ON public.requirement_modification_requests
    FOR SELECT TO authenticated USING (is_customer(auth.uid()));

CREATE POLICY req_mod_customer_update ON public.requirement_modification_requests
    FOR UPDATE TO authenticated USING (is_customer(auth.uid())) WITH CHECK (is_customer(auth.uid()));
