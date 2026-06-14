import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import ModificationsClient from './modifications-client';

export default async function AdminRequirementsPage() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  const adminSupabase = createAdminClient();

  // Fetch modification requests along with requirement details
  const { data: requests, error } = await adminSupabase
    .from('requirement_modification_requests')
    .select(`
      request_id,
      requirement_id,
      lead_employee_id,
      proposed_specs,
      status,
      created_at,
      employees:lead_employee_id (
        name
      ),
      requirement:requirement_id (
        property_type,
        budget_min,
        budget_max,
        city,
        area,
        area_min,
        area_max,
        customer:customer_id (
          name
        )
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    return (
      <div className="p-8 text-red-500 font-bold bg-red-950/20 border border-red-900 rounded-2xl">
        Failed to fetch modifications desk: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold tracking-tight">Requirement Modifications Desk</h1>
        <p className="text-sm text-zinc-400">
          Review specification adjustments recommended by Lead Representatives. Customer confirmation is mandatory before Admin approval.
        </p>
      </div>

      <ModificationsClient initialRequests={requests || []} />
    </div>
  );
}
