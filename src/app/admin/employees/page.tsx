import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import EmployeesRosterClient from './employees-roster-client';

export default async function AdminEmployeesPage() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  const adminSupabase = createAdminClient();

  // Fetch all employees
  const { data: employees, error } = await adminSupabase
    .from('employees')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return (
      <div className="p-8 text-red-500 font-bold bg-red-950/20 border border-red-900 rounded-2xl">
        Failed to fetch employees: {error.message}
      </div>
    );
  }

  // Map database columns to fields expected by the client component
  const mappedEmployees = (employees || []).map((emp: any) => ({
    ...emp,
    name: emp.employee_name,
    status: emp.employee_status
  }));

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold tracking-tight">Staff Roster Directory</h1>
        <p className="text-sm text-zinc-400">
          Provision new representative login accounts, monitor active coordinators, and deactivate staff members when suspended.
        </p>
      </div>

      <EmployeesRosterClient initialEmployees={mappedEmployees} />
    </div>
  );
}
