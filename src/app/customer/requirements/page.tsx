import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import RequirementsClient from './requirements-client';

export default async function RequirementsPage() {
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

  // Fetch requirements (excluding soft-deleted ones)
  const { data: requirementsData, error: reqError } = await adminSupabase
    .from('requirements')
    .select(`
      *,
      requirement_amenities (amenity_name),
      requirement_facilities (facility_name),
      requirement_property_details (furnishing)
    `)
    .eq('customer_id', customer.customer_id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (reqError || !requirementsData) {
    return (
      <div className="text-center py-20 text-red-400">
        Error loading requirements. Please try again.
      </div>
    );
  }

  // Count active requirements (status is not Withdrawn)
  const activeCount = requirementsData.filter(r => r.status !== 'Withdrawn').length;
  const canCreateNew = activeCount < 3;

  // Fetch matched properties for all requirements
  let requirementsWithMatches = [...requirementsData];

  if (requirementsData.length > 0) {
    const reqIds = requirementsData.map(r => r.requirement_id);
    
    const { data: matchesData } = await adminSupabase
      .from('matching_requests')
      .select(`
        request_id,
        match_score,
        status,
        property_id,
        requirement_id,
        dealer_properties (
          title,
          property_type,
          price,
          city,
          area,
          area_size,
          bhk,
          facing
        )
      `)
      .in('requirement_id', reqIds)
      .in('status', ['Submitted', 'Approved']);

    // Map matches to requirements
    requirementsWithMatches = requirementsData.map(req => {
      const reqMatches = (matchesData || [])
        .filter(m => m.requirement_id === req.requirement_id)
        .map(m => ({
          request_id: m.request_id,
          match_score: Number(m.match_score),
          status: m.status,
          property_id: m.property_id,
          dealer_properties: m.dealer_properties as any
        }));
      return {
        ...req,
        matches: reqMatches
      };
    });
  }

  // Fetch pending modification requests for this customer's requirements
  let pendingModifications: any[] = [];
  if (requirementsData && requirementsData.length > 0) {
    const activeReqIds = requirementsData.filter(r => r.status !== 'Withdrawn').map(r => r.requirement_id);
    if (activeReqIds.length > 0) {
      const { data: mods } = await adminSupabase
        .from('requirement_modification_requests')
        .select(`
          *,
          employees:lead_employee_id (
            employee_name
          ),
          requirement:requirement_id (
            requirement_code
          )
        `)
        .in('requirement_id', activeReqIds)
        .eq('status', 'Pending');
      
      pendingModifications = mods || [];
    }
  }

  return (
    <RequirementsClient 
      requirements={requirementsWithMatches as any} 
      canCreateNew={canCreateNew} 
      pendingModifications={pendingModifications}
    />
  );
}
