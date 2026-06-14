import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import DealsAuditorClient from './deals-auditor-client';

export default async function AdminDealsPage() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  const adminSupabase = createAdminClient();

  // Fetch all deals
  const { data: deals, error } = await adminSupabase
    .from('deals')
    .select(`
      deal_id,
      current_stage,
      created_at,
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
      ),
      dealer:dealer_id (
        company_name,
        owner_name
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    return (
      <div className="p-8 text-red-500 font-bold bg-red-950/20 border border-red-900 rounded-2xl">
        Failed to fetch deals: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold tracking-tight">Platform Deals Auditor</h1>
        <p className="text-sm text-zinc-400">
          Audit transactions, verify proof documents mapping for milestone payments and registrations, and approve final Closed Won closures.
        </p>
      </div>

      <DealsAuditorClient initialDeals={deals || []} />
    </div>
  );
}
