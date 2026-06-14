'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export interface EmployeeActionResponse {
  success: boolean;
  error?: string;
  data?: any;
}

/**
 * Helper to authenticate user and resolve Employee ID
 */
async function getAuthenticatedEmployeeId() {
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

  return { employeeId: employee.employee_id, userId: user.id };
}

/**
 * Helper to verify if the employee is the Lead Assignee for a requirement
 */
async function verifyLeadAssignee(requirementId: string, employeeId: string, adminSupabase: any) {
  const { data: assignment, error } = await adminSupabase
    .from('requirement_employee_assignments')
    .select('is_lead')
    .eq('requirement_id', requirementId)
    .eq('employee_id', employeeId)
    .eq('status', 'Active')
    .maybeSingle();

  if (error || !assignment || !assignment.is_lead) {
    throw new Error('Lifecycle Progression Locked: Only the assigned Lead Representative is authorized to modify specs or recommend deals.');
  }
}

/**
 * Assigns an employee to a requirement as a helper coordinator (is_lead = false)
 */
export async function assignEmployeeToRequirement(
  requirementId: string,
  targetEmployeeId: string
): Promise<EmployeeActionResponse> {
  try {
    await getAuthenticatedEmployeeId(); // ensure requester is an active employee
    const adminSupabase = createAdminClient();

    // Check if assignment already exists
    const { data: existing } = await adminSupabase
      .from('requirement_employee_assignments')
      .select('assignment_id')
      .eq('requirement_id', requirementId)
      .eq('employee_id', targetEmployeeId)
      .eq('status', 'Active')
      .maybeSingle();

    if (existing) {
      return { success: false, error: 'Employee is already assigned to this requirement.' };
    }

    const { data: newAssign, error } = await adminSupabase
      .from('requirement_employee_assignments')
      .insert({
        requirement_id: requirementId,
        employee_id: targetEmployeeId,
        is_lead: false,
        status: 'Active',
      })
      .select('assignment_id')
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: newAssign.assignment_id };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to assign employee.' };
  }
}

/**
 * Sets an employee assignment to Lead Assignee, unsetting previous lead in a transaction
 */
export async function setRequirementLeadAssignee(
  requirementId: string,
  targetAssignmentId: string
): Promise<EmployeeActionResponse> {
  try {
    await getAuthenticatedEmployeeId();
    const adminSupabase = createAdminClient();

    // 1. Unset lead status on all active assignments for this requirement
    const { error: unsetError } = await adminSupabase
      .from('requirement_employee_assignments')
      .update({ is_lead: false })
      .eq('requirement_id', requirementId);

    if (unsetError) {
      return { success: false, error: 'Failed to reset current lead assignees.' };
    }

    // 2. Set the target assignment to is_lead = true
    const { error: setError } = await adminSupabase
      .from('requirement_employee_assignments')
      .update({ is_lead: true, status: 'Active' })
      .eq('assignment_id', targetAssignmentId);

    if (setError) {
      return { success: false, error: 'Failed to set target assignment as lead.' };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update lead assignee.' };
  }
}

/**
 * Removes an employee assignment (deactivates assignment status)
 */
export async function removeEmployeeAssignment(assignmentId: string): Promise<EmployeeActionResponse> {
  try {
    await getAuthenticatedEmployeeId();
    const adminSupabase = createAdminClient();

    // Check if the assignment is a lead
    const { data: assign } = await adminSupabase
      .from('requirement_employee_assignments')
      .select('is_lead')
      .eq('assignment_id', assignmentId)
      .maybeSingle();

    if (assign?.is_lead) {
      return { success: false, error: 'Cannot remove the Lead Assignee. Assign a new lead first.' };
    }

    const { error } = await adminSupabase
      .from('requirement_employee_assignments')
      .update({ status: 'Inactive' })
      .eq('assignment_id', assignmentId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to remove assignment.' };
  }
}

/**
 * Logs a Call or WhatsApp interaction note and schedules optional followup
 */
export async function logCustomerInteraction(formData: {
  requirementId: string;
  customerId: string;
  type: 'Call' | 'WhatsApp';
  outcome: string;
  notes: string;
  nextFollowupDate?: string;
}): Promise<EmployeeActionResponse> {
  try {
    const { employeeId, userId } = await getAuthenticatedEmployeeId();
    const adminSupabase = createAdminClient();

    // 1. Insert note into requirement_notes
    const logHeader = formData.type === 'Call' ? '[CALL_LOG]' : '[WHATSAPP_LOG]';
    const noteText = `${logHeader} Outcome: ${formData.outcome} | Details: ${formData.notes}`;

    const { error: noteError } = await adminSupabase
      .from('requirement_notes')
      .insert({
        requirement_id: formData.requirementId,
        author_id: userId,
        note_text: noteText,
        version: 1,
        is_latest: true,
      });

    if (noteError) {
      return { success: false, error: 'Failed to save interaction logs.' };
    }

    // 2. Schedule callback followup if requested
    if (formData.nextFollowupDate) {
      const { error: followError } = await adminSupabase
        .from('follow_ups')
        .insert({
          customer_id: formData.customerId,
          requirement_id: formData.requirementId,
          employee_id: employeeId,
          next_followup_date: new Date(formData.nextFollowupDate).toISOString(),
          notes: `Follow-up scheduled from ${formData.type} interaction. Notes: ${formData.notes}`,
          status: 'Pending',
        });

      if (followError) {
        return { success: false, error: 'Log saved, but failed to schedule callback followup.' };
      }
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to log interaction.' };
  }
}

/**
 * Creates a deal between a requirement and property (Lead Assignee only)
 */
export async function createRequirementDeal(
  requirementId: string,
  propertyId: string,
  customerId: string,
  dealerId: string
): Promise<EmployeeActionResponse> {
  try {
    const { employeeId } = await getAuthenticatedEmployeeId();
    const adminSupabase = createAdminClient();

    // Verify lead status
    await verifyLeadAssignee(requirementId, employeeId, adminSupabase);

    // Create deal
    const { data: newDeal, error } = await adminSupabase
      .from('deals')
      .insert({
        customer_id: customerId,
        dealer_id: dealerId,
        property_id: propertyId,
        requirement_id: requirementId,
        current_stage: 'Interested',
      })
      .select('deal_id')
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: newDeal.deal_id };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to start negotiation deal.' };
  }
}

/**
 * Transitions deal status across any stage (Unrestricted platform authority)
 */
export async function updateEmployeeDealStage(
  dealId: string,
  targetStage: 'Interested' | 'Negotiation' | 'Token Paid' | 'Documentation' | 'Registration' | 'Closed Won' | 'Closed Lost',
  notes?: string
): Promise<EmployeeActionResponse> {
  try {
    const { employeeId, userId } = await getAuthenticatedEmployeeId();
    const adminSupabase = createAdminClient();

    // 1. Fetch deal to get requirement_id and current_stage
    const { data: deal, error: dealError } = await adminSupabase
      .from('deals')
      .select('requirement_id, current_stage')
      .eq('deal_id', dealId)
      .maybeSingle();

    if (dealError || !deal) {
      return { success: false, error: 'Deal record not found.' };
    }

    // 2. Verify modifying employee is the Lead Assignee
    await verifyLeadAssignee(deal.requirement_id, employeeId, adminSupabase);

    // 3. Restrict final Closed Won transition to Admin only
    if (targetStage === 'Closed Won') {
      return { 
        success: false, 
        error: 'Final Transition Blocked: Only an Administrator is authorized to mark a deal as Closed Won after verifying registration and final payment.' 
      };
    }

    const { error } = await adminSupabase
      .from('deals')
      .update({ current_stage: targetStage })
      .eq('deal_id', dealId);

    if (error) {
      return { success: false, error: error.message };
    }

    // 4. Write audit log
    await adminSupabase
      .from('audit_logs')
      .insert({
        user_id: userId,
        action: 'DEAL_STAGE_TRANSITION',
        entity_type: 'deals',
        entity_id: dealId,
        old_value: { current_stage: deal.current_stage },
        new_value: { 
          current_stage: targetStage, 
          notes: notes || `Deal progressed to ${targetStage} stage.` 
        }
      });

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to transition deal milestone.' };
  }
}

/**
 * Updates visit outcome and registers notes
 */
export async function updateVisitOutcome(
  visitId: string,
  newStatus: string,
  notes: string
): Promise<EmployeeActionResponse> {
  try {
    const { userId } = await getAuthenticatedEmployeeId();
    const adminSupabase = createAdminClient();

    // Update status in visits table
    const { error: visitError } = await adminSupabase
      .from('visits')
      .update({ status: newStatus })
      .eq('visit_id', visitId);

    if (visitError) {
      return { success: false, error: visitError.message };
    }

    // Insert visit outcome log
    const { error: outcomeError } = await adminSupabase
      .from('visit_outcomes')
      .insert({
        visit_id: visitId,
        outcome_status: newStatus,
        notes: notes,
        created_by: userId,
      });

    if (outcomeError) {
      return { success: false, error: 'Visit status updated but failed to save outcome text logs.' };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to log outcome.' };
  }
}

/**
 * Modifies client requirement specifications (proposes modification request, Lead Assignee only)
 */
export async function modifyRequirementSpecs(
  requirementId: string,
  formData: {
    property_type: string;
    budget_min: number;
    budget_max: number;
    city: string;
    area: string;
    area_min: number;
    area_max: number;
    additional_notes: string;
  }
): Promise<EmployeeActionResponse> {
  try {
    const { employeeId } = await getAuthenticatedEmployeeId();
    const adminSupabase = createAdminClient();

    // Verify lead status
    await verifyLeadAssignee(requirementId, employeeId, adminSupabase);

    // Insert into requirement_modification_requests instead of directly updating the requirement
    const { data: newReq, error } = await adminSupabase
      .from('requirement_modification_requests')
      .insert({
        requirement_id: requirementId,
        lead_employee_id: employeeId,
        proposed_specs: formData,
        status: 'Pending'
      })
      .select('request_id')
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: newReq.request_id };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to propose requirement specs modification.' };
  }
}

/**
 * Logs a withdrawal recommendation note (Lead Assignee only)
 */
export async function submitWithdrawalRecommendation(
  requirementId: string,
  recommendationText: string
): Promise<EmployeeActionResponse> {
  try {
    const { employeeId, userId } = await getAuthenticatedEmployeeId();
    const adminSupabase = createAdminClient();

    // Verify lead status
    await verifyLeadAssignee(requirementId, employeeId, adminSupabase);

    const noteText = `[WITHDRAWAL_RECOMMENDATION] Details: ${recommendationText}`;

    const { error } = await adminSupabase
      .from('requirement_notes')
      .insert({
        requirement_id: requirementId,
        author_id: userId,
        note_text: noteText,
        version: 1,
        is_latest: true,
      });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to submit withdrawal recommendation.' };
  }
}

/**
 * Creates a callback follow-up
 */
export async function createFollowUp(formData: {
  customerId: string;
  requirementId: string;
  nextFollowupDate: string;
  notes: string;
}): Promise<EmployeeActionResponse> {
  try {
    const { employeeId } = await getAuthenticatedEmployeeId();
    const adminSupabase = createAdminClient();

    const { error } = await adminSupabase
      .from('follow_ups')
      .insert({
        customer_id: formData.customerId,
        requirement_id: formData.requirementId,
        employee_id: employeeId,
        next_followup_date: new Date(formData.nextFollowupDate).toISOString(),
        notes: formData.notes,
        status: 'Pending',
      });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to schedule followup.' };
  }
}

/**
 * Marks follow-up status as Completed
 */
export async function resolveFollowUp(followupId: string, outcomeNotes: string): Promise<EmployeeActionResponse> {
  try {
    await getAuthenticatedEmployeeId();
    const adminSupabase = createAdminClient();

    const { error } = await adminSupabase
      .from('follow_ups')
      .update({
        status: 'Completed',
        notes: outcomeNotes,
      })
      .eq('followup_id', followupId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to resolve followup callback.' };
  }
}
