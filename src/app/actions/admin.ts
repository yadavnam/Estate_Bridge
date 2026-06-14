'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export interface AdminActionResponse {
  success: boolean;
  error?: string;
  data?: any;
}

/**
 * Helper to authenticate user and verify Admin role
 */
async function verifyAdminSession() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Unauthorized user session.');
  }

  const role = user.app_metadata?.role;
  if (role !== 'ADMIN') {
    throw new Error('Access denied. Administrator privileges required.');
  }

  return user.id;
}

/**
 * Helper to authenticate user and verify Employee role
 */
async function verifyEmployeeSession() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Unauthorized user session.');
  }

  const role = user.app_metadata?.role;
  const status = user.app_metadata?.status;
  if (role !== 'EMPLOYEE') {
    throw new Error('Access denied. Employee portal only.');
  }
  if (status !== 'Active') {
    throw new Error('Access denied. Employee account is inactive.');
  }

  const adminSupabase = createAdminClient();
  const { data: employee, error: dbError } = await adminSupabase
    .from('employees')
    .select('employee_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (dbError || !employee) {
    throw new Error('Employee profile not found.');
  }

  return employee.employee_id;
}

/**
 * Helper to authenticate user and verify Customer role
 */
async function verifyCustomerSession() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Unauthorized user session.');
  }

  const role = user.app_metadata?.role;
  if (role !== 'CUSTOMER') {
    throw new Error('Access denied. Customer portal only.');
  }

  const adminSupabase = createAdminClient();
  const { data: customer, error: dbError } = await adminSupabase
    .from('customers')
    .select('customer_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (dbError || !customer) {
    throw new Error('Customer profile not found.');
  }

  return customer.customer_id;
}

/**
 * Approves a pending dealer
 */
export async function approveDealer(dealerId: string): Promise<AdminActionResponse> {
  try {
    const adminId = await verifyAdminSession();
    const adminSupabase = createAdminClient();

    // Fetch dealer user_id
    const { data: dealer, error: dError } = await adminSupabase
      .from('dealers')
      .select('user_id, company_name')
      .eq('dealer_id', dealerId)
      .single();

    if (dError || !dealer) {
      return { success: false, error: 'Dealer record not found.' };
    }

    // 1. Update dealers table status
    const { error: updateError } = await adminSupabase
      .from('dealers')
      .update({ dealer_status: 'Approved' })
      .eq('dealer_id', dealerId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    // 2. Update user app_metadata in Supabase Auth
    const { error: authError } = await adminSupabase.auth.admin.updateUserById(
      dealer.user_id,
      { app_metadata: { role: 'DEALER', status: 'Approved' } }
    );

    if (authError) {
      return { success: false, error: 'Dealer status updated, but auth session mapping failed.' };
    }

    // Log to audit log
    await adminSupabase.from('audit_logs').insert({
      user_id: adminId,
      action: 'DEALER_APPROVED',
      entity_type: 'dealers',
      entity_id: dealerId,
      new_value: { status: 'Approved', company_name: dealer.company_name }
    });

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to approve dealer.' };
  }
}

/**
 * Rejects a pending dealer
 */
export async function rejectDealer(dealerId: string): Promise<AdminActionResponse> {
  try {
    const adminId = await verifyAdminSession();
    const adminSupabase = createAdminClient();

    const { data: dealer } = await adminSupabase
      .from('dealers')
      .select('user_id')
      .eq('dealer_id', dealerId)
      .single();

    if (!dealer) {
      return { success: false, error: 'Dealer not found.' };
    }

    const { error } = await adminSupabase
      .from('dealers')
      .update({ dealer_status: 'Rejected' })
      .eq('dealer_id', dealerId);

    if (error) {
      return { success: false, error: error.message };
    }

    await adminSupabase.auth.admin.updateUserById(dealer.user_id, {
      app_metadata: { role: 'DEALER', status: 'Rejected' }
    });

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to reject dealer.' };
  }
}

/**
 * Blocks and anonymizes a dealer, evicting active sessions instantly
 */
export async function blockDealer(dealerId: string): Promise<AdminActionResponse> {
  try {
    const adminId = await verifyAdminSession();
    const adminSupabase = createAdminClient();

    // Fetch dealer user_id
    const { data: dealer, error: dError } = await adminSupabase
      .from('dealers')
      .select('user_id, company_name')
      .eq('dealer_id', dealerId)
      .single();

    if (dError || !dealer) {
      return { success: false, error: 'Dealer record not found.' };
    }

    // 1. Run database RPC to anonymize dealer details
    const { error: anonymizeError } = await adminSupabase.rpc('anonymize_dealer', {
      p_dealer_id: dealerId
    });

    if (anonymizeError) {
      return { success: false, error: anonymizeError.message };
    }

    const redactedEmail = `redacted-dealer-${dealerId}@estatebridge.com`;

    // 2. Evict Supabase Auth metadata and email
    await adminSupabase.auth.admin.updateUserById(
      dealer.user_id,
      { 
        email: redactedEmail,
        app_metadata: { role: 'DEALER', status: 'Blocked' },
        user_metadata: { name: 'Redacted Company' }
      }
    );

    // 3. Instant session eviction (Sign Out user sessions globally)
    const { error: signOutError } = await adminSupabase.auth.admin.signOut(dealer.user_id);
    if (signOutError) {
      console.warn('Sign out call warning: ', signOutError.message);
    }

    // Log to audit log
    await adminSupabase.from('audit_logs').insert({
      user_id: adminId,
      action: 'DEALER_BLOCKED_AND_ANONYMIZED',
      entity_type: 'dealers',
      entity_id: dealerId,
      new_value: { status: 'Blocked', company_name: 'Redacted Company' }
    });

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to block dealer.' };
  }
}

/**
 * Deactivates and anonymizes an employee profile
 */
export async function deactivateEmployee(employeeId: string): Promise<AdminActionResponse> {
  try {
    const adminId = await verifyAdminSession();
    const adminSupabase = createAdminClient();

    const { data: emp, error: empError } = await adminSupabase
      .from('employees')
      .select('user_id, employee_name')
      .eq('employee_id', employeeId)
      .single();

    if (empError || !emp) {
      return { success: false, error: 'Employee not found.' };
    }

    // 1. Run database RPC to anonymize employee details
    const { error: anonymizeError } = await adminSupabase.rpc('anonymize_employee', {
      p_employee_id: employeeId
    });

    if (anonymizeError) {
      return { success: false, error: anonymizeError.message };
    }

    const redactedEmail = `redacted-employee-${employeeId}@estatebridge.com`;

    // 2. Update Auth metadata and email to block access
    await adminSupabase.auth.admin.updateUserById(
      emp.user_id,
      { 
        email: redactedEmail,
        app_metadata: { role: 'EMPLOYEE', status: 'Inactive' },
        user_metadata: { name: 'Redacted Employee' }
      }
    );

    // 3. Sign out employee sessions
    await adminSupabase.auth.admin.signOut(emp.user_id);

    // Log to audit log
    await adminSupabase.from('audit_logs').insert({
      user_id: adminId,
      action: 'EMPLOYEE_DEACTIVATED_AND_ANONYMIZED',
      entity_type: 'employees',
      entity_id: employeeId,
      new_value: { status: 'Inactive', name: 'Redacted Employee' }
    });

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to deactivate employee.' };
  }
}

/**
 * Creates a new Employee profile
 */
export async function createEmployee(formData: {
  name: string;
  designation: string;
  email: string;
}): Promise<AdminActionResponse> {
  try {
    const adminId = await verifyAdminSession();
    const adminSupabase = createAdminClient();

    // 1. Create auth user with default password
    const { data: authUser, error: authError } = await adminSupabase.auth.admin.createUser({
      email: formData.email,
      email_confirm: true,
      password: 'Password123!',
      user_metadata: { name: formData.name },
      app_metadata: { role: 'EMPLOYEE', status: 'Active' }
    });

    if (authError || !authUser.user) {
      return { success: false, error: authError?.message || 'Failed to create user in Auth.' };
    }

    // 2. Insert employee row
    const { error: dbError } = await adminSupabase
      .from('employees')
      .insert({
        user_id: authUser.user.id,
        employee_name: formData.name,
        designation: formData.designation,
        employee_status: 'Active'
      });

    if (dbError) {
      // rollback auth user creation on database error
      await adminSupabase.auth.admin.deleteUser(authUser.user.id);
      return { success: false, error: dbError.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to create employee.' };
  }
}

/**
 * Recommends a requirement specification modification (Lead Assignee trigger)
 */
export async function recommendRequirementModification(
  requirementId: string,
  proposedSpecs: any
): Promise<AdminActionResponse> {
  try {
    const employeeId = await verifyEmployeeSession();
    const adminSupabase = createAdminClient();

    // 1. Check if employee is Lead
    const { data: assign } = await adminSupabase
      .from('requirement_employee_assignments')
      .select('is_lead')
      .eq('requirement_id', requirementId)
      .eq('employee_id', employeeId)
      .eq('status', 'Active')
      .maybeSingle();

    if (!assign || !assign.is_lead) {
      return { success: false, error: 'Only the Lead Representative may propose requirement modifications.' };
    }

    const { data: newReq, error } = await adminSupabase
      .from('requirement_modification_requests')
      .insert({
        requirement_id: requirementId,
        lead_employee_id: employeeId,
        proposed_specs: proposedSpecs,
        status: 'Pending'
      })
      .select('request_id')
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: newReq.request_id };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to recommend modification.' };
  }
}

/**
 * Logs customer confirmation for a pending requirement modification request
 */
export async function confirmModificationByCustomer(
  requestId: string
): Promise<AdminActionResponse> {
  try {
    const customerId = await verifyCustomerSession();
    const adminSupabase = createAdminClient();

    // Fetch the request to verify it belongs to the customer
    const { data: request, error: rError } = await adminSupabase
      .from('requirement_modification_requests')
      .select('requirement_id, requirements (customer_id)')
      .eq('request_id', requestId)
      .maybeSingle();

    if (rError || !request) {
      return { success: false, error: 'Modification request not found.' };
    }

    const requirementCustomerId = (request.requirements as any)?.customer_id;
    if (requirementCustomerId !== customerId) {
      return { success: false, error: 'Access denied. You can only confirm modifications for your own requirements.' };
    }

    // Update status to Confirmed
    const { error } = await adminSupabase
      .from('requirement_modification_requests')
      .update({ status: 'Confirmed' })
      .eq('request_id', requestId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to log customer confirmation.' };
  }
}

/**
 * Soft deletes and anonymizes a customer profile (Admin only)
 */
export async function softDeleteCustomer(customerId: string): Promise<AdminActionResponse> {
  try {
    const adminId = await verifyAdminSession();
    const adminSupabase = createAdminClient();

    const { data: customer, error: customerError } = await adminSupabase
      .from('customers')
      .select('user_id, full_name')
      .eq('customer_id', customerId)
      .single();

    if (customerError || !customer) {
      return { success: false, error: 'Customer not found.' };
    }

    // 1. Run database RPC to anonymize customer details
    const { error: anonymizeError } = await adminSupabase.rpc('anonymize_customer', {
      p_customer_id: customerId
    });

    if (anonymizeError) {
      return { success: false, error: anonymizeError.message };
    }

    const redactedEmail = `redacted-customer-${customerId}@estatebridge.com`;

    // 2. Update Auth metadata and email to block access
    await adminSupabase.auth.admin.updateUserById(
      customer.user_id,
      { 
        email: redactedEmail,
        app_metadata: { role: 'CUSTOMER', status: 'Inactive' },
        user_metadata: { name: 'Redacted Customer' }
      }
    );

    // 3. Sign out customer sessions
    await adminSupabase.auth.admin.signOut(customer.user_id);

    // Log to audit log
    await adminSupabase.from('audit_logs').insert({
      user_id: adminId,
      action: 'CUSTOMER_SOFT_DELETED_AND_ANONYMIZED',
      entity_type: 'customers',
      entity_id: customerId,
      new_value: { status: 'Inactive', name: 'Redacted Customer' }
    });

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to soft delete customer.' };
  }
}

/**
 * Approves and applies a customer-confirmed requirement modification
 */
export async function approveRequirementModification(
  requestId: string
): Promise<AdminActionResponse> {
  try {
    const adminId = await verifyAdminSession();
    const adminSupabase = createAdminClient();

    // Fetch proposed request details
    const { data: request, error: rError } = await adminSupabase
      .from('requirement_modification_requests')
      .select('*')
      .eq('request_id', requestId)
      .single();

    if (rError || !request) {
      return { success: false, error: 'Modification request not found.' };
    }

    if (request.status !== 'Confirmed') {
      return { 
        success: false, 
        error: 'Lifecycle Locked: Modification requests must be confirmed by the customer before Admin approval.' 
      };
    }

    // 1. Apply proposed specs to requirement
    const { error: reqError } = await adminSupabase
      .from('requirements')
      .update(request.proposed_specs)
      .eq('requirement_id', request.requirement_id);

    if (reqError) {
      return { success: false, error: reqError.message };
    }

    // 2. Set status to Approved
    const { error: requestUpdateError } = await adminSupabase
      .from('requirement_modification_requests')
      .update({ status: 'Approved' })
      .eq('request_id', requestId);

    if (requestUpdateError) {
      return { success: false, error: 'Specs applied, but request status update failed.' };
    }

    // 3. Log approval to requirement_notes
    const noteText = `[MODIFICATION_APPROVED] Specs updated by Administrator: ${JSON.stringify(request.proposed_specs)}`;
    await adminSupabase.from('requirement_notes').insert({
      requirement_id: request.requirement_id,
      author_id: adminId,
      note_text: noteText,
      version: 1,
      is_latest: true
    });

    // 4. Create Audit Log
    await adminSupabase.from('audit_logs').insert({
      user_id: adminId,
      action: 'REQUIREMENT_MODIFICATION_APPROVED',
      entity_type: 'requirements',
      entity_id: request.requirement_id,
      new_value: request.proposed_specs
    });

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to approve requirement specs modification.' };
  }
}

/**
 * Rejects a requirement modification request
 */
export async function rejectRequirementModification(
  requestId: string
): Promise<AdminActionResponse> {
  try {
    await verifyAdminSession();
    const adminSupabase = createAdminClient();

    const { error } = await adminSupabase
      .from('requirement_modification_requests')
      .update({ status: 'Rejected' })
      .eq('request_id', requestId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to reject specs modification.' };
  }
}

/**
 * Verifies deal milestones (Token Paid, Registration, Closed Won) and uploads proof documents
 */
export async function verifyDealMilestone(
  dealId: string,
  targetStage: 'Interested' | 'Negotiation' | 'Token Paid' | 'Documentation' | 'Registration' | 'Closed Won' | 'Closed Lost',
  verificationProofUrl: string,
  verificationNotes: string
): Promise<AdminActionResponse> {
  try {
    const adminId = await verifyAdminSession();
    const adminSupabase = createAdminClient();

    // 1. Fetch current stage
    const { data: deal, error: dealError } = await adminSupabase
      .from('deals')
      .select('current_stage, requirement_id')
      .eq('deal_id', dealId)
      .single();

    if (dealError || !deal) {
      return { success: false, error: 'Deal record not found.' };
    }

    // 2. Validate Closed Won constraints (immutability check)
    if (deal.current_stage === 'Closed Won') {
      return { success: false, error: 'Deal is closed won and is immutable.' };
    }

    // 3. Enforce proof uploads for milestones
    const needsProof = ['Token Paid', 'Registration', 'Closed Won'].includes(targetStage);
    if (needsProof && !verificationProofUrl) {
      return { success: false, error: `Proof document upload is mandatory to progress deal to ${targetStage}.` };
    }

    // 4. Update deal stage status
    const { error: updateError } = await adminSupabase
      .from('deals')
      .update({ current_stage: targetStage })
      .eq('deal_id', dealId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    // 5. Write log details into requirement_notes
    const logHeader = `[DEAL_STAGE_VERIFICATION] Stage: ${targetStage}`;
    const logText = `${logHeader} | Proof Attachment: ${verificationProofUrl || 'N/A'} | Notes: ${verificationNotes}`;
    await adminSupabase.from('requirement_notes').insert({
      requirement_id: deal.requirement_id,
      author_id: adminId,
      note_text: logText,
      version: 1,
      is_latest: true
    });

    // 6. Insert audit log entry
    await adminSupabase.from('audit_logs').insert({
      user_id: adminId,
      action: 'DEAL_MILESTONE_VERIFIED',
      entity_type: 'deals',
      entity_id: dealId,
      old_value: { current_stage: deal.current_stage },
      new_value: { 
        current_stage: targetStage, 
        proof_url: verificationProofUrl, 
        notes: verificationNotes 
      }
    });

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to verify deal milestone.' };
  }
}

/**
 * Manually overrides a dealer's trust score with audit trail tracking
 */
export async function overrideDealerTrustScore(
  dealerId: string,
  newScore: number,
  reason: string
): Promise<AdminActionResponse> {
  try {
    const adminId = await verifyAdminSession();
    const adminSupabase = createAdminClient();

    if (newScore < 0 || newScore > 100) {
      return { success: false, error: 'Trust score must be within range 0 to 100.' };
    }

    // Fetch old trust score
    const { data: dealer, error: dError } = await adminSupabase
      .from('dealers')
      .select('trust_score')
      .eq('dealer_id', dealerId)
      .single();

    if (dError || !dealer) {
      return { success: false, error: 'Dealer record not found.' };
    }

    // 1. Update score
    const { error: updateError } = await adminSupabase
      .from('dealers')
      .update({ trust_score: newScore })
      .eq('dealer_id', dealerId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    // 2. Insert audit log entry
    await adminSupabase.from('audit_logs').insert({
      user_id: adminId,
      action: 'DEALER_TRUST_SCORE_OVERRIDE',
      entity_type: 'dealers',
      entity_id: dealerId,
      old_value: { trust_score: dealer.trust_score },
      new_value: { 
        trust_score: newScore, 
        reason: reason, 
        timestamp: new Date().toISOString() 
      }
    });

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to override trust score.' };
  }
}

/**
 * Replies to customer support ticket
 */
export async function addSupportTicketMessageAdmin(
  ticketId: string,
  messageText: string
): Promise<AdminActionResponse> {
  try {
    const adminId = await verifyAdminSession();
    const adminSupabase = createAdminClient();

    const { error } = await adminSupabase
      .from('support_messages')
      .insert({
        ticket_id: ticketId,
        sender_id: adminId,
        sender_role: 'ADMIN',
        message: messageText
      });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to add message.' };
  }
}

/**
 * Closes support ticket
 */
export async function closeSupportTicketAdmin(ticketId: string): Promise<AdminActionResponse> {
  try {
    await verifyAdminSession();
    const adminSupabase = createAdminClient();

    const { error } = await adminSupabase
      .from('support_tickets')
      .update({ status: 'Closed' })
      .eq('ticket_id', ticketId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to close support ticket.' };
  }
}
