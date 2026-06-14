'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export interface CustomerActionResponse {
  success: boolean;
  error?: string;
  data?: any;
}

/**
 * Helper to authenticate user and resolve Customer ID
 */
async function getAuthenticatedCustomerId() {
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

  return { customerId: customer.customer_id, userId: user.id };
}

/**
 * Submits a new property requirement (atomic database RPC call)
 */
export async function submitRequirement(formData: {
  propertyType: string;
  budgetMin: number;
  budgetMax: number;
  city: string;
  area: string;
  areaMin: number;
  areaMax: number;
  additionalNotes?: string;
  furnishing: string;
  amenities: string[];
  facilities: string[];
}): Promise<CustomerActionResponse> {
  try {
    const { customerId } = await getAuthenticatedCustomerId();
    const adminSupabase = createAdminClient();

    // Call the database RPC function to ensure transaction atomicity
    const { data: reqId, error: rpcError } = await adminSupabase.rpc(
      'create_customer_requirement',
      {
        p_customer_id: customerId,
        p_property_type: formData.propertyType,
        p_budget_min: formData.budgetMin,
        p_budget_max: formData.budgetMax,
        p_city: formData.city,
        p_area: formData.area,
        p_area_min: formData.areaMin,
        p_area_max: formData.areaMax,
        p_additional_notes: formData.additionalNotes || null,
        p_furnishing: formData.furnishing,
        p_amenities: formData.amenities,
        p_facilities: formData.facilities,
      }
    );

    if (rpcError) {
      return { success: false, error: rpcError.message };
    }

    return { success: true, data: reqId };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to submit requirement.' };
  }
}

/**
 * Withdraws a customer requirement
 */
export async function withdrawRequirement(requirementId: string): Promise<CustomerActionResponse> {
  try {
    const { customerId } = await getAuthenticatedCustomerId();
    const adminSupabase = createAdminClient();

    // Verify requirement ownership
    const { data: req, error: checkError } = await adminSupabase
      .from('requirements')
      .select('requirement_id')
      .eq('requirement_id', requirementId)
      .eq('customer_id', customerId)
      .maybeSingle();

    if (checkError || !req) {
      return { success: false, error: 'Requirement not found or unauthorized.' };
    }

    // Update status to Withdrawn (triggers automated visit cancellations & employee notifications)
    const { error: updateError } = await adminSupabase
      .from('requirements')
      .update({ status: 'Withdrawn' })
      .eq('requirement_id', requirementId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to withdraw requirement.' };
  }
}

/**
 * Book direct site visit (Workflow 2 - Decoupled from requirements)
 */
export async function bookSiteVisit(formData: {
  siteId: string;
  visitDate: string;
  visitTime: string;
}): Promise<CustomerActionResponse> {
  try {
    const { customerId } = await getAuthenticatedCustomerId();
    const adminSupabase = createAdminClient();

    // Verify site is active
    const { data: site } = await adminSupabase
      .from('registered_sites')
      .select('status')
      .eq('site_id', formData.siteId)
      .maybeSingle();

    if (!site || site.status !== 'Active') {
      return { success: false, error: 'Registered site is currently unavailable.' };
    }

    // Insert visit in requested state (mutually exclusive visit check constraint validated automatically)
    const { data: visit, error: insertError } = await adminSupabase
      .from('visits')
      .insert({
        customer_id: customerId,
        site_id: formData.siteId,
        property_id: null,
        requirement_id: null,
        visit_date: formData.visitDate,
        visit_time: formData.visitTime,
        status: 'Requested',
      })
      .select('visit_id')
      .single();

    if (insertError) {
      return { success: false, error: insertError.message };
    }

    return { success: true, data: visit.visit_id };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to book site visit.' };
  }
}

/**
 * Book visit for matched property (Workflow 1 - linked to requirement)
 */
export async function bookPropertyVisit(formData: {
  requirementId: string;
  propertyId: string;
  visitDate: string;
  visitTime: string;
}): Promise<CustomerActionResponse> {
  try {
    const { customerId } = await getAuthenticatedCustomerId();
    const adminSupabase = createAdminClient();

    // Verify requirement ownership
    const { data: req } = await adminSupabase
      .from('requirements')
      .select('requirement_id, status')
      .eq('requirement_id', formData.requirementId)
      .eq('customer_id', customerId)
      .maybeSingle();

    if (!req || req.status === 'Withdrawn') {
      return { success: false, error: 'Invalid or withdrawn requirement.' };
    }

    // Verify property is active
    const { data: prop } = await adminSupabase
      .from('dealer_properties')
      .select('status')
      .eq('property_id', formData.propertyId)
      .maybeSingle();

    if (!prop || prop.status !== 'Active') {
      return { success: false, error: 'Property is currently unavailable.' };
    }

    // Insert visit
    const { data: visit, error: insertError } = await adminSupabase
      .from('visits')
      .insert({
        customer_id: customerId,
        requirement_id: formData.requirementId,
        property_id: formData.propertyId,
        site_id: null,
        visit_date: formData.visitDate,
        visit_time: formData.visitTime,
        status: 'Requested',
      })
      .select('visit_id')
      .single();

    if (insertError) {
      return { success: false, error: insertError.message };
    }

    return { success: true, data: visit.visit_id };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to book property visit.' };
  }
}

/**
 * Submits feedback and ratings for a completed visit
 */
export async function submitVisitFeedback(formData: {
  visitId: string;
  siteRating: number;
  visitRating: number;
  comments?: string;
}): Promise<CustomerActionResponse> {
  try {
    const { customerId } = await getAuthenticatedCustomerId();
    const adminSupabase = createAdminClient();

    // Verify visit is completed and belongs to customer
    const { data: visit } = await adminSupabase
      .from('visits')
      .select('visit_id, status, site_id, property_id')
      .eq('visit_id', formData.visitId)
      .eq('customer_id', customerId)
      .maybeSingle();

    if (!visit || visit.status !== 'Completed') {
      return { success: false, error: 'Feedback can only be submitted for completed visits.' };
    }

    // Check if feedback already submitted
    const { data: existingFeedback } = await adminSupabase
      .from('feedbacks')
      .select('feedback_id')
      .eq('visit_id', formData.visitId)
      .maybeSingle();

    if (existingFeedback) {
      return { success: false, error: 'Feedback already submitted for this visit.' };
    }

    // Insert feedback
    const { error: insertError } = await adminSupabase.from('feedbacks').insert({
      customer_id: customerId,
      visit_id: formData.visitId,
      site_id: visit.site_id,
      property_id: visit.property_id,
      site_rating: formData.siteRating,
      visit_rating: formData.visitRating,
      comments: formData.comments || null,
    });

    if (insertError) {
      return { success: false, error: insertError.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to submit feedback.' };
  }
}

/**
 * Creates a new support ticket and logs initial message
 */
export async function createSupportTicket(formData: {
  subject: string;
  category: string;
  message: string;
}): Promise<CustomerActionResponse> {
  try {
    const { customerId, userId } = await getAuthenticatedCustomerId();
    const adminSupabase = createAdminClient();

    // Insert support ticket
    const { data: ticket, error: ticketError } = await adminSupabase
      .from('support_tickets')
      .insert({
        customer_id: customerId,
        subject: formData.subject,
        category: formData.category,
        status: 'Open',
      })
      .select('ticket_id')
      .single();

    if (ticketError) {
      return { success: false, error: ticketError.message };
    }

    // Insert initial support message (sender_role = CUSTOMER)
    const { error: msgError } = await adminSupabase.from('support_messages').insert({
      ticket_id: ticket.ticket_id,
      sender_id: userId,
      sender_role: 'CUSTOMER',
      message: formData.message,
    });

    if (msgError) {
      return { success: false, error: msgError.message };
    }

    return { success: true, data: ticket.ticket_id };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to create support ticket.' };
  }
}

/**
 * Sends a message in a support ticket
 */
export async function sendSupportMessage(formData: {
  ticketId: string;
  message: string;
}): Promise<CustomerActionResponse> {
  try {
    const { customerId, userId } = await getAuthenticatedCustomerId();
    const adminSupabase = createAdminClient();

    // Verify ticket ownership and state
    const { data: ticket } = await adminSupabase
      .from('support_tickets')
      .select('status')
      .eq('ticket_id', formData.ticketId)
      .eq('customer_id', customerId)
      .maybeSingle();

    if (!ticket || ticket.status === 'Closed') {
      return { success: false, error: 'Support ticket is inactive or closed.' };
    }

    // Insert message
    const { error: msgError } = await adminSupabase.from('support_messages').insert({
      ticket_id: formData.ticketId,
      sender_id: userId,
      sender_role: 'CUSTOMER',
      message: formData.message,
    });

    if (msgError) {
      return { success: false, error: msgError.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to send message.' };
  }
}

/**
 * Closes a support ticket (authorized for customer, SAWS-2.1)
 */
export async function closeSupportTicket(ticketId: string): Promise<CustomerActionResponse> {
  try {
    const { customerId } = await getAuthenticatedCustomerId();
    const adminSupabase = createAdminClient();

    // Verify ticket ownership
    const { data: ticket } = await adminSupabase
      .from('support_tickets')
      .select('ticket_id')
      .eq('ticket_id', ticketId)
      .eq('customer_id', customerId)
      .maybeSingle();

    if (!ticket) {
      return { success: false, error: 'Ticket not found or unauthorized.' };
    }

    // Update status
    const { error: updateError } = await adminSupabase
      .from('support_tickets')
      .update({ status: 'Closed' })
      .eq('ticket_id', ticketId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to close ticket.' };
  }
}

/**
 * Cancels a scheduled or requested visit (gated by CP-1: 3-hour cutoff rule)
 */
export async function cancelVisit(visitId: string): Promise<CustomerActionResponse> {
  try {
    const { customerId } = await getAuthenticatedCustomerId();
    const adminSupabase = createAdminClient();

    // Fetch visit and verify ownership
    const { data: visit, error: fetchError } = await adminSupabase
      .from('visits')
      .select('visit_id, visit_date, visit_time, status')
      .eq('visit_id', visitId)
      .eq('customer_id', customerId)
      .maybeSingle();

    if (fetchError || !visit) {
      return { success: false, error: 'Visit appointment not found or unauthorized.' };
    }

    const inactiveStatuses = ['Completed', 'Closed', 'Rejected', 'Cancelled', 'No Show'];
    if (inactiveStatuses.includes(visit.status)) {
      return { success: false, error: 'This visit is already completed or inactive.' };
    }

    // Verify 3-hour cutoff rule
    // parse visit date and time in local timezone
    const visitDateTime = new Date(`${visit.visit_date}T${visit.visit_time}`);
    const timeDifferenceMs = visitDateTime.getTime() - Date.now();
    const hoursDifference = timeDifferenceMs / (1000 * 60 * 60);

    if (hoursDifference < 3) {
      return { 
        success: false, 
        error: 'Cancellation blocked. Visits cannot be cancelled less than 3 hours before the scheduled time.' 
      };
    }

    // Update status to Cancelled
    const { error: updateError } = await adminSupabase
      .from('visits')
      .update({ status: 'Cancelled' })
      .eq('visit_id', visitId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to cancel visit.' };
  }
}

