import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import DealersListClient from './dealers-list-client';

export default async function AdminDealersPage() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  const adminSupabase = createAdminClient();

  // Fetch all dealers
  const { data: dealers, error } = await adminSupabase
    .from('dealers')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return (
      <div className="p-8 text-red-500 font-bold bg-red-950/20 border border-red-900 rounded-2xl">
        Failed to fetch dealers roster: {error.message}
      </div>
    );
  }

  // Map database columns to fields expected by the client component
  const mappedDealers = (dealers || []).map((d: any) => ({
    ...d,
    mobile_number: d.mobile,
    rera_registration_number: d.rera_number,
    status: d.dealer_status
  }));

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold tracking-tight">Dealer Verification & Approvals</h1>
        <p className="text-sm text-zinc-400">
          Verify dealer identities, inspect RERA registration credentials, manage platform trust ratings, and block compliance violations.
        </p>
      </div>

      <DealersListClient initialDealers={mappedDealers} />
    </div>
  );
}
