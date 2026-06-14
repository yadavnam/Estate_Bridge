'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { headers } from 'next/headers';

export interface AuthResponse {
  success: boolean;
  error?: string;
  role?: string;
  status?: string;
}

/**
 * Initiates the OTP sending process for mobile login or dealer signup
 */
export async function sendOtp(phoneNumber: string, isSignup: boolean): Promise<AuthResponse> {
  try {
    // Validate env vars early to give a clear error
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('[sendOtp] MISSING ENV VARS: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set on server.');
      return { success: false, error: 'Server configuration error. Please contact support.' };
    }

    const adminSupabase = createAdminClient();

    // Fetch client IP address from request headers
    const headerList = await headers();
    const rawIp = headerList.get('x-forwarded-for') || '127.0.0.1';
    const ipAddress = rawIp.split(',')[0].trim();

    // Enforce rate limiting via database-backed RPC (Phone: 5/10m, IP: 20/10m, Phone Daily: 20/24h)
    const { data: limitAllowed, error: limitError } = await adminSupabase.rpc(
      'check_and_increment_otp_limit',
      {
        p_ip: ipAddress,
        p_phone: phoneNumber,
      }
    );

    // If the RPC itself errors (e.g. DB unavailable, function missing), log and
    // allow the request to proceed rather than blocking legitimate users.
    if (limitError) {
      console.error('[RateLimit] RPC check_and_increment_otp_limit failed:', limitError.message);
      // Fall through — do NOT return an error here; proceed to send OTP.
    } else if (limitAllowed === false) {
      // Explicit FALSE means the limit was actually exceeded
      return { success: false, error: 'OTP request blocked. Rate limit exceeded.' };
    }

    // Query database via Admin client to see if user already exists
    const { data: existingUser, error: dbError } = await adminSupabase
      .from('users')
      .select('role, status')
      .eq('mobile_number', phoneNumber)
      .maybeSingle();

    if (dbError) {
      console.error('[sendOtp] DB query failed on users table:', dbError.message, dbError.code);
      return { success: false, error: 'Database verification failed.' };
    }

    if (isSignup) {
      // Dealer self-registration
      if (existingUser) {
        if (existingUser.role === 'CUSTOMER') {
          return { success: false, error: 'This mobile number is already registered as a Customer.' };
        }
        if (existingUser.role === 'DEALER') {
          return { success: false, error: 'This dealer is already registered. Please go to login.' };
        }
        return { success: false, error: 'Mobile number is already in use.' };
      }

      // Initiate OTP for new Dealer signup (passing role = DEALER in metadata)
      const supabase = await createClient();
      const { error } = await supabase.auth.signInWithOtp({
        phone: phoneNumber,
        options: {
          channel: 'sms',
          data: { role: 'DEALER' },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } else {
      // Unified login
      if (existingUser) {
        if (existingUser.status === 'Blocked' || existingUser.status === 'Suspended') {
          return { success: false, error: 'Your account has been blocked or suspended. Please contact support.' };
        }
      }

      const supabase = await createClient();
      const { error } = await supabase.auth.signInWithOtp({
        phone: phoneNumber,
        options: {
          channel: 'sms',
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    }
  } catch (err: any) {
    return { success: false, error: err.message || 'An unexpected error occurred.' };
  }
}

/**
 * Verifies the OTP token and returns user details on success
 */
export async function verifyOtp(phoneNumber: string, otpCode: string): Promise<AuthResponse> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.verifyOtp({
      phone: phoneNumber,
      token: otpCode,
      type: 'sms',
    });

    if (error || !data.user) {
      return { success: false, error: error?.message || 'OTP verification failed.' };
    }

    const role = data.user.app_metadata?.role || 'CUSTOMER';
    const status = data.user.app_metadata?.status || 'Active';

    // Double-check deactivation status immediately
    if (status === 'Blocked' || status === 'Suspended') {
      await supabase.auth.signOut();
      return { success: false, error: 'This account has been blocked or suspended.' };
    }

    return {
      success: true,
      role,
      status,
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'An unexpected error occurred.' };
  }
}

/**
 * Authenticates Employees and Admins using email & password
 */
export async function signInWithPassword(email: string, password: string): Promise<AuthResponse> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      return { success: false, error: error?.message || 'Authentication failed.' };
    }

    const role = data.user.app_metadata?.role;
    const status = data.user.app_metadata?.status || 'Active';

    // Only allow EMPLOYEE or ADMIN to log in using password
    if (role !== 'EMPLOYEE' && role !== 'ADMIN') {
      await supabase.auth.signOut();
      return { success: false, error: 'Invalid portal login credentials.' };
    }

    // Verify status
    if (status === 'Blocked' || status === 'Suspended') {
      await supabase.auth.signOut();
      return { success: false, error: 'Your account has been deactivated.' };
    }

    return {
      success: true,
      role,
      status,
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'An unexpected error occurred.' };
  }
}

/**
 * Sign out the current user session
 */
export async function signOut(): Promise<AuthResponse> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut();
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Signout failed.' };
  }
}

/**
 * Submits the dealer profile details post-OTP verification
 */
export async function submitDealerProfile(formData: {
  companyName: string;
  ownerName: string;
  address: string;
  reraNumber?: string;
  gstNumber?: string;
  experienceYears: number;
}): Promise<AuthResponse> {
  try {
    const supabase = await createClient();

    // Verify session
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, error: 'Unauthorized user session.' };
    }

    const role = user.app_metadata?.role;
    if (role !== 'DEALER') {
      return { success: false, error: 'Only registered dealers can complete this profile.' };
    }

    const adminSupabase = createAdminClient();

    // Check if a dealer profile already exists to prevent duplicate profiles
    const { data: existingDealer } = await adminSupabase
      .from('dealers')
      .select('dealer_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingDealer) {
      return { success: false, error: 'Dealer profile already exists.' };
    }

    // Create the dealer profile in the dealers table inside a single transaction
    const { error: profileError } = await adminSupabase.from('dealers').insert({
      user_id: user.id,
      company_name: formData.companyName,
      owner_name: formData.ownerName,
      mobile: user.phone || '0000000000',
      email: user.email || '',
      address: formData.address,
      rera_number: formData.reraNumber || null,
      gst_number: formData.gstNumber || null,
      experience_years: formData.experienceYears,
      dealer_status: 'Pending', // Force pending state for Admin approval
    });

    if (profileError) {
      return { success: false, error: 'Failed to save dealer profile details.' };
    }

    // Update public.users status to Pending (which automatically triggers sync to auth app_metadata status)
    const { error: userUpdateError } = await adminSupabase
      .from('users')
      .update({ status: 'Pending' })
      .eq('user_id', user.id);

    if (userUpdateError) {
      return { success: false, error: 'Failed to update user profile status.' };
    }

    return { success: true, role: 'DEALER', status: 'Pending' };
  } catch (err: any) {
    return { success: false, error: err.message || 'An unexpected error occurred.' };
  }
}

/**
 * Creates a new Employee profile (Admin only)
 */
export async function registerEmployee(formData: {
  email: string;
  password?: string;
  name: string;
  designation: string;
}): Promise<AuthResponse> {
  try {
    const supabase = await createClient();

    // Validate requester is an Admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user || user.app_metadata?.role !== 'ADMIN') {
      return { success: false, error: 'Only admins are authorized to create employees.' };
    }

    const adminSupabase = createAdminClient();
    const generatedPassword = formData.password || Math.random().toString(36).slice(-10);

    // Create user in Supabase Auth with app_metadata set securely
    const { data: newAuthUser, error: createError } = await adminSupabase.auth.admin.createUser({
      email: formData.email,
      password: generatedPassword,
      email_confirm: true,
      app_metadata: {
        role: 'EMPLOYEE',
        status: 'Active',
      },
      user_metadata: {
        employee_name: formData.name,
        designation: formData.designation,
      },
    });

    if (createError || !newAuthUser.user) {
      return { success: false, error: createError?.message || 'Failed to create employee auth account.' };
    }

    // Note: The public.handle_new_auth_user() DB trigger automatically catches this insert 
    // and copies the details into public.users and public.employees with status 'Active'.
    
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'An unexpected error occurred.' };
  }
}
