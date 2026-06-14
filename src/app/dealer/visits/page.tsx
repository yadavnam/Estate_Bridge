import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { 
  Calendar, Clock, User, ShieldAlert, CheckCircle2, 
  MapPin, XCircle, AlertCircle, CalendarRange 
} from 'lucide-react';

export default async function VisitsPage() {
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

  // Fetch visits for dealer's properties
  const { data: visits, error } = await adminSupabase
    .from('visits')
    .select(`
      visit_id,
      visit_date,
      visit_time,
      status,
      created_at,
      property_id,
      dealer_properties (
        property_id,
        title,
        price,
        city,
        area,
        dealer_id
      ),
      requirement_id,
      requirements (
        requirement_code
      ),
      visit_employees (
        id
      )
    `)
    .not('property_id', 'is', null)
    .is('deleted_at', null)
    .order('visit_date', { ascending: true });

  const list = visits || [];

  // Filter out any visits that don't match the dealer (should be empty anyway due to RLS)
  const dealerVisits = list
    .filter(v => 
      v.dealer_properties && 
      (v.dealer_properties as any).dealer_id === dealer.dealer_id
    )
    .map(v => ({
      visit_id: v.visit_id,
      visit_date: v.visit_date,
      visit_time: v.visit_time,
      status: v.status,
      created_at: v.created_at,
      property_id: v.property_id,
      dealer_properties: v.dealer_properties,
      requirements: v.requirements,
      coordinator_assigned: v.visit_employees && v.visit_employees.length > 0
    }));

  // Group visits
  const upcomingStatuses = ['Approved', 'Scheduled', 'Rescheduled', 'Postponed'];
  const pendingStatuses = ['Requested', 'Under Review'];
  
  const upcomingVisits = dealerVisits.filter(v => upcomingStatuses.includes(v.status));
  const pendingVisits = dealerVisits.filter(v => pendingStatuses.includes(v.status));
  const pastVisits = dealerVisits.filter(v => !upcomingStatuses.includes(v.status) && !pendingStatuses.includes(v.status));

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Scheduled':
      case 'Approved':
        return 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/25';
      case 'Requested':
      case 'Under Review':
        return 'bg-amber-500/15 text-amber-400 border border-amber-500/25';
      case 'Completed':
        return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25';
      case 'Cancelled':
      case 'Rejected':
        return 'bg-red-500/15 text-red-400 border border-red-500/25';
      default:
        return 'bg-zinc-800 text-zinc-400 border border-zinc-700/60';
    }
  };

  const renderVisitCard = (visit: any) => {
    const prop = visit.dealer_properties;
    const req = visit.requirements;
    const hasCoordinator = visit.coordinator_assigned;

    return (
      <div 
        key={visit.visit_id} 
        className="bg-zinc-900/40 border border-zinc-850 p-6 rounded-3xl backdrop-blur-xl hover:border-zinc-800 transition duration-300 space-y-4"
      >
        {/* Header: Status and Property Title */}
        <div className="flex justify-between items-start gap-4 pb-3 border-b border-zinc-855/40">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-zinc-550 uppercase tracking-widest block">Customer ID code</span>
            <span className="text-zinc-200 font-extrabold text-sm">Customer {req?.requirement_code || 'REQ-SiteVisit'}</span>
          </div>
          <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold uppercase ${getStatusBadgeClass(visit.status)}`}>
            {visit.status}
          </span>
        </div>

        {/* Visit Details */}
        <div className="grid grid-cols-2 gap-4 text-xs bg-zinc-950/40 border border-zinc-850/40 p-3.5 rounded-2xl">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-cyan-400 shrink-0" />
            <div>
              <span className="text-[9px] font-bold text-zinc-500 uppercase block">Scheduled Date</span>
              <span className="text-white font-bold">{new Date(visit.visit_date).toLocaleDateString()}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-400 shrink-0" />
            <div>
              <span className="text-[9px] font-bold text-zinc-500 uppercase block">Scheduled Time</span>
              <span className="text-white font-bold">{visit.visit_time}</span>
            </div>
          </div>
        </div>

        {/* Property target */}
        <div className="text-xs text-zinc-300 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-zinc-500 shrink-0" />
          <span className="font-semibold">{prop?.title}</span>
          <span className="text-zinc-550 text-zinc-500 font-medium">({prop?.area}, {prop?.city})</span>
        </div>

        {/* Coordination Status */}
        <div className="pt-3 border-t border-zinc-855/40 flex items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[9px] font-bold text-zinc-550 uppercase tracking-wider block">Coordination Status</span>
            {hasCoordinator ? (
              <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-400">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Coordinator Assigned</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-zinc-500 text-[10px] italic">
                <ShieldAlert className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                <span>Pending Assignment</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Visits Coordinator</h1>
        <p className="text-zinc-400 text-sm">
          Coordinate property walkthroughs and site inspections. All customer contact details are protected.
        </p>
      </div>

      {/* Grid segments */}
      <div className="space-y-8">
        
        {/* Section 1: Upcoming Inspections */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-zinc-800">
            <CalendarRange className="w-5 h-5 text-cyan-400" />
            <h2 className="font-bold text-white text-base">Upcoming Inspections ({upcomingVisits.length})</h2>
          </div>
          {upcomingVisits.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {upcomingVisits.map(renderVisitCard)}
            </div>
          ) : (
            <p className="text-zinc-500 text-xs italic bg-zinc-950/20 p-4 border border-dashed border-zinc-850 rounded-2xl">
              No upcoming inspections scheduled.
            </p>
          )}
        </div>

        {/* Section 2: Pending Requests */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-zinc-800">
            <Clock className="w-5 h-5 text-amber-400" />
            <h2 className="font-bold text-white text-base">Pending Request Queue ({pendingVisits.length})</h2>
          </div>
          {pendingVisits.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {pendingVisits.map(renderVisitCard)}
            </div>
          ) : (
            <p className="text-zinc-500 text-xs italic bg-zinc-950/20 p-4 border border-dashed border-zinc-850 rounded-2xl">
              No pending visit requests.
            </p>
          )}
        </div>

        {/* Section 3: History log */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-zinc-800">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <h2 className="font-bold text-white text-base">Past Inspections & History ({pastVisits.length})</h2>
          </div>
          {pastVisits.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-75">
              {pastVisits.map(renderVisitCard)}
            </div>
          ) : (
            <p className="text-zinc-500 text-xs italic bg-zinc-950/20 p-4 border border-dashed border-zinc-850 rounded-2xl">
              No visit history available.
            </p>
          )}
        </div>

      </div>
    </div>
  );
}
