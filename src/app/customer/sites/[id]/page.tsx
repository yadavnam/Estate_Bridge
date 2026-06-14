import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import SiteDetailsClient from './site-details-client';
import { ArrowLeft } from 'lucide-react';

export default async function SiteDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const adminSupabase = createAdminClient();

  // Fetch the registered site with associated properties, facilities, media
  const { data: site, error } = await adminSupabase
    .from('registered_sites')
    .select(`
      *,
      site_property_types (property_type),
      site_facilities (facility_name),
      site_media (media_id, file_url, file_type)
    `)
    .eq('site_id', params.id)
    .eq('status', 'Active')
    .is('deleted_at', null)
    .maybeSingle();

  if (error || !site) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-red-400">Registered Site Not Found</h2>
        <p className="text-zinc-500">The site you are looking for might have been deactivated or removed.</p>
        <a href="/customer/sites" className="text-cyan-400 hover:underline inline-flex items-center gap-1.5">
          <ArrowLeft className="w-4 h-4" /> Back to Directory
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-4">
        <a
          href="/customer/sites"
          className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Directory
        </a>
      </div>
      <SiteDetailsClient site={site as any} />
    </div>
  );
}
