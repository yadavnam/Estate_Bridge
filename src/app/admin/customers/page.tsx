import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import CustomersClient from './customers-client';

export default async function AdminCustomersPage() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  const adminSupabase = createAdminClient();

  // Fetch all customers
  const { data: customers, error } = await adminSupabase
    .from('customers')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return (
      <div className="p-8 text-red-500 font-bold bg-red-950/20 border border-red-900 rounded-2xl">
        Failed to fetch customers: {error.message}
      </div>
    );
  }

  // Map database columns to fields expected by the client component
  const mappedCustomers = (customers || []).map((c: any) => ({
    ...c,
    name: c.full_name,
    status: c.profile_status
  }));

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold tracking-tight">Customer Accounts Directory</h1>
        <p className="text-sm text-zinc-400">
          Monitor customer portal registrations, inspect profile states, and trigger soft-delete anonymization.
        </p>
      </div>

      <CustomersClient initialCustomers={mappedCustomers} />
    </div>
  );
}
