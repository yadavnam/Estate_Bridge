import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import PropertiesClient from './properties-client';

export default async function PropertiesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
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

  // Fetch properties (excluding soft-deleted)
  const { data: properties, error } = await adminSupabase
    .from('dealer_properties')
    .select(`
      *,
      property_amenities (amenity_name),
      property_facilities (facility_name),
      visits (
        visit_id,
        status
      ),
      deals (
        deal_id,
        current_stage
      )
    `)
    .eq('dealer_id', dealer.dealer_id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error || !properties) {
    return (
      <div className="text-center py-20 text-red-400">
        Error loading property bank. Please try again.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PropertiesClient properties={properties as any} />
    </div>
  );
}
