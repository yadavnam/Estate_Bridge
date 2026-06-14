import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import SupportClient from './support-client';

export default async function SupportPage() {
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

  // Fetch all support tickets for customer
  const { data: tickets, error } = await adminSupabase
    .from('support_tickets')
    .select(`
      *,
      support_messages (
        message_id,
        created_at
      )
    `)
    .eq('customer_id', customer.customer_id)
    .order('created_at', { ascending: false });

  if (error || !tickets) {
    return (
      <div className="text-center py-20 text-red-400">
        Error loading support tickets. Please try again.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Support Centre</h1>
        <p className="text-zinc-400 text-sm">Open support tickets, communicate with platform employees, and close resolved issues.</p>
      </div>
      <SupportClient tickets={tickets as any} />
    </div>
  );
}
