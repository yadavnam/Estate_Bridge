import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import DealsPipelineClient from './deals-pipeline-client';

export default async function EmployeeDealsPage() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  const adminSupabase = createAdminClient();

  // Fetch Employee ID
  const { data: employee } = await adminSupabase
    .from('employees')
    .select('employee_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!employee) {
    redirect('/login?error=inactive_employee');
  }

  const employeeId = employee.employee_id;

  // Fetch all requirements assigned to this employee
  const { data: assignments } = await adminSupabase
    .from('requirement_employee_assignments')
    .select('requirement_id, is_lead')
    .eq('employee_id', employeeId)
    .eq('status', 'Active');

  const requirementIds = assignments?.map((a: any) => a.requirement_id) || [];
  const leadMap = new Map<string, boolean>();
  assignments?.forEach((a: any) => {
    leadMap.set(a.requirement_id, a.is_lead);
  });

  let deals: any[] = [];
  if (requirementIds.length > 0) {
    const { data: dealsData } = await adminSupabase
      .from('deals')
      .select(`
        deal_id,
        current_stage,
        created_at,
        property_id,
        requirement_id,
        property:property_id (
          title,
          price,
          city,
          area
        ),
        customer:customer_id (
          name,
          email,
          phone
        )
      `)
      .in('requirement_id', requirementIds)
      .order('created_at', { ascending: false });

    deals = (dealsData || []).map((d: any) => ({
      ...d,
      is_lead: leadMap.get(d.requirement_id) || false,
    }));
  }

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold tracking-tight">Deals Pipeline</h1>
        <p className="text-sm text-zinc-400">
          Manage, track, and progress deal lifecycle transitions for your assigned requirements.
        </p>
      </div>

      <DealsPipelineClient initialDeals={deals} />
    </div>
  );
}
