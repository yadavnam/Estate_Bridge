import React from 'react';
import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import PropertyDetailsClient from './property-details-client';
import { ArrowLeft } from 'lucide-react';

interface PageProps {
  params: Promise<{ id: string }> | { id: string };
}

export default async function PropertyDetailPage({ params }: PageProps) {
  const resolvedParams = await params;
  const id = resolvedParams.id;

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

  // Fetch the property details (must belong to this dealer)
  const { data: property, error: propError } = await adminSupabase
    .from('dealer_properties')
    .select(`
      *,
      property_amenities (amenity_name),
      property_facilities (facility_name, distance),
      property_media (file_url)
    `)
    .eq('property_id', id)
    .eq('dealer_id', dealer.dealer_id)
    .is('deleted_at', null)
    .maybeSingle();

  if (propError || !property) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-red-400">Property Listing Not Found</h2>
        <p className="text-zinc-500">The property you are looking for might have been deleted or doesn't belong to your account.</p>
        <a href="/dealer/properties" className="text-cyan-400 hover:underline inline-flex items-center gap-1.5">
          <ArrowLeft className="w-4 h-4" /> Back to Property Bank
        </a>
      </div>
    );
  }

  // Fetch matched requirements for this property
  const { data: matches, error: matchError } = await adminSupabase
    .from('matching_requests')
    .select(`
      request_id,
      match_score,
      status,
      created_at,
      requirement_id,
      requirements (
        requirement_id,
        requirement_code,
        property_type,
        budget_min,
        budget_max,
        city,
        area,
        area_min,
        area_max,
        additional_notes,
        requirement_employee_assignments (
          status
        )
      )
    `)
    .eq('property_id', id)
    .order('match_score', { ascending: false });

  return (
    <div className="space-y-6">
      <div className="mb-4">
        <a
          href="/dealer/properties"
          className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Property Bank
        </a>
      </div>
      <PropertyDetailsClient property={property as any} matches={(matches || []) as any} />
    </div>
  );
}
