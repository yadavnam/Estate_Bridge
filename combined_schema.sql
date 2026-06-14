-- Estate Bridge Database Schema Setup (Supabase / PostgreSQL)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================================================
-- 1. ENUMS AND CUSTOM TYPES
-- =========================================================================
CREATE TYPE user_role AS ENUM ('ADMIN', 'CUSTOMER', 'DEALER', 'EMPLOYEE');
CREATE TYPE dealer_status AS ENUM ('Pending', 'Approved', 'Rejected', 'Blocked');
CREATE TYPE employee_status AS ENUM ('Active', 'Inactive', 'Suspended');
CREATE TYPE property_status AS ENUM ('Active', 'Sold', 'Under Negotiation', 'Inactive');
CREATE TYPE visit_status AS ENUM (
    'Requested', 'Under Review', 'Approved', 'Scheduled', 
    'Completed', 'Closed', 'Rejected', 'Cancelled', 
    'Rescheduled', 'Postponed', 'No Show'
);
CREATE TYPE deal_stage AS ENUM (
    'Interested', 'Negotiation', 'Token Paid', 
    'Documentation', 'Registration', 'Closed Won', 'Closed Lost'
);

-- =========================================================================
-- 2. SCHEMAS AND CORE TABLES
-- =========================================================================

-- TABLE 1: USERS
CREATE TABLE users (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'CUSTOMER',
    mobile_number VARCHAR(20),
    email VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- TABLE 2: CUSTOMERS
CREATE TABLE customers (
    customer_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    mobile VARCHAR(20) NOT NULL,
    city VARCHAR(100) NOT NULL,
    profile_status VARCHAR(50) NOT NULL DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- TABLE 3: DEALERS
CREATE TABLE dealers (
    dealer_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
    company_name VARCHAR(255) NOT NULL,
    owner_name VARCHAR(255) NOT NULL,
    mobile VARCHAR(20) NOT NULL,
    email VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    rera_number VARCHAR(100),
    gst_number VARCHAR(100),
    experience_years INT NOT NULL DEFAULT 0,
    trust_score INT NOT NULL DEFAULT 80,
    dealer_status dealer_status NOT NULL DEFAULT 'Pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- TABLE 4: DEALER_COVERAGE_AREAS
CREATE TABLE dealer_coverage_areas (
    coverage_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dealer_id UUID NOT NULL REFERENCES dealers(dealer_id) ON DELETE CASCADE,
    state VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    area VARCHAR(255) NOT NULL
);

-- TABLE 5: EMPLOYEES
CREATE TABLE employees (
    employee_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
    employee_name VARCHAR(255) NOT NULL,
    designation VARCHAR(100) NOT NULL,
    employee_status employee_status NOT NULL DEFAULT 'Active',
    joining_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- TABLE 6: REQUIREMENTS
CREATE TABLE requirements (
    requirement_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(customer_id) ON DELETE RESTRICT,
    requirement_code VARCHAR(100) UNIQUE NOT NULL,
    property_type VARCHAR(100) NOT NULL,
    budget_min NUMERIC(15,2) NOT NULL,
    budget_max NUMERIC(15,2) NOT NULL,
    city VARCHAR(100) NOT NULL,
    area VARCHAR(255) NOT NULL,
    area_min NUMERIC(10,2) NOT NULL,
    area_max NUMERIC(10,2) NOT NULL,
    additional_notes TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'Submitted',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- TABLE 7: REQUIREMENT_FACILITIES
CREATE TABLE requirement_facilities (
    facility_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requirement_id UUID NOT NULL REFERENCES requirements(requirement_id) ON DELETE CASCADE,
    facility_name VARCHAR(100) NOT NULL
);

-- TABLE 8: REQUIREMENT_AMENITIES
CREATE TABLE requirement_amenities (
    amenity_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requirement_id UUID NOT NULL REFERENCES requirements(requirement_id) ON DELETE CASCADE,
    amenity_name VARCHAR(100) NOT NULL
);

-- TABLE 9: REQUIREMENT_PROPERTY_DETAILS
CREATE TABLE requirement_property_details (
    detail_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requirement_id UUID NOT NULL REFERENCES requirements(requirement_id) ON DELETE CASCADE,
    furnishing VARCHAR(100) NOT NULL,
    property_specific_json JSONB
);

-- TABLE 10: REQUIREMENT_EMPLOYEE_ASSIGNMENTS
CREATE TABLE requirement_employee_assignments (
    assignment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requirement_id UUID NOT NULL REFERENCES requirements(requirement_id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(employee_id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Active',
    is_lead BOOLEAN NOT NULL DEFAULT FALSE
);

-- TABLE 11: REQUIREMENT_NOTES
CREATE TABLE requirement_notes (
    note_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requirement_id UUID NOT NULL REFERENCES requirements(requirement_id) ON DELETE CASCADE,
    author_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    note_text TEXT NOT NULL,
    version INT NOT NULL DEFAULT 1,
    is_latest BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- TABLE 12: REQUIREMENT_STATUS_HISTORY
CREATE TABLE requirement_status_history (
    history_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requirement_id UUID NOT NULL REFERENCES requirements(requirement_id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,
    changed_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    notes TEXT
);

-- TABLE 13: REGISTERED_SITES
CREATE TABLE registered_sites (
    site_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_name VARCHAR(255) NOT NULL,
    builder_name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    area VARCHAR(255) NOT NULL,
    locality VARCHAR(255) NOT NULL,
    google_map_link TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- TABLE 14: SITE_PROPERTY_TYPES
CREATE TABLE site_property_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES registered_sites(site_id) ON DELETE CASCADE,
    property_type VARCHAR(100) NOT NULL
);

-- TABLE 15: SITE_FACILITIES
CREATE TABLE site_facilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES registered_sites(site_id) ON DELETE CASCADE,
    facility_name VARCHAR(100) NOT NULL
);

-- TABLE 16: SITE_MEDIA
CREATE TABLE site_media (
    media_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES registered_sites(site_id) ON DELETE CASCADE,
    file_type VARCHAR(50) NOT NULL,
    file_url TEXT NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- TABLE 17: DEALER_PROPERTIES
CREATE TABLE dealer_properties (
    property_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dealer_id UUID NOT NULL REFERENCES dealers(dealer_id) ON DELETE RESTRICT,
    title VARCHAR(255) NOT NULL,
    property_type VARCHAR(100) NOT NULL,
    price NUMERIC(15,2) NOT NULL,
    city VARCHAR(100) NOT NULL,
    area VARCHAR(255) NOT NULL,
    area_size NUMERIC(10,2) NOT NULL,
    bhk VARCHAR(20),
    facing VARCHAR(50),
    status property_status NOT NULL DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- TABLE 18: PROPERTY_AMENITIES
CREATE TABLE property_amenities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES dealer_properties(property_id) ON DELETE CASCADE,
    amenity_name VARCHAR(100) NOT NULL
);

-- TABLE 19: PROPERTY_FACILITIES
CREATE TABLE property_facilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES dealer_properties(property_id) ON DELETE CASCADE,
    facility_name VARCHAR(100) NOT NULL,
    distance NUMERIC(5,2) NOT NULL
);

-- TABLE 20: PROPERTY_MEDIA
CREATE TABLE property_media (
    media_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES dealer_properties(property_id) ON DELETE CASCADE,
    file_type VARCHAR(50) NOT NULL,
    file_url TEXT NOT NULL
);

-- TABLE 21: VISITS
CREATE TABLE visits (
    visit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(customer_id) ON DELETE RESTRICT,
    requirement_id UUID REFERENCES requirements(requirement_id) ON DELETE SET NULL,
    site_id UUID REFERENCES registered_sites(site_id) ON DELETE RESTRICT,
    property_id UUID REFERENCES dealer_properties(property_id) ON DELETE RESTRICT,
    visit_date DATE NOT NULL,
    visit_time TIME NOT NULL,
    status visit_status NOT NULL DEFAULT 'Requested',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT check_visit_target CHECK (
        (site_id IS NOT NULL AND property_id IS NULL) OR 
        (site_id IS NULL AND property_id IS NOT NULL)
    )
);

-- TABLE 22: VISIT_EMPLOYEES
CREATE TABLE visit_employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visit_id UUID NOT NULL REFERENCES visits(visit_id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(employee_id) ON DELETE CASCADE
);

-- TABLE 23: VISIT_OUTCOMES
CREATE TABLE visit_outcomes (
    outcome_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visit_id UUID NOT NULL REFERENCES visits(visit_id) ON DELETE CASCADE,
    outcome_status VARCHAR(100) NOT NULL,
    notes TEXT,
    created_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- TABLE 24: VISIT_STATUS_HISTORY
CREATE TABLE visit_status_history (
    history_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visit_id UUID NOT NULL REFERENCES visits(visit_id) ON DELETE CASCADE,
    status visit_status NOT NULL,
    changed_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    notes TEXT
);

-- TABLE 25: FOLLOW_UPS
CREATE TABLE follow_ups (
    followup_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(customer_id) ON DELETE CASCADE,
    requirement_id UUID NOT NULL REFERENCES requirements(requirement_id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(employee_id) ON DELETE CASCADE,
    next_followup_date TIMESTAMP WITH TIME ZONE NOT NULL,
    notes TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'Pending'
);

-- TABLE 26: MATCHING_REQUESTS
CREATE TABLE matching_requests (
    request_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dealer_id UUID NOT NULL REFERENCES dealers(dealer_id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES dealer_properties(property_id) ON DELETE CASCADE,
    requirement_id UUID NOT NULL REFERENCES requirements(requirement_id) ON DELETE CASCADE,
    match_score NUMERIC(5,2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Submitted',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- TABLE 27: REQUIREMENT_MARKETPLACE
CREATE TABLE requirement_marketplace (
    marketplace_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requirement_id UUID NOT NULL REFERENCES requirements(requirement_id) ON DELETE CASCADE,
    published_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
    published_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- TABLE 28: DEALS
CREATE TABLE deals (
    deal_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(customer_id) ON DELETE RESTRICT,
    dealer_id UUID NOT NULL REFERENCES dealers(dealer_id) ON DELETE RESTRICT,
    property_id UUID NOT NULL REFERENCES dealer_properties(property_id) ON DELETE RESTRICT,
    requirement_id UUID NOT NULL REFERENCES requirements(requirement_id) ON DELETE RESTRICT,
    current_stage deal_stage NOT NULL DEFAULT 'Interested',
    is_suspended BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- TABLE 29: DEAL_LOST_REASONS
CREATE TABLE deal_lost_reasons (
    reason_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id UUID NOT NULL REFERENCES deals(deal_id) ON DELETE CASCADE,
    reason VARCHAR(255) NOT NULL,
    notes TEXT
);

-- TABLE 30: SUPPORT_TICKETS
CREATE TABLE support_tickets (
    ticket_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(customer_id) ON DELETE CASCADE,
    subject VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Open',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- TABLE 31: SUPPORT_MESSAGES
CREATE TABLE support_messages (
    message_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES support_tickets(ticket_id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    sender_role VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- TABLE 32: FEEDBACKS
CREATE TABLE feedbacks (
    feedback_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(customer_id) ON DELETE RESTRICT,
    site_id UUID REFERENCES registered_sites(site_id) ON DELETE RESTRICT,
    property_id UUID REFERENCES dealer_properties(property_id) ON DELETE RESTRICT,
    visit_id UUID NOT NULL REFERENCES visits(visit_id) ON DELETE CASCADE,
    site_rating INT NOT NULL CHECK (site_rating BETWEEN 1 AND 5),
    visit_rating INT NOT NULL CHECK (visit_rating BETWEEN 1 AND 5),
    comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT check_feedback_target CHECK (
        (site_id IS NOT NULL AND property_id IS NULL) OR 
        (site_id IS NULL AND property_id IS NOT NULL)
    )
);

-- TABLE 33: NOTIFICATIONS
CREATE TABLE notifications (
    notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(100) NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- TABLE 34: AUDIT_LOGS
CREATE TABLE audit_logs (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    action VARCHAR(255) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID NOT NULL,
    old_value JSONB,
    new_value JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- =========================================================================
-- 3. INDEXES FOR PERFORMANCE AND DATA ISOLATION
-- =========================================================================
CREATE INDEX idx_req_emp_assignments ON requirement_employee_assignments(requirement_id, employee_id);
CREATE INDEX idx_visits_customer_status ON visits(customer_id, status);
CREATE INDEX idx_dealer_props ON dealer_properties(dealer_id, status);
CREATE INDEX idx_marketplace_active ON requirement_marketplace(requirement_id) WHERE is_active = TRUE;
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_matching_reqs_scores ON matching_requests(requirement_id, match_score);

-- Partial unique index to enforce exactly one active Lead Assignee per requirement
CREATE UNIQUE INDEX idx_one_lead_per_requirement 
ON requirement_employee_assignments(requirement_id) 
WHERE (is_lead = TRUE AND status = 'Active');

-- =========================================================================
-- 4. DATABASE TRIGGERS
-- =========================================================================

-- Trigger: Automatically copy new Supabase Auth users to public.users and setup initial profiles
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
DECLARE
    v_role user_role := 'CUSTOMER';
BEGIN
    -- Strict Role Assignment Gating:
    -- Trust role from app_metadata (only writeable by service role/admin)
    IF (new.raw_app_meta_data->>'role') IS NOT NULL THEN
        v_role := (new.raw_app_meta_data->>'role')::user_role;
    -- For public signup, allow only DEALER from user_metadata.
    -- Block public assignment of EMPLOYEE and ADMIN.
    ELSIF (new.raw_user_meta_data->>'role') = 'DEALER' THEN
        v_role := 'DEALER';
    ELSE
        v_role := 'CUSTOMER';
    END IF;

    -- Insert into public users table
    INSERT INTO public.users (user_id, role, mobile_number, email, status)
    VALUES (
        new.id, 
        v_role, 
        new.phone, 
        new.email, 
        CASE WHEN v_role = 'DEALER' THEN 'Pending' ELSE 'Active' END
    );

    -- Auto-register customer profile if role is CUSTOMER
    IF v_role = 'CUSTOMER' THEN
        INSERT INTO public.customers (user_id, full_name, email, mobile, city)
        VALUES (
            new.id,
            COALESCE(new.raw_user_meta_data->>'full_name', 'New Customer'),
            new.email,
            COALESCE(new.phone, '0000000000'),
            COALESCE(new.raw_user_meta_data->>'city', 'Unknown')
        );
    -- Auto-register employee profile if role is EMPLOYEE
    ELSIF v_role = 'EMPLOYEE' THEN
        INSERT INTO public.employees (user_id, employee_name, designation)
        VALUES (
            new.id,
            COALESCE(new.raw_user_meta_data->>'employee_name', 'New Employee'),
            COALESCE(new.raw_user_meta_data->>'designation', 'Staff')
        );
    END IF;

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();


-- Trigger: Update updated_at columns automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    new.updated_at = CURRENT_TIMESTAMP;
    RETURN new;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_dealers_updated_at BEFORE UPDATE ON dealers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_employees_updated_at BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_requirements_updated_at BEFORE UPDATE ON requirements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_registered_sites_updated_at BEFORE UPDATE ON registered_sites FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_dealer_properties_updated_at BEFORE UPDATE ON dealer_properties FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_visits_updated_at BEFORE UPDATE ON visits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_deals_updated_at BEFORE UPDATE ON deals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- Trigger: Exclusivity locking rule for Deals (SAWS-8.2 with is_suspended column)
CREATE OR REPLACE FUNCTION handle_deal_exclusivity_lock()
RETURNS TRIGGER AS $$
BEGIN
    -- 1. If a deal transitions to Token Paid:
    --    Flag all other active competing deals as suspended
    IF new.current_stage = 'Token Paid' AND (old.current_stage IS NULL OR old.current_stage <> 'Token Paid') THEN
        UPDATE deals
        SET is_suspended = TRUE
        WHERE requirement_id = new.requirement_id
          AND deal_id <> new.deal_id
          AND current_stage NOT IN ('Closed Won', 'Closed Lost');
    END IF;

    -- 2. If a deal transitions to Closed Won:
    --    Set all competing deals (whether suspended or not) to Closed Lost with reason 'Bought Elsewhere'
    IF new.current_stage = 'Closed Won' AND (old.current_stage IS NULL OR old.current_stage <> 'Closed Won') THEN
        -- Close all other deals
        UPDATE deals
        SET current_stage = 'Closed Lost',
            is_suspended = FALSE
        WHERE requirement_id = new.requirement_id
          AND deal_id <> new.deal_id;

        -- Insert lost reasons
        INSERT INTO deal_lost_reasons (deal_id, reason, notes)
        SELECT d.deal_id, 'Bought Elsewhere', 'Auto-closed due to competing deal completion.'
        FROM deals d
        WHERE d.requirement_id = new.requirement_id
          AND d.deal_id <> new.deal_id
        ON CONFLICT DO NOTHING;
    END IF;

    -- 3. If a deal collapse (transitions from Token Paid to Closed Lost):
    --    Reactivate all suspended competing deals
    IF old.current_stage = 'Token Paid' AND new.current_stage = 'Closed Lost' THEN
        UPDATE deals
        SET is_suspended = FALSE
        WHERE requirement_id = new.requirement_id
          AND is_suspended = TRUE;
    END IF;

    RETURN new;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_deal_stage_changed
  AFTER UPDATE OF current_stage ON deals
  FOR EACH ROW EXECUTE FUNCTION handle_deal_exclusivity_lock();


-- Trigger: Customer Requirement Withdrawal (Cancel visits & Notify employees) (SAWS-10.2)
CREATE OR REPLACE FUNCTION handle_requirement_withdrawal()
RETURNS TRIGGER AS $$
BEGIN
    IF (new.status = 'Withdrawn' AND (old.status IS NULL OR old.status <> 'Withdrawn')) OR
       (new.deleted_at IS NOT NULL AND old.deleted_at IS NULL) THEN
        
        -- Cancel all pending/scheduled visits linked to this requirement
        UPDATE visits
        SET status = 'Cancelled'
        WHERE requirement_id = new.requirement_id
          AND status IN ('Requested', 'Under Review', 'Approved', 'Scheduled', 'Rescheduled', 'Postponed');

        -- Insert notification for assigned employees
        INSERT INTO notifications (user_id, title, message, type)
        SELECT e.user_id, 'Requirement Withdrawn', 'Requirement ' || new.requirement_code || ' has been withdrawn. Linked visits are cancelled.', 'System'
        FROM requirement_employee_assignments rea
        JOIN employees e ON e.employee_id = rea.employee_id
        WHERE rea.requirement_id = new.requirement_id
          AND rea.status = 'Active';
          
        -- Insert notification for the customer
        INSERT INTO notifications (user_id, title, message, type)
        SELECT c.user_id, 'Requirement Cancelled', 'Your requirement ' || new.requirement_code || ' has been withdrawn and linked visits cancelled.', 'System'
        FROM customers c
        WHERE c.customer_id = new.customer_id;
    END IF;
    RETURN new;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_requirement_withdrawn
  AFTER UPDATE OF status, deleted_at ON requirements
  FOR EACH ROW EXECUTE FUNCTION handle_requirement_withdrawal();


-- Trigger: Employee Deactivation (Remove assignments, keep visits active, alert Admin) (SAWS-10.1)
CREATE OR REPLACE FUNCTION handle_employee_deactivation()
RETURNS TRIGGER AS $$
BEGIN
    IF new.employee_status IN ('Suspended', 'Inactive') AND (old.employee_status IS NULL OR old.employee_status NOT IN ('Suspended', 'Inactive')) THEN
        -- Remove employee from active requirement assignments
        UPDATE requirement_employee_assignments
        SET status = 'Inactive'
        WHERE employee_id = new.employee_id
          AND status = 'Active';

        -- Remove employee from active visit assignments
        DELETE FROM visit_employees
        WHERE employee_id = new.employee_id;

        -- Alert admin to assign a replacement
        INSERT INTO notifications (user_id, title, message, type)
        SELECT u.user_id, 'Employee Deactivated - Reassign Visits', 
               'Employee ' || new.employee_name || ' was deactivated. Please reassign their upcoming visits.', 'AdminAlert'
        FROM users u
        WHERE u.role = 'ADMIN' AND u.deleted_at IS NULL;
    END IF;
    RETURN new;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_employee_deactivated
  AFTER UPDATE OF employee_status ON employees
  FOR EACH ROW EXECUTE FUNCTION handle_employee_deactivation();


-- Trigger: Block Registered Site soft-deletion if active visits exist (SAWS-5.2)
CREATE OR REPLACE FUNCTION prevent_registered_site_deletion()
RETURNS TRIGGER AS $$
BEGIN
    IF (new.deleted_at IS NOT NULL AND old.deleted_at IS NULL) OR 
       (new.status = 'Inactive' AND (old.status IS NULL OR old.status <> 'Inactive')) THEN
        
        IF EXISTS (
            SELECT 1 FROM visits
            WHERE site_id = new.site_id
              AND status IN ('Requested', 'Under Review', 'Approved', 'Scheduled', 'Rescheduled', 'Postponed')
        ) THEN
            RAISE EXCEPTION 'Cannot delete or deactivate registered site because it is linked to active scheduled visits.';
        END IF;
    END IF;
    RETURN new;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_registered_site_deleted
  BEFORE UPDATE OF deleted_at, status ON registered_sites
  FOR EACH ROW EXECUTE FUNCTION prevent_registered_site_deletion();


-- Triggers: Automatically maintain Status History Tables
CREATE OR REPLACE FUNCTION log_requirement_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') OR (old.status <> new.status) THEN
        INSERT INTO requirement_status_history (requirement_id, status, changed_by, changed_at, notes)
        VALUES (
            new.requirement_id,
            new.status,
            auth.uid(),
            CURRENT_TIMESTAMP,
            'Status transitioned from ' || COALESCE(old.status, 'None') || ' to ' || new.status
        );
    END IF;
    RETURN new;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_requirement_status_change
  AFTER INSERT OR UPDATE OF status ON requirements
  FOR EACH ROW EXECUTE FUNCTION log_requirement_status_change();

CREATE OR REPLACE FUNCTION log_visit_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') OR (old.status <> new.status) THEN
        INSERT INTO visit_status_history (visit_id, status, changed_by, changed_at, notes)
        VALUES (
            new.visit_id,
            new.status,
            auth.uid(),
            CURRENT_TIMESTAMP,
            'Status transitioned from ' || COALESCE(old.status::text, 'None') || ' to ' || new.status::text
        );
    END IF;
    RETURN new;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_visit_status_change
  AFTER INSERT OR UPDATE OF status ON visits
  FOR EACH ROW EXECUTE FUNCTION log_visit_status_change();


-- Triggers: Keep public.users and auth.users raw_app_meta_data synced on status/role changes
CREATE OR REPLACE FUNCTION public.sync_user_status_to_auth()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE auth.users
    SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('status', new.status, 'role', new.role::text)
    WHERE id = new.user_id;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_user_status_changed
  AFTER INSERT OR UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.sync_user_status_to_auth();


CREATE OR REPLACE FUNCTION public.sync_dealer_status_to_users()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.users
    SET status = new.dealer_status::text
    WHERE user_id = new.user_id;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_dealer_status_changed
  AFTER UPDATE OF dealer_status ON public.dealers
  FOR EACH ROW EXECUTE FUNCTION public.sync_dealer_status_to_users();


CREATE OR REPLACE FUNCTION public.sync_employee_status_to_users()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.users
    SET status = new.employee_status::text
    WHERE user_id = new.user_id;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_employee_status_changed_sync
  AFTER UPDATE OF employee_status ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.sync_employee_status_to_users();


-- Trigger: Enforce active requirement limit of 3 per customer
CREATE OR REPLACE FUNCTION check_active_requirement_limit()
RETURNS TRIGGER AS $$
DECLARE
    v_active_count INT;
BEGIN
    SELECT COUNT(*) INTO v_active_count
    FROM public.requirements
    WHERE customer_id = new.customer_id
      AND status <> 'Withdrawn'
      AND deleted_at IS NULL;

    IF v_active_count >= 3 THEN
        RAISE EXCEPTION 'Customer cannot have more than 3 active requirements at any time.';
    END IF;
    RETURN new;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_active_requirement_limit
  BEFORE INSERT ON public.requirements
  FOR EACH ROW EXECUTE FUNCTION check_active_requirement_limit();

-- Trigger: Enforce visit cancellation cutoff (CP-1)
CREATE OR REPLACE FUNCTION check_visit_cancellation_policy()
RETURNS TRIGGER AS $$
DECLARE
    v_visit_timestamp TIMESTAMP WITH TIME ZONE;
    v_user_role VARCHAR(50);
BEGIN
    -- Only check if status is transitioning to 'Cancelled'
    IF new.status = 'Cancelled' AND old.status <> 'Cancelled' THEN
        -- Get the current user's role
        v_user_role := COALESCE(
            (SELECT role::varchar FROM public.users WHERE user_id = auth.uid()),
            'CUSTOMER'
        );

        -- Enforce cutoff only for CUSTOMER role
        IF v_user_role = 'CUSTOMER' THEN
            -- Combine date and time and assume Asia/Kolkata timezone
            v_visit_timestamp := (old.visit_date + old.visit_time) AT TIME ZONE 'Asia/Kolkata';
            
            -- If visit is less than 3 hours from now, block it
            IF v_visit_timestamp - now() < INTERVAL '3 hours' THEN
                RAISE EXCEPTION 'Visits cannot be cancelled less than 3 hours before the scheduled time.';
            END IF;
        END IF;
    END IF;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER enforce_visit_cancellation_policy
  BEFORE UPDATE OF status ON public.visits
  FOR EACH ROW EXECUTE FUNCTION check_visit_cancellation_policy();





-- =========================================================================
-- 5. MATCHING ENGINE CORE SQL RPC (TRD-9 Performance Target)
-- =========================================================================
CREATE OR REPLACE FUNCTION calculate_match_score(p_prop_id UUID, p_req_id UUID)
RETURNS NUMERIC AS $$
DECLARE
    v_prop_type_weight NUMERIC := 20;
    v_location_weight NUMERIC := 25;
    v_budget_weight NUMERIC := 20;
    v_area_weight NUMERIC := 10;
    v_amenities_weight NUMERIC := 15;
    v_facilities_weight NUMERIC := 10;

    v_prop RECORD;
    v_req RECORD;
    
    v_score NUMERIC := 0;
    v_matches_amenities INT := 0;
    v_total_req_amenities INT := 0;
    v_matches_facilities INT := 0;
    v_total_req_facilities INT := 0;
BEGIN
    SELECT * INTO v_prop FROM dealer_properties WHERE property_id = p_prop_id AND deleted_at IS NULL;
    SELECT * INTO v_req FROM requirements WHERE requirement_id = p_req_id AND deleted_at IS NULL;

    -- Hard constraint 1: Property Type (Mandatory matching PMP-7 / SAWS-6.2)
    IF v_prop.property_type <> v_req.property_type THEN
        RETURN 0;
    END IF;
    v_score := v_score + v_prop_type_weight;

    -- Hard constraint 2: City (Mandatory matching PMP-7 / SAWS-6.2)
    IF LOWER(v_prop.city) <> LOWER(v_req.city) THEN
        RETURN 0;
    END IF;

    -- Location scoring (25% weight)
    IF LOWER(v_prop.area) = LOWER(v_req.area) THEN
        v_score := v_score + v_location_weight; -- Same Area gets full score
    ELSE
        v_score := v_score + (v_location_weight * 0.4); -- Same City, different Area gets partial score (40%)
    END IF;

    -- Budget scoring (20% weight)
    -- Price <= budget_max gets full score. Over-budget degrades linearly up to 15% deviation.
    IF v_prop.price <= v_req.budget_max THEN
        v_score := v_score + v_budget_weight;
    ELSIF v_prop.price > v_req.budget_max AND v_prop.price <= (v_req.budget_max * 1.15) THEN
        v_score := v_score + (v_budget_weight * (1 - ((v_prop.price - v_req.budget_max) / (v_req.budget_max * 0.15))));
    END IF;

    -- Area Size scoring (10% weight)
    IF v_prop.area_size >= v_req.area_min AND v_prop.area_size <= v_req.area_max THEN
        v_score := v_score + v_area_weight;
    END IF;

    -- Amenities scoring (15% weight)
    SELECT COUNT(*), COALESCE(SUM(CASE WHEN pa.amenity_name IS NOT NULL THEN 1 ELSE 0 END), 0)
    INTO v_total_req_amenities, v_matches_amenities
    FROM requirement_amenities ra
    LEFT JOIN property_amenities pa ON pa.property_id = p_prop_id AND LOWER(pa.amenity_name) = LOWER(ra.amenity_name)
    WHERE ra.requirement_id = p_req_id;

    IF v_total_req_amenities > 0 THEN
        v_score := v_score + (v_amenities_weight * (v_matches_amenities::NUMERIC / v_total_req_amenities));
    ELSE
        v_score := v_score + v_amenities_weight; -- Default to full if none requested
    END IF;

    -- Nearby Facilities (10% weight)
    SELECT COUNT(*), COALESCE(SUM(CASE WHEN pf.property_id IS NOT NULL THEN 1 ELSE 0 END), 0)
    INTO v_total_req_facilities, v_matches_facilities
    FROM requirement_facilities rf
    LEFT JOIN property_facilities pf ON pf.property_id = p_prop_id AND LOWER(pf.facility_name) = LOWER(rf.facility_name)
    WHERE rf.requirement_id = p_req_id;

    IF v_total_req_facilities > 0 THEN
        v_score := v_score + (v_facilities_weight * (v_matches_facilities::NUMERIC / v_total_req_facilities));
    ELSE
        v_score := v_score + v_facilities_weight; -- Default to full if none requested
    END IF;

    RETURN ROUND(v_score, 2);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =========================================================================
-- 6. SECURITY DEFINER HELPER FUNCTIONS (FOR RLS POLICIES)
-- =========================================================================

-- Check if user is admin
CREATE OR REPLACE FUNCTION is_admin(p_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM users WHERE user_id = p_user_id AND role = 'ADMIN' AND deleted_at IS NULL
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Check if user is employee
CREATE OR REPLACE FUNCTION is_employee(p_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM users WHERE user_id = p_user_id AND role = 'EMPLOYEE' AND deleted_at IS NULL
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Check if user is dealer
CREATE OR REPLACE FUNCTION is_dealer(p_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM users WHERE user_id = p_user_id AND role = 'DEALER' AND deleted_at IS NULL
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Check if user is customer
CREATE OR REPLACE FUNCTION is_customer(p_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM users WHERE user_id = p_user_id AND role = 'CUSTOMER' AND deleted_at IS NULL
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Resolve Customer ID
CREATE OR REPLACE FUNCTION get_customer_id(p_user_id UUID)
RETURNS UUID AS $$
  SELECT customer_id FROM customers WHERE user_id = p_user_id LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- Resolve Dealer ID
CREATE OR REPLACE FUNCTION get_dealer_id(p_user_id UUID)
RETURNS UUID AS $$
  SELECT dealer_id FROM dealers WHERE user_id = p_user_id LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- Resolve Employee ID
CREATE OR REPLACE FUNCTION get_employee_id(p_user_id UUID)
RETURNS UUID AS $$
  SELECT employee_id FROM employees WHERE user_id = p_user_id LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- Check if employee is assigned to a requirement
CREATE OR REPLACE FUNCTION is_employee_assigned_to_requirement(p_user_id UUID, p_req_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM requirement_employee_assignments rea
    JOIN employees e ON e.employee_id = rea.employee_id
    WHERE rea.requirement_id = p_req_id
      AND e.user_id = p_user_id
      AND e.employee_status = 'Active'
      AND rea.status = 'Active'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Check if employee is assigned to a visit
CREATE OR REPLACE FUNCTION is_employee_assigned_to_visit(p_user_id UUID, p_visit_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM visit_employees ve
    JOIN employees e ON e.employee_id = ve.employee_id
    WHERE ve.visit_id = p_visit_id
      AND e.user_id = p_user_id
      AND e.employee_status = 'Active'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Check if employee has an active visit with a dealer (for temporary contact lookup, SAWS-3.1)
CREATE OR REPLACE FUNCTION has_active_visit_with_dealer(p_user_id UUID, p_dealer_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM visits v
    JOIN visit_employees ve ON ve.visit_id = v.visit_id
    JOIN employees e ON e.employee_id = ve.employee_id
    JOIN dealer_properties dp ON dp.property_id = v.property_id
    WHERE e.user_id = p_user_id
      AND dp.dealer_id = p_dealer_id
      AND v.status IN ('Approved', 'Scheduled', 'Rescheduled', 'Postponed')
      AND v.visit_date >= CURRENT_DATE
  );
$$ LANGUAGE sql SECURITY DEFINER;


-- =========================================================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================

-- Enable RLS globally on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE dealers ENABLE ROW LEVEL SECURITY;
ALTER TABLE dealer_coverage_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE requirement_facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE requirement_amenities ENABLE ROW LEVEL SECURITY;
ALTER TABLE requirement_property_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE requirement_employee_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE requirement_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE requirement_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE registered_sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_property_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE dealer_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_amenities ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE visit_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE visit_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE visit_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE matching_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE requirement_marketplace ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_lost_reasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 1. USERS Policies
CREATE POLICY user_admin_all ON users FOR ALL TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY user_read_own ON users FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY employee_read_dealer_user ON users FOR SELECT TO authenticated USING (
    is_employee(auth.uid()) AND EXISTS (
        SELECT 1 FROM dealers d WHERE d.user_id = users.user_id AND has_active_visit_with_dealer(auth.uid(), d.dealer_id)
    )
);

-- 2. CUSTOMERS Policies
CREATE POLICY customer_admin_all ON customers FOR ALL TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY customer_read_update_own ON customers FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY customer_update_own ON customers FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY employee_read_assigned_customer ON customers FOR SELECT TO authenticated USING (
    is_employee(auth.uid()) AND EXISTS (
        SELECT 1 FROM requirements r 
        WHERE r.customer_id = customers.customer_id AND is_employee_assigned_to_requirement(auth.uid(), r.requirement_id)
    )
);

-- 3. DEALERS Policies
CREATE POLICY dealer_admin_all ON dealers FOR ALL TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY dealer_read_update_own ON dealers FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY dealer_update_own ON dealers FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY employee_read_dealers ON dealers FOR SELECT TO authenticated USING (
    is_employee(auth.uid())
);

-- 4. DEALER COVERAGE AREAS Policies
CREATE POLICY dca_admin_all ON dealer_coverage_areas FOR ALL TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY dca_dealer_all ON dealer_coverage_areas FOR ALL TO authenticated USING (dealer_id = get_dealer_id(auth.uid()));
CREATE POLICY dca_employee_customer_select ON dealer_coverage_areas FOR SELECT TO authenticated USING (TRUE);

-- 5. EMPLOYEES Policies
CREATE POLICY emp_admin_all ON employees FOR ALL TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY emp_read_own ON employees FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY emp_read_all ON employees FOR SELECT TO authenticated USING (TRUE);

-- 6. REQUIREMENTS Policies
CREATE POLICY req_admin_all ON requirements FOR ALL TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY req_customer_select_insert ON requirements FOR SELECT TO authenticated USING (customer_id = get_customer_id(auth.uid()));
CREATE POLICY req_customer_insert ON requirements FOR INSERT TO authenticated WITH CHECK (customer_id = get_customer_id(auth.uid()));
CREATE POLICY req_employee_select_update ON requirements FOR ALL TO authenticated USING (
    is_employee(auth.uid()) AND is_employee_assigned_to_requirement(auth.uid(), requirement_id)
);

-- 7 & 8 & 9. REQUIREMENT DETAILS Tables
CREATE POLICY req_details_admin_all ON requirement_facilities FOR ALL TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY req_details_customer_all ON requirement_facilities FOR ALL TO authenticated USING (
    requirement_id IN (SELECT requirement_id FROM requirements WHERE customer_id = get_customer_id(auth.uid()))
);
CREATE POLICY req_details_employee_all ON requirement_facilities FOR ALL TO authenticated USING (
    is_employee(auth.uid()) AND is_employee_assigned_to_requirement(auth.uid(), requirement_id)
);

CREATE POLICY req_amenities_admin_all ON requirement_amenities FOR ALL TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY req_amenities_customer_all ON requirement_amenities FOR ALL TO authenticated USING (
    requirement_id IN (SELECT requirement_id FROM requirements WHERE customer_id = get_customer_id(auth.uid()))
);
CREATE POLICY req_amenities_employee_all ON requirement_amenities FOR ALL TO authenticated USING (
    is_employee(auth.uid()) AND is_employee_assigned_to_requirement(auth.uid(), requirement_id)
);

CREATE POLICY req_prop_details_admin_all ON requirement_property_details FOR ALL TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY req_prop_details_customer_all ON requirement_property_details FOR ALL TO authenticated USING (
    requirement_id IN (SELECT requirement_id FROM requirements WHERE customer_id = get_customer_id(auth.uid()))
);
CREATE POLICY req_prop_details_employee_all ON requirement_property_details FOR ALL TO authenticated USING (
    is_employee(auth.uid()) AND is_employee_assigned_to_requirement(auth.uid(), requirement_id)
);

-- 10. REQUIREMENT EMPLOYEE ASSIGNMENTS Policies
CREATE POLICY req_assignments_admin_all ON requirement_employee_assignments FOR ALL TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY req_assignments_employee_read ON requirement_employee_assignments FOR SELECT TO authenticated USING (
    is_employee(auth.uid())
);

-- 11. REQUIREMENT NOTES Policies (Internal employee notes)
CREATE POLICY req_notes_admin_all ON requirement_notes FOR ALL TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY req_notes_employee_all ON requirement_notes FOR ALL TO authenticated USING (
    is_employee(auth.uid()) AND is_employee_assigned_to_requirement(auth.uid(), requirement_id)
);

-- 12. REQUIREMENT STATUS HISTORY Policies
CREATE POLICY req_history_admin_all ON requirement_status_history FOR ALL TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY req_history_employee_select ON requirement_status_history FOR SELECT TO authenticated USING (
    is_employee(auth.uid()) AND is_employee_assigned_to_requirement(auth.uid(), requirement_id)
);

-- 13 & 14 & 15 & 16. REGISTERED SITES Tables (Public directories)
CREATE POLICY site_admin_all ON registered_sites FOR ALL TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY site_read_all ON registered_sites FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY site_prop_types_admin_all ON site_property_types FOR ALL TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY site_prop_types_read_all ON site_property_types FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY site_facilities_admin_all ON site_facilities FOR ALL TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY site_facilities_read_all ON site_facilities FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY site_media_admin_all ON site_media FOR ALL TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY site_media_read_all ON site_media FOR SELECT TO authenticated USING (TRUE);

-- 17. DEALER PROPERTIES Policies
CREATE POLICY prop_admin_all ON dealer_properties FOR ALL TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY prop_dealer_all ON dealer_properties FOR ALL TO authenticated USING (
    dealer_id = get_dealer_id(auth.uid()) AND EXISTS (
        SELECT 1 FROM dealers WHERE dealer_id = dealer_properties.dealer_id AND dealer_status = 'Approved'
    )
);
CREATE POLICY prop_employee_read ON dealer_properties FOR SELECT TO authenticated USING (
    status = 'Active' AND is_employee(auth.uid())
);

CREATE POLICY prop_customer_read ON dealer_properties FOR SELECT TO authenticated USING (
    status = 'Active' AND is_customer(auth.uid()) AND (
        EXISTS (
            SELECT 1 FROM matching_requests mr
            JOIN requirements r ON r.requirement_id = mr.requirement_id
            WHERE mr.property_id = dealer_properties.property_id
              AND r.customer_id = get_customer_id(auth.uid())
              AND mr.status = 'Approved'
        ) OR
        EXISTS (
            SELECT 1 FROM visits v
            WHERE v.property_id = dealer_properties.property_id
              AND v.customer_id = get_customer_id(auth.uid())
        )
    )
);

-- 18 & 19 & 20. PROPERTY DETAIL Tables
CREATE POLICY prop_amenities_admin_all ON property_amenities FOR ALL TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY prop_amenities_dealer_all ON property_amenities FOR ALL TO authenticated USING (
    property_id IN (SELECT property_id FROM dealer_properties WHERE dealer_id = get_dealer_id(auth.uid()))
);
CREATE POLICY prop_amenities_read_all ON property_amenities FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY prop_facilities_admin_all ON property_facilities FOR ALL TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY prop_facilities_dealer_all ON property_facilities FOR ALL TO authenticated USING (
    property_id IN (SELECT property_id FROM dealer_properties WHERE dealer_id = get_dealer_id(auth.uid()))
);
CREATE POLICY prop_facilities_read_all ON property_facilities FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY prop_media_admin_all ON property_media FOR ALL TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY prop_media_dealer_all ON property_media FOR ALL TO authenticated USING (
    property_id IN (SELECT property_id FROM dealer_properties WHERE dealer_id = get_dealer_id(auth.uid()))
);
CREATE POLICY prop_media_read_all ON property_media FOR SELECT TO authenticated USING (TRUE);

-- 21. VISITS Policies
CREATE POLICY visit_admin_all ON visits FOR ALL TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY visit_customer_all ON visits FOR ALL TO authenticated USING (customer_id = get_customer_id(auth.uid()));
CREATE POLICY visit_employee_all ON visits FOR ALL TO authenticated USING (
    is_employee(auth.uid()) AND (
        is_employee_assigned_to_visit(auth.uid(), visit_id) OR 
        is_employee_assigned_to_requirement(auth.uid(), requirement_id)
    )
);
CREATE POLICY visit_dealer_select ON visits FOR SELECT TO authenticated USING (
    is_dealer(auth.uid()) AND property_id IN (
        SELECT property_id FROM dealer_properties WHERE dealer_id = get_dealer_id(auth.uid())
    )
);

-- 22. VISIT EMPLOYEES Policies
CREATE POLICY visit_emp_admin_all ON visit_employees FOR ALL TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY visit_emp_read_all ON visit_employees FOR SELECT TO authenticated USING (is_employee(auth.uid()));

-- 23. VISIT OUTCOMES Policies
CREATE POLICY outcome_admin_all ON visit_outcomes FOR ALL TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY outcome_employee_all ON visit_outcomes FOR ALL TO authenticated USING (
    is_employee(auth.uid()) AND is_employee_assigned_to_visit(auth.uid(), visit_id)
);
CREATE POLICY outcome_customer_select ON visit_outcomes FOR SELECT TO authenticated USING (
    visit_id IN (SELECT visit_id FROM visits WHERE customer_id = get_customer_id(auth.uid()))
);

-- 24. VISIT STATUS HISTORY Policies
CREATE POLICY visit_history_admin_all ON visit_status_history FOR ALL TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY visit_history_employee_select ON visit_status_history FOR SELECT TO authenticated USING (
    is_employee(auth.uid()) AND is_employee_assigned_to_visit(auth.uid(), visit_id)
);

-- 25. FOLLOW UPS Policies
CREATE POLICY follow_admin_all ON follow_ups FOR ALL TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY follow_employee_all ON follow_ups FOR ALL TO authenticated USING (
    is_employee(auth.uid()) AND (
        employee_id = get_employee_id(auth.uid()) OR 
        is_employee_assigned_to_requirement(auth.uid(), requirement_id)
    )
);

-- 26. MATCHING REQUESTS Policies
CREATE POLICY match_admin_all ON matching_requests FOR ALL TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY match_dealer_all ON matching_requests FOR ALL TO authenticated USING (dealer_id = get_dealer_id(auth.uid()));
CREATE POLICY match_employee_all ON matching_requests FOR ALL TO authenticated USING (
    is_employee(auth.uid()) AND is_employee_assigned_to_requirement(auth.uid(), requirement_id)
);

-- 27. REQUIREMENT MARKETPLACE Policies
CREATE POLICY market_admin_all ON requirement_marketplace FOR ALL TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY market_employee_all ON requirement_marketplace FOR ALL TO authenticated USING (is_employee(auth.uid()));
CREATE POLICY market_dealer_select ON requirement_marketplace FOR SELECT TO authenticated USING (is_dealer(auth.uid()));

-- 28. DEALS Policies
CREATE POLICY deal_admin_all ON deals FOR ALL TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY deal_customer_select ON deals FOR SELECT TO authenticated USING (customer_id = get_customer_id(auth.uid()));
CREATE POLICY deal_employee_all ON deals FOR ALL TO authenticated USING (
    is_employee(auth.uid()) AND is_employee_assigned_to_requirement(auth.uid(), requirement_id)
);
CREATE POLICY deal_dealer_all ON deals FOR ALL TO authenticated USING (
    dealer_id = get_dealer_id(auth.uid())
);

-- 29. DEAL LOST REASONS Policies
CREATE POLICY lost_reason_admin_all ON deal_lost_reasons FOR ALL TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY lost_reason_read ON deal_lost_reasons FOR SELECT TO authenticated USING (
    deal_id IN (
        SELECT deal_id FROM deals WHERE 
        customer_id = get_customer_id(auth.uid()) OR 
        dealer_id = get_dealer_id(auth.uid()) OR 
        (is_employee(auth.uid()) AND is_employee_assigned_to_requirement(auth.uid(), requirement_id))
    )
);

-- 30. SUPPORT TICKETS Policies
CREATE POLICY ticket_admin_all ON support_tickets FOR ALL TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY ticket_customer_all ON support_tickets FOR ALL TO authenticated USING (customer_id = get_customer_id(auth.uid()));
CREATE POLICY ticket_employee_all ON support_tickets FOR ALL TO authenticated USING (is_employee(auth.uid()));

-- 31. SUPPORT MESSAGES Policies
CREATE POLICY msg_admin_all ON support_messages FOR ALL TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY msg_customer_all ON support_messages FOR ALL TO authenticated USING (
    ticket_id IN (SELECT ticket_id FROM support_tickets WHERE customer_id = get_customer_id(auth.uid()))
);
CREATE POLICY msg_employee_all ON support_messages FOR ALL TO authenticated USING (is_employee(auth.uid()));

-- 32. FEEDBACKS Policies
CREATE POLICY feedback_admin_all ON feedbacks FOR ALL TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY feedback_customer_all ON feedbacks FOR ALL TO authenticated USING (customer_id = get_customer_id(auth.uid()));
CREATE POLICY feedback_employee_select ON feedbacks FOR SELECT TO authenticated USING (
    is_employee(auth.uid()) AND EXISTS (
        SELECT 1 FROM visits v WHERE v.visit_id = feedbacks.visit_id AND is_employee_assigned_to_visit(auth.uid(), v.visit_id)
    )
);

-- 33. NOTIFICATIONS Policies
CREATE POLICY notify_all ON notifications FOR ALL TO authenticated USING (user_id = auth.uid());
CREATE POLICY notify_insert ON notifications FOR INSERT TO authenticated WITH CHECK (TRUE);

-- 34. AUDIT LOGS Policies
CREATE POLICY audit_admin_all ON audit_logs FOR SELECT TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY audit_insert ON audit_logs FOR INSERT TO authenticated WITH CHECK (TRUE);


-- =========================================================================
-- 8. TRANSACTION-SAFE ATOMIC REQUIREMENT CREATION RPC
-- =========================================================================
CREATE OR REPLACE FUNCTION create_customer_requirement(
    p_customer_id UUID,
    p_property_type VARCHAR,
    p_budget_min NUMERIC,
    p_budget_max NUMERIC,
    p_city VARCHAR,
    p_area VARCHAR,
    p_area_min NUMERIC,
    p_area_max NUMERIC,
    p_additional_notes TEXT,
    p_furnishing VARCHAR,
    p_amenities VARCHAR[],
    p_facilities VARCHAR[]
)
RETURNS UUID AS $$
DECLARE
    v_req_id UUID;
    v_req_code VARCHAR;
    v_active_count INT;
    v_amenity VARCHAR;
    v_facility_name VARCHAR;
BEGIN
    -- 1. Check active count
    SELECT COUNT(*) INTO v_active_count
    FROM public.requirements
    WHERE customer_id = p_customer_id
      AND status <> 'Withdrawn'
      AND deleted_at IS NULL;

    IF v_active_count >= 3 THEN
        RAISE EXCEPTION 'Customer cannot have more than 3 active requirements at any time.';
    END IF;

    -- 2. Generate requirement code
    v_req_code := 'REQ-' || floor(extract(epoch from clock_timestamp()))::text;

    -- 3. Insert requirement
    INSERT INTO public.requirements (
        customer_id, requirement_code, property_type, 
        budget_min, budget_max, city, area, 
        area_min, area_max, additional_notes, status
    )
    VALUES (
        p_customer_id, v_req_code, p_property_type,
        p_budget_min, p_budget_max, p_city, p_area,
        p_area_min, p_area_max, p_additional_notes, 'Submitted'
    )
    RETURNING requirement_id INTO v_req_id;

    -- 4. Insert amenities
    IF p_amenities IS NOT NULL THEN
        FOREACH v_amenity IN ARRAY p_amenities LOOP
            INSERT INTO public.requirement_amenities (requirement_id, amenity_name)
            VALUES (v_req_id, v_amenity);
        END LOOP;
    END IF;

    -- 5. Insert facilities
    IF p_facilities IS NOT NULL THEN
        FOREACH v_facility_name IN ARRAY p_facilities LOOP
            INSERT INTO public.requirement_facilities (requirement_id, facility_name)
            VALUES (v_req_id, v_facility_name);
        END LOOP;
    END IF;

    -- 6. Insert details
    INSERT INTO public.requirement_property_details (requirement_id, furnishing)
    VALUES (v_req_id, p_furnishing);

    RETURN v_req_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Prevent property deletion or inactivation when linked to active visits, deals, or negotiations
CREATE OR REPLACE FUNCTION prevent_property_deletion_or_inactivation()
RETURNS TRIGGER AS $$
DECLARE
    v_active_visits INT;
    v_active_deals INT;
BEGIN
    IF (TG_OP = 'DELETE') OR 
       (new.deleted_at IS NOT NULL AND old.deleted_at IS NULL) OR
       (new.status IN ('Inactive', 'Sold') AND old.status NOT IN ('Inactive', 'Sold')) THEN
       
        -- Query active visits
        SELECT COUNT(*) INTO v_active_visits
        FROM public.visits
        WHERE property_id = old.property_id
          AND status IN ('Requested', 'Under Review', 'Approved', 'Scheduled', 'Rescheduled', 'Postponed')
          AND deleted_at IS NULL;

        IF v_active_visits > 0 THEN
            RAISE EXCEPTION 'Property cannot be deleted or inactivated while linked to active scheduled visits.';
        END IF;

        -- Query active deals
        SELECT COUNT(*) INTO v_active_deals
        FROM public.deals
        WHERE property_id = old.property_id
          AND current_stage IN ('Interested', 'Negotiation', 'Token Paid', 'Documentation', 'Registration')
          AND deleted_at IS NULL;

        IF v_active_deals > 0 THEN
            RAISE EXCEPTION 'Property cannot be deleted or inactivated while linked to active deals or negotiations.';
        END IF;
    END IF;
    
    IF TG_OP = 'DELETE' THEN
        RETURN old;
    ELSE
        RETURN new;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER enforce_property_protection_rules
  BEFORE UPDATE OR DELETE ON public.dealer_properties
  FOR EACH ROW EXECUTE FUNCTION prevent_property_deletion_or_inactivation();


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
-- PII ANONYMIZATION FUNCTIONS

-- Function to soft delete and anonymize customer
CREATE OR REPLACE FUNCTION public.anonymize_customer(p_customer_id UUID)
RETURNS VOID AS $$
DECLARE
    v_user_id UUID;
    v_redacted_email VARCHAR(255);
BEGIN
    -- Get user_id
    SELECT user_id INTO v_user_id FROM public.customers WHERE customer_id = p_customer_id;
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Customer profile not found.';
    END IF;

    v_redacted_email := 'redacted-customer-' || p_customer_id || '@estatebridge.com';

    -- Update customer profile
    UPDATE public.customers
    SET 
        full_name = 'Redacted Customer',
        email = v_redacted_email,
        mobile = '0000000000',
        city = 'Redacted',
        profile_status = 'Inactive',
        deleted_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE customer_id = p_customer_id;

    -- Update public.users
    UPDATE public.users
    SET 
        email = v_redacted_email,
        mobile_number = '0000000000',
        status = 'Inactive',
        deleted_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE user_id = v_user_id;

    -- Soft delete active requirements for this customer
    UPDATE public.requirements
    SET 
        status = 'Withdrawn',
        deleted_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE customer_id = p_customer_id AND status != 'Withdrawn';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Function to soft delete and anonymize dealer
CREATE OR REPLACE FUNCTION public.anonymize_dealer(p_dealer_id UUID)
RETURNS VOID AS $$
DECLARE
    v_user_id UUID;
    v_redacted_email VARCHAR(255);
BEGIN
    SELECT user_id INTO v_user_id FROM public.dealers WHERE dealer_id = p_dealer_id;
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Dealer profile not found.';
    END IF;

    v_redacted_email := 'redacted-dealer-' || p_dealer_id || '@estatebridge.com';

    -- Update dealer profile
    UPDATE public.dealers
    SET 
        company_name = 'Redacted Company',
        owner_name = 'Redacted Owner',
        mobile = '0000000000',
        email = v_redacted_email,
        address = 'Redacted Address',
        rera_number = 'Redacted',
        gst_number = 'Redacted',
        dealer_status = 'Blocked',
        deleted_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE dealer_id = p_dealer_id;

    -- Update public.users
    UPDATE public.users
    SET 
        email = v_redacted_email,
        mobile_number = '0000000000',
        status = 'Blocked',
        deleted_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE user_id = v_user_id;

    -- Soft delete all properties listed by this dealer
    UPDATE public.dealer_properties
    SET 
        status = 'Inactive',
        deleted_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE dealer_id = p_dealer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Function to soft delete and anonymize employee
CREATE OR REPLACE FUNCTION public.anonymize_employee(p_employee_id UUID)
RETURNS VOID AS $$
DECLARE
    v_user_id UUID;
    v_redacted_email VARCHAR(255);
BEGIN
    SELECT user_id INTO v_user_id FROM public.employees WHERE employee_id = p_employee_id;
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Employee profile not found.';
    END IF;

    v_redacted_email := 'redacted-employee-' || p_employee_id || '@estatebridge.com';

    -- Update employee profile
    UPDATE public.employees
    SET 
        employee_name = 'Redacted Employee',
        designation = 'Redacted',
        employee_status = 'Inactive',
        deleted_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE employee_id = p_employee_id;

    -- Update public.users
    UPDATE public.users
    SET 
        email = v_redacted_email,
        mobile_number = '0000000000',
        status = 'Inactive',
        deleted_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE user_id = v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
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
