import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import CoverageClient from './coverage-client';

export default async function CoveragePage() {
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

  // Fetch Serviced Territories
  const { data: coverage, error } = await adminSupabase
    .from('dealer_coverage_areas')
    .select('*')
    .eq('dealer_id', dealer.dealer_id)
    .order('city', { ascending: true })
    .order('area', { ascending: true });

  if (error || !coverage) {
    return (
      <div className="text-center py-20 text-red-400">
        Error loading coverage areas. Please try again.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Coverage Areas</h1>
        <p className="text-zinc-400 text-sm">Manage the geographies, cities, and localities where your agency lists properties.</p>
      </div>
      <CoverageClient coverage={coverage as any} />
    </div>
  );
}
