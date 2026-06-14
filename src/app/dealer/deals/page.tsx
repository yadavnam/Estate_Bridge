import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import DealsClient from './deals-client';

export default async function DealsPage() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user || user.app_metadata?.role !== 'DEALER') {
    redirect('/login');
  }

  const status = user.app_metadata?.status;
  if (status !== 'Approved') {
    redirect('/login?error=not_approved');
  }

  const adminSupabase = createAdminClient();

  // Resolve Dealer profile
  const { data: dealer } = await adminSupabase
    .from('dealers')
    .select('dealer_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!dealer) {
    redirect('/login');
  }

  // Fetch deals
  const { data: deals, error } = await adminSupabase
    .from('deals')
    .select(`
      deal_id,
      current_stage,
      is_suspended,
      created_at,
      property_id,
      dealer_properties (
        property_id,
        title,
        price,
        city,
        area
      ),
      requirement_id,
      requirements (
        requirement_code,
        requirement_employee_assignments (
          status,
          employees (
            designation
          )
        )
      )
    `)
    .eq('dealer_id', dealer.dealer_id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) {
    return (
      <div className="text-center py-20 text-red-400">
        Error loading deals pipeline. Please refresh the page.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <DealsClient deals={(deals || []) as any} />
    </div>
  );
}
