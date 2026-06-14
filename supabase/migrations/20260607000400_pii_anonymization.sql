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
