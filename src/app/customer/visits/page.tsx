import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import VisitsClient from './visits-client';

export default async function VisitsPage() {
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

  // Fetch all visits with registered site OR property details, plus feedbacks
  const { data: visits, error } = await adminSupabase
    .from('visits')
    .select(`
      *,
      registered_sites (
        site_name,
        builder_name,
        city,
        area
      ),
      dealer_properties (
        title,
        property_type,
        city,
        area
      ),
      feedbacks (
        feedback_id,
        site_rating,
        visit_rating,
        comments
      )
    `)
    .eq('customer_id', customer.customer_id)
    .is('deleted_at', null)
    .order('visit_date', { ascending: false })
    .order('visit_time', { ascending: false });

  if (error || !visits) {
    return (
      <div className="text-center py-20 text-red-400">
        Error loading visits data. Please try again.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Your Visits & Feedback</h1>
        <p className="text-zinc-400 text-sm">Track upcoming inspections, view past reports, and submit ratings for completed visits.</p>
      </div>
      <VisitsClient initialVisits={visits as any} />
    </div>
  );
}
