import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { ClipboardList, Calendar, Handshake, LifeBuoy, AlertTriangle, ArrowRight, User, MapPin } from 'lucide-react';

export default async function CustomerDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const adminSupabase = createAdminClient();

  // Resolve Customer profile
  const { data: customer } = await adminSupabase
    .from('customers')
    .select('customer_id, full_name, city')
    .eq('user_id', user!.id)
    .single();

  // Fetch count of active requirements (not Withdrawn, not soft-deleted)
  const { count: activeReqsCount } = await adminSupabase
    .from('requirements')
    .select('*', { count: 'exact', head: true })
    .eq('customer_id', customer!.customer_id)
    .neq('status', 'Withdrawn')
    .is('deleted_at', null);

  // Fetch upcoming scheduled visits
  const { data: upcomingVisits } = await adminSupabase
    .from('visits')
    .select('visit_id, visit_date, visit_time, status, registered_sites(site_name), dealer_properties(title)')
    .eq('customer_id', customer!.customer_id)
    .in('status', ['Requested', 'Under Review', 'Approved', 'Scheduled', 'Rescheduled', 'Postponed'])
    .order('visit_date', { ascending: true })
    .limit(3);

  // Fetch ongoing deals
  const { count: activeDealsCount } = await adminSupabase
    .from('deals')
    .select('*', { count: 'exact', head: true })
    .eq('customer_id', customer!.customer_id)
    .not('current_stage', 'in', '("Closed Won", "Closed Lost")')
    .is('deleted_at', null);

  // Fetch open tickets
  const { count: openTicketsCount } = await adminSupabase
    .from('support_tickets')
    .select('*', { count: 'exact', head: true })
    .eq('customer_id', customer!.customer_id)
    .eq('status', 'Open');

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-900/40 p-6 sm:p-8 rounded-3xl border border-zinc-850/60 backdrop-blur-xl">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-cyan-400 font-semibold text-sm">
            <User className="w-4 h-4" />
            <span>Customer Space</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Welcome, {customer!.full_name}</h1>
          <p className="text-zinc-400 text-sm">Manage your properties search, coordinates, and deal flow from one console.</p>
        </div>
        <div className="px-4 py-2 bg-zinc-950/60 border border-zinc-800 rounded-xl text-xs text-zinc-400 font-medium">
          City Location: <span className="text-white font-bold">{customer!.city}</span>
        </div>
      </div>

      {/* Requirement Limit Alert */}
      {activeReqsCount !== null && activeReqsCount >= 3 && (
        <div className="p-4 bg-amber-950/40 border border-amber-800/60 rounded-2xl flex items-start gap-3 text-amber-300 text-sm">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">Active Requirement Limit Reached (3 / 3)</p>
            <p className="text-xs text-amber-400/90">
              You have reached your maximum limit of 3 active requirements. You cannot submit new requirements until you withdraw one of your active requirements.
            </p>
          </div>
        </div>
      )}

      {/* Quick Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Active Requirements Card */}
        <a href="/customer/requirements" className="block bg-zinc-900/60 hover:bg-zinc-800/40 border border-zinc-850/80 rounded-2xl p-6 transition group relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-zinc-950 rounded-xl group-hover:bg-cyan-950/20 group-hover:text-cyan-400 transition">
              <ClipboardList className="w-6 h-6 text-zinc-400 group-hover:text-cyan-400" />
            </div>
            <span className="text-3xl font-extrabold tracking-tight">{activeReqsCount || 0}</span>
          </div>
          <h3 className="font-bold text-sm text-zinc-300 group-hover:text-white transition">Active Requirements</h3>
          <p className="text-xs text-zinc-500 mt-1">Property specifications search</p>
        </a>

        {/* Active Deals Card */}
        <a href="/customer/deals" className="block bg-zinc-900/60 hover:bg-zinc-800/40 border border-zinc-850/80 rounded-2xl p-6 transition group relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-zinc-950 rounded-xl group-hover:bg-indigo-950/20 group-hover:text-indigo-400 transition">
              <Handshake className="w-6 h-6 text-zinc-400 group-hover:text-indigo-400" />
            </div>
            <span className="text-3xl font-extrabold tracking-tight">{activeDealsCount || 0}</span>
          </div>
          <h3 className="font-bold text-sm text-zinc-300 group-hover:text-white transition">Active Deals</h3>
          <p className="text-xs text-zinc-500 mt-1">Negotiations in progress</p>
        </a>

        {/* Support Tickets Card */}
        <a href="/customer/support" className="block bg-zinc-900/60 hover:bg-zinc-800/40 border border-zinc-850/80 rounded-2xl p-6 transition group relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-zinc-950 rounded-xl group-hover:bg-emerald-950/20 group-hover:text-emerald-400 transition">
              <LifeBuoy className="w-6 h-6 text-zinc-400 group-hover:text-emerald-400" />
            </div>
            <span className="text-3xl font-extrabold tracking-tight">{openTicketsCount || 0}</span>
          </div>
          <h3 className="font-bold text-sm text-zinc-300 group-hover:text-white transition">Open Tickets</h3>
          <p className="text-xs text-zinc-500 mt-1">Platform support inquiries</p>
        </a>

        {/* Sites Search Promotion */}
        <a href="/customer/sites" className="block bg-gradient-to-br from-cyan-900/20 to-indigo-900/20 border border-cyan-850/60 rounded-2xl p-6 transition hover:from-cyan-900/30 hover:to-indigo-900/30 group relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-zinc-950/60 rounded-xl group-hover:bg-cyan-500 group-hover:text-black transition">
              <MapPin className="w-6 h-6 text-cyan-400 group-hover:text-black" />
            </div>
            <ArrowRight className="w-5 h-5 text-zinc-400 group-hover:text-white transition" />
          </div>
          <h3 className="font-bold text-sm text-zinc-300 group-hover:text-white transition">Explore Builder Sites</h3>
          <p className="text-xs text-zinc-500 mt-1">Direct-to-site visit requests</p>
        </a>
      </div>

      {/* Upcoming Visits */}
      <div className="bg-zinc-900/30 border border-zinc-850/80 p-6 sm:p-8 rounded-3xl space-y-6">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Calendar className="w-5 h-5 text-indigo-400" />
          Upcoming Scheduled Visits
        </h2>

        {upcomingVisits && upcomingVisits.length > 0 ? (
          <div className="divide-y divide-zinc-850/60">
            {upcomingVisits.map((visit) => {
              const siteObj = Array.isArray(visit.registered_sites)
                ? visit.registered_sites[0]
                : (visit.registered_sites as any);

              const propObj = Array.isArray(visit.dealer_properties)
                ? visit.dealer_properties[0]
                : (visit.dealer_properties as any);

              const targetName = siteObj?.site_name || propObj?.title || 'Property Match';
              return (
                <div key={visit.visit_id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="space-y-1">
                    <p className="font-bold text-zinc-200">{targetName}</p>
                    <p className="text-xs text-zinc-500">
                      Visit Date: <span className="text-zinc-300">{visit.visit_date}</span> | Time: <span className="text-zinc-300">{visit.visit_time}</span>
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-full text-xs font-semibold text-cyan-400">
                    {visit.status}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-10 text-zinc-500 text-sm">
            No upcoming scheduled visits. Submit a requirement or explore builder sites to request a visit.
          </div>
        )}
      </div>
    </div>
  );
}
