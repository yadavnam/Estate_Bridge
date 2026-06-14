import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import SitesClient from './sites-client';

export default async function SitesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const adminSupabase = createAdminClient();

  // Fetch all active, non-deleted registered sites
  const { data: sites, error } = await adminSupabase
    .from('registered_sites')
    .select(`
      *,
      site_property_types (property_type),
      site_facilities (facility_name),
      site_media (file_url, file_type)
    `)
    .eq('status', 'Active')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error || !sites) {
    return (
      <div className="text-center py-20 text-red-400">
        Error loading registered sites. Please try again.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Registered Builder Sites</h1>
        <p className="text-zinc-400 text-sm">Browse authorized developer projects and request direct site visits (Workflow 2).</p>
      </div>
      <SitesClient sites={sites as any} />
    </div>
  );
}
