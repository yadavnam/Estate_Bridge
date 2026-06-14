import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import TicketDetailClient from './ticket-detail-client';
import { ArrowLeft } from 'lucide-react';

export default async function SupportTicketDetailPage({ params }: { params: { id: string } }) {
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

  // Fetch ticket details
  const { data: ticket, error: ticketError } = await adminSupabase
    .from('support_tickets')
    .select('*')
    .eq('ticket_id', params.id)
    .eq('customer_id', customer.customer_id)
    .maybeSingle();

  if (ticketError || !ticket) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-red-400">Ticket Not Found</h2>
        <p className="text-zinc-500">The support ticket you are looking for does not exist or you are not authorized to view it.</p>
        <a href="/customer/support" className="text-cyan-400 hover:underline inline-flex items-center gap-1.5">
          <ArrowLeft className="w-4 h-4" /> Back to Support Centre
        </a>
      </div>
    );
  }

  // Fetch support messages in chronological order
  const { data: messages, error: msgError } = await adminSupabase
    .from('support_messages')
    .select('*')
    .eq('ticket_id', params.id)
    .order('created_at', { ascending: true });

  if (msgError || !messages) {
    return (
      <div className="text-center py-20 text-red-400">
        Error loading ticket conversation. Please try again.
      </div>
    );
  }

  // Fetch employee designations for non-customer senders to show helper labels
  const senderIds = Array.from(new Set(
    messages
      .filter(m => m.sender_role !== 'CUSTOMER' && m.sender_id)
      .map(m => m.sender_id)
  ));

  let employeeMap: Record<string, string> = {};
  if (senderIds.length > 0) {
    const { data: employees } = await adminSupabase
      .from('employees')
      .select('user_id, designation')
      .in('user_id', senderIds);
    
    employees?.forEach(emp => {
      employeeMap[emp.user_id] = emp.designation;
    });
  }

  // Map employee designations
  const mappedMessages = messages.map(m => ({
    ...m,
    designation: m.sender_role === 'CUSTOMER' ? 'Customer' : (employeeMap[m.sender_id] || 'Support Staff')
  }));

  return (
    <div className="space-y-6">
      <div className="mb-4">
        <a
          href="/customer/support"
          className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Support Centre
        </a>
      </div>
      
      <TicketDetailClient 
        ticket={ticket as any} 
        initialMessages={mappedMessages as any} 
        currentUserId={user.id} 
      />
    </div>
  );
}
