import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import FollowupsSchedulerClient from './followups-scheduler-client';

export default async function EmployeeFollowupsPage() {
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

  // Fetch all follow-ups
  const { data: followUps, error } = await adminSupabase
    .from('follow_ups')
    .select(`
      followup_id,
      next_followup_date,
      notes,
      status,
      customer:customer_id (
        name,
        email,
        phone
      ),
      requirement:requirement_id (
        requirement_id,
        property_type
      )
    `)
    .eq('employee_id', employeeId)
    .order('next_followup_date', { ascending: true });

  if (error) {
    return (
      <div className="p-8 text-red-500 font-bold bg-red-950/20 border border-red-900 rounded-2xl">
        Failed to fetch follow-ups calendar: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold tracking-tight">Follow-up Scheduler</h1>
        <p className="text-sm text-zinc-400">
          Track customer callbacks and keep up with follow-ups. Missed callbacks are highlighted in red.
        </p>
      </div>

      <FollowupsSchedulerClient initialFollowups={followUps || []} />
    </div>
  );
}
