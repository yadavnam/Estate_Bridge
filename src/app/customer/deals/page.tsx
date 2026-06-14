import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import DealsClient from './deals-client';

export default async function DealsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const adminSupabase = createAdminClient();

  // Resolve Customer profile
  const { data: customer } = await adminSupabase
    .from('customers')
    .select('customer_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!customer) {
    return (
      <div className="text-center py-20 text-red-400 font-semibold">
        Customer profile not found. Please log in again.
      </div>
    );
  }

  // Fetch all deals with properties and requirement info (strictly obfuscating dealer details)
  const { data: deals, error } = await adminSupabase
    .from('deals')
    .select(`
      *,
      dealer_properties (
        title,
        property_type,
        price,
        city,
        area
      ),
      requirements (
        requirement_code,
        property_type
      ),
      deal_lost_reasons (
        reason,
        notes
      )
    `)
    .eq('customer_id', customer.customer_id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error || !deals) {
    return (
      <div className="text-center py-20 text-red-400">
        Error loading deals engine data. Please try again.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Your Deals Engine</h1>
        <p className="text-zinc-400 text-sm">Monitor negotiations, contract documentation, token deposits, and registration milestones.</p>
      </div>
      <DealsClient deals={deals as any} />
    </div>
  );
}
