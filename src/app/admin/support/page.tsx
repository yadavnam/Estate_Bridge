import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import SupportDeskClient from './support-desk-client';

export default async function AdminSupportPage() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  const adminSupabase = createAdminClient();

  // Fetch all tickets with messages and customer details
  const { data: tickets, error } = await adminSupabase
    .from('support_tickets')
    .select(`
      ticket_id,
      title,
      description,
      status,
      created_at,
      customer:customer_id (
        name,
        email,
        phone
      ),
      support_messages (
        message_id,
        sender_id,
        message_text,
        created_at
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    return (
      <div className="p-8 text-red-500 font-bold bg-red-950/20 border border-red-900 rounded-2xl">
        Failed to fetch support tickets: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold tracking-tight">Customer Support Desk</h1>
        <p className="text-sm text-zinc-400">
          Respond to active support cases, monitor response compliance times, and resolve customer complaints. Unanswered cases &gt; 24h are escalated.
        </p>
      </div>

      <SupportDeskClient initialTickets={tickets || []} />
    </div>
  );
}
