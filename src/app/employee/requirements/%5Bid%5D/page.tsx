import React from 'react';
import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import RequirementWorkspaceClient from './requirement-workspace-client';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function RequirementWorkspacePage({ params }: PageProps) {
  const { id: requirementId } = await params;
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  const adminSupabase = createAdminClient();

  // Resolve current employee
  const { data: employee } = await adminSupabase
    .from('employees')
    .select('employee_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!employee) {
    redirect('/login?error=inactive_employee');
  }

  const employeeId = employee.employee_id;

  // Verify employee is assigned to this requirement (RLS Check / Gate)
  const { data: currentAssignment } = await adminSupabase
    .from('requirement_employee_assignments')
    .select('assignment_id, is_lead, status')
    .eq('requirement_id', requirementId)
    .eq('employee_id', employeeId)
    .eq('status', 'Active')
    .maybeSingle();

  if (!currentAssignment) {
    return (
      <div className="p-8 text-red-500 font-bold bg-red-950/20 border border-red-900 rounded-2xl">
        Access Denied: You are not assigned to this client requirement.
      </div>
    );
  }

  // Fetch requirement along with customer details
  const { data: requirement, error: reqError } = await adminSupabase
    .from('requirements')
    .select(`
      *,
      customer:customer_id (
        customer_id,
        name,
        email,
        phone
      )
    `)
    .eq('requirement_id', requirementId)
    .maybeSingle();

  if (reqError || !requirement) {
    notFound();
  }

  // Fetch co-assigned staff
  const { data: assignments } = await adminSupabase
    .from('requirement_employee_assignments')
    .select(`
      assignment_id,
      is_lead,
      status,
      employee_id,
      employees:employee_id (
        name,
        designation
      )
    `)
    .eq('requirement_id', requirementId)
    .eq('status', 'Active');

  // Fetch timeline notes
  const { data: notes } = await adminSupabase
    .from('requirement_notes')
    .select(`
      note_id,
      note_text,
      created_at,
      author_id,
      users:author_id (
        email
      )
    `)
    .eq('requirement_id', requirementId)
    .order('created_at', { ascending: false });

  // Fetch matching requests (matching properties recommended by dealers)
  const { data: matchingRequests } = await adminSupabase
    .from('matching_requests')
    .select(`
      request_id,
      match_score,
      status,
      property_id,
      dealer_id,
      dealer_properties:property_id (
        property_id,
        title,
        price,
        address,
        city,
        area,
        property_type
      )
    `)
    .eq('requirement_id', requirementId);

  // Fetch all active employees (for co-assignment dropdown)
  const { data: allEmployees } = await adminSupabase
    .from('employees')
    .select('employee_id, name, designation')
    .eq('status', 'Active');

  // Fetch visits related to this requirement
  const { data: visits } = await adminSupabase
    .from('visits')
    .select(`
      visit_id,
      visit_date,
      visit_time,
      status,
      property:property_id (
        title,
        area,
        city
      )
    `)
    .eq('requirement_id', requirementId);

  // Fetch deals related to this requirement
  const { data: deals } = await adminSupabase
    .from('deals')
    .select(`
      deal_id,
      current_stage,
      property:property_id (
        title
      )
    `)
    .eq('requirement_id', requirementId);

  return (
    <RequirementWorkspaceClient
      requirement={requirement}
      assignments={assignments || []}
      notes={notes || []}
      matchingRequests={matchingRequests || []}
      allEmployees={allEmployees || []}
      currentEmployeeId={employeeId}
      isLead={currentAssignment.is_lead}
      visits={visits || []}
      deals={deals || []}
    />
  );
}
