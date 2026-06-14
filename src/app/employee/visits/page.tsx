import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import VisitsCoordinatorClient from './visits-coordinator-client';

export default async function EmployeeVisitsPage() {
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

  // Fetch assigned visits
  const { data: visitAssignments, error } = await adminSupabase
    .from('visit_employees')
    .select(`
      visit_id,
      visits:visit_id (
        visit_id,
        visit_date,
        visit_time,
        status,
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
      )
    `)
    .eq('employee_id', employeeId);

  if (error) {
    return (
      <div className="p-8 text-red-500 font-bold bg-red-950/20 border border-red-900 rounded-2xl">
        Failed to fetch coordinated visits: {error.message}
      </div>
    );
  }

  const visits = visitAssignments
    ?.map((va: any) => va.visits)
    ?.filter(Boolean)
    ?.sort((a: any, b: any) => new Date(`${b.visit_date}T${b.visit_time}`).getTime() - new Date(`${a.visit_date}T${a.visit_time}`).getTime()) || [];

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold tracking-tight">Visits Coordinator</h1>
        <p className="text-sm text-zinc-400">
          Coordinate property walkthrough visits, log outcomes, and schedule follow-ups.
        </p>
      </div>

      <VisitsCoordinatorClient initialVisits={visits} />
    </div>
  );
}
