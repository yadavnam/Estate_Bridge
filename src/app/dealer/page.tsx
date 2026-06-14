import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { 
  Building2, Handshake, Calendar, Sparkles, 
  MapPin, Plus, ArrowRight, ShieldCheck, ClipboardCheck
} from 'lucide-react';

export default async function DealerDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const adminSupabase = createAdminClient();

  // Resolve Dealer profile
  const { data: dealer, error: dealerError } = await adminSupabase
    .from('dealers')
    .select('dealer_id, company_name, owner_name, trust_score, rera_number')
    .eq('user_id', user.id)
    .maybeSingle();

  if (dealerError || !dealer) {
    return (
      <div className="text-center py-20 text-red-400 font-semibold">
        Partner profile not found. Please log in again.
      </div>
    );
  }

  // Fetch listed properties (not soft-deleted)
  const { data: dealerProps, error: propError } = await adminSupabase
    .from('dealer_properties')
    .select('property_id, title, property_type, price, status, city, area')
    .eq('dealer_id', dealer.dealer_id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  const activePropsCount = dealerProps?.length || 0;
  const propIds = dealerProps?.map(p => p.property_id) || [];

  // Fetch count of active deals (not Won/Lost)
  const { count: activeDealsCount } = await adminSupabase
    .from('deals')
    .select('*', { count: 'exact', head: true })
    .eq('dealer_id', dealer.dealer_id)
    .not('current_stage', 'in', '("Closed Won", "Closed Lost")')
    .is('deleted_at', null);

  // Fetch upcoming scheduled visits & count
  let activeVisitsCount = 0;
  let upcomingVisits: any[] = [];
  if (propIds.length > 0) {
    const { count } = await adminSupabase
      .from('visits')
      .select('*', { count: 'exact', head: true })
      .in('property_id', propIds)
      .in('status', ['Requested', 'Under Review', 'Approved', 'Scheduled', 'Rescheduled', 'Postponed'])
      .is('deleted_at', null);
    activeVisitsCount = count || 0;

    const { data } = await adminSupabase
      .from('visits')
      .select(`
        visit_id,
        visit_date,
        visit_time,
        status,
        dealer_properties (
          title
        )
      `)
      .in('property_id', propIds)
      .in('status', ['Requested', 'Under Review', 'Approved', 'Scheduled', 'Rescheduled', 'Postponed'])
      .order('visit_date', { ascending: true })
      .limit(3);
    upcomingVisits = data || [];
  }

  // Fetch count of active match notifications
  let matchesCount = 0;
  if (propIds.length > 0) {
    const { count } = await adminSupabase
      .from('matching_requests')
      .select('*', { count: 'exact', head: true })
      .in('property_id', propIds)
      .eq('status', 'Approved');
    matchesCount = count || 0;
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-900/40 p-6 sm:p-8 rounded-3xl border border-zinc-850/60 backdrop-blur-xl">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-cyan-400 font-semibold text-sm">
            <ShieldCheck className="w-4 h-4" />
            <span>Approved Platform Partner</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Welcome, {dealer.owner_name}</h1>
          <p className="text-zinc-400 text-sm">Manage listings, review customer compatibility metrics, and coordinate deals.</p>
        </div>
        <div className="px-4 py-2.5 bg-zinc-950/60 border border-zinc-800 rounded-xl text-xs text-zinc-400 font-medium space-y-1">
          <div>RERA ID: <span className="text-white font-bold">{dealer.rera_number || 'N/A'}</span></div>
          <div className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
            <ClipboardCheck className="w-3.5 h-3.5 text-emerald-400" />
            RERA Status: Verified
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Listed Properties */}
        <a href="/dealer/properties" className="block bg-zinc-900/60 hover:bg-zinc-800/40 border border-zinc-850/80 rounded-2xl p-6 transition group relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-zinc-950 rounded-xl group-hover:bg-cyan-950/20 group-hover:text-cyan-400 transition">
              <Building2 className="w-6 h-6 text-zinc-400 group-hover:text-cyan-400" />
            </div>
            <span className="text-3xl font-extrabold tracking-tight">{activePropsCount}</span>
          </div>
          <h3 className="font-bold text-sm text-zinc-300 group-hover:text-white transition">Listed Properties</h3>
          <p className="text-xs text-zinc-500 mt-1">Your property bank size</p>
        </a>

        {/* Active Deals */}
        <a href="/dealer/deals" className="block bg-zinc-900/60 hover:bg-zinc-800/40 border border-zinc-850/80 rounded-2xl p-6 transition group relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-zinc-950 rounded-xl group-hover:bg-indigo-950/20 group-hover:text-indigo-400 transition">
              <Handshake className="w-6 h-6 text-zinc-400 group-hover:text-indigo-400" />
            </div>
            <span className="text-3xl font-extrabold tracking-tight">{activeDealsCount || 0}</span>
          </div>
          <h3 className="font-bold text-sm text-zinc-300 group-hover:text-white transition">Active Deals</h3>
          <p className="text-xs text-zinc-500 mt-1">Negotiations in pipeline</p>
        </a>

        {/* Scheduled Visits */}
        <a href="/dealer/visits" className="block bg-zinc-900/60 hover:bg-zinc-800/40 border border-zinc-850/80 rounded-2xl p-6 transition group relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-zinc-950 rounded-xl group-hover:bg-emerald-950/20 group-hover:text-emerald-400 transition">
              <Calendar className="w-6 h-6 text-zinc-400 group-hover:text-emerald-400" />
            </div>
            <span className="text-3xl font-extrabold tracking-tight">{activeVisitsCount}</span>
          </div>
          <h3 className="font-bold text-sm text-zinc-300 group-hover:text-white transition">Scheduled Inspections</h3>
          <p className="text-xs text-zinc-500 mt-1">Upcoming site coordination</p>
        </a>

        {/* Marketplace Matches */}
        <a href="/dealer/marketplace" className="block bg-gradient-to-br from-cyan-900/20 to-indigo-900/20 border border-cyan-850/60 rounded-2xl p-6 transition hover:from-cyan-900/30 hover:to-indigo-900/30 group relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-zinc-950/60 rounded-xl group-hover:bg-cyan-500 group-hover:text-black transition">
              <Sparkles className="w-6 h-6 text-cyan-400 group-hover:text-black" />
            </div>
            <span className="text-3xl font-extrabold tracking-tight text-white">{matchesCount}</span>
          </div>
          <h3 className="font-bold text-sm text-zinc-300 group-hover:text-white transition">Compatible Matches</h3>
          <p className="text-xs text-zinc-550 mt-1">Customer requirements mapped</p>
        </a>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Columns: Listings & Quick Uploads */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-zinc-900/30 border border-zinc-850/80 p-6 sm:p-8 rounded-3xl space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Building2 className="w-5 h-5 text-cyan-400" />
                Recent Listed Properties
              </h2>
              <a 
                href="/dealer/properties/new" 
                className="bg-zinc-950 border border-zinc-850 hover:bg-zinc-900 text-zinc-200 hover:text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <Plus className="w-4 h-4 text-cyan-400" />
                Add Listing
              </a>
            </div>

            {dealerProps && dealerProps.length > 0 ? (
              <div className="divide-y divide-zinc-850/60">
                {dealerProps.slice(0, 3).map((prop) => (
                  <div key={prop.property_id} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <p className="font-bold text-zinc-200">{prop.title}</p>
                      <p className="text-xs text-zinc-500 flex items-center gap-2">
                        <span>{prop.property_type}</span>
                        <span>•</span>
                        <span className="flex items-center gap-0.5 text-zinc-400">
                          <MapPin className="w-3 h-3" /> {prop.area}, {prop.city}
                        </span>
                        <span>•</span>
                        <span className="text-zinc-300 font-semibold">₹{Number(prop.price).toLocaleString()}</span>
                      </p>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      prop.status === 'Active' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'bg-zinc-850 text-zinc-400 border border-zinc-800'
                    }`}>
                      {prop.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-zinc-500 text-sm">
                You have not listed any properties in your property bank.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Upcoming Inspections */}
        <div className="bg-zinc-900/30 border border-zinc-850/80 p-6 sm:p-8 rounded-3xl space-y-6">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-400" />
            Inspection Slots
          </h2>

          {upcomingVisits.length > 0 ? (
            <div className="space-y-4">
              {upcomingVisits.map((visit) => (
                <div key={visit.visit_id} className="bg-zinc-950/50 border border-zinc-850 p-4 rounded-2xl space-y-2 text-xs">
                  <div className="flex justify-between items-center gap-2">
                    <span className="font-bold text-zinc-200 line-clamp-1">
                      {(visit.dealer_properties as any)?.title || 'Listing'}
                    </span>
                    <span className="px-2 py-0.5 bg-cyan-950/30 text-cyan-400 rounded-md text-[9px] font-extrabold uppercase shrink-0">
                      {visit.status}
                    </span>
                  </div>
                  <div className="text-[10px] text-zinc-550 text-zinc-500">
                    {visit.visit_date} @ {visit.visit_time}
                  </div>
                </div>
              ))}
              <a 
                href="/dealer/visits" 
                className="w-full bg-zinc-950 border border-zinc-850 hover:bg-zinc-900 text-zinc-400 hover:text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 transition text-xs cursor-pointer"
              >
                View Coordinator Console
                <ArrowRight className="w-4 h-4 text-zinc-500" />
              </a>
            </div>
          ) : (
            <div className="text-center py-10 text-zinc-550 text-xs text-zinc-500">
              No inspections scheduled.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
