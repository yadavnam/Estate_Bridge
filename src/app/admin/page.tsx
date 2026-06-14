import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { 
  Building, ClipboardList, UserCheck, HelpCircle, 
  AlertTriangle, ArrowRight, ShieldAlert, CheckCircle, Clock, Handshake
} from 'lucide-react';

export default async function AdminDashboard() {
  const adminSupabase = createAdminClient();

  // 1. Fetch total active properties
  const { count: propertiesCount } = await adminSupabase
    .from('dealer_properties')
    .select('property_id', { count: 'exact', head: true })
    .is('deleted_at', null);

  // 2. Fetch total active requirements
  const { count: requirementsCount } = await adminSupabase
    .from('requirements')
    .select('requirement_id', { count: 'exact', head: true })
    .is('deleted_at', null);

  // 3. Fetch pending dealers approvals count
  const { count: pendingDealersCount } = await adminSupabase
    .from('dealers')
    .select('dealer_id', { count: 'exact', head: true })
    .eq('status', 'Pending');

  // 4. Fetch open support tickets and identify SLA breaches (> 24 hours unanswered)
  const { data: openTickets } = await adminSupabase
    .from('support_tickets')
    .select(`
      ticket_id,
      title,
      status,
      created_at,
      customer:customer_id (
        name
      )
    `)
    .eq('status', 'Open')
    .order('created_at', { ascending: true });

  const now = Date.now();
  const slaBreachedTickets = openTickets?.filter((t: any) => {
    const createdTime = new Date(t.created_at).getTime();
    const ageHours = (now - createdTime) / (1000 * 60 * 60);
    return ageHours > 24; // SLA is 24 hours
  }) || [];

  // 5. Fetch recent deal negotiations
  const { data: recentDeals } = await adminSupabase
    .from('deals')
    .select(`
      deal_id,
      current_stage,
      created_at,
      property:property_id (
        title
      ),
      customer:customer_id (
        name
      )
    `)
    .order('created_at', { ascending: false })
    .limit(5);

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-zinc-900 via-slate-900 to-zinc-900 p-8 rounded-3xl border border-zinc-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
          System Administration Console
        </h1>
        <p className="text-zinc-400 text-sm mt-2 max-w-xl">
          Overview of platform operations, dealer RERA verifications, deal stage document audits, and SLA ticketing compliance.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Active Properties Card */}
        <div className="bg-zinc-900/60 border border-zinc-800/80 p-6 rounded-2xl relative overflow-hidden group hover:border-zinc-700 transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Property Bank Listings</span>
            <div className="p-2.5 bg-zinc-950/60 text-cyan-400 rounded-xl">
              <Building className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-3xl font-black">{propertiesCount || 0}</h3>
          <p className="text-[10px] text-zinc-400 mt-1 font-medium">Active dealer listings</p>
        </div>

        {/* Active Requirements Card */}
        <div className="bg-zinc-900/60 border border-zinc-800/80 p-6 rounded-2xl relative overflow-hidden group hover:border-zinc-700 transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Client Requirements</span>
            <div className="p-2.5 bg-zinc-950/60 text-indigo-400 rounded-xl">
              <ClipboardList className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-3xl font-black">{requirementsCount || 0}</h3>
          <p className="text-[10px] text-zinc-400 mt-1 font-medium">Active buyers matched</p>
        </div>

        {/* Pending Approvals Card */}
        <div className="bg-zinc-900/60 border border-zinc-800/80 p-6 rounded-2xl relative overflow-hidden group hover:border-zinc-700 transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Pending Dealers</span>
            <div className="p-2.5 bg-zinc-950/60 text-yellow-500 rounded-xl">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-3xl font-black text-yellow-400">{pendingDealersCount || 0}</h3>
          <p className="text-[10px] text-zinc-400 mt-1 font-medium">Awaiting RERA verification</p>
        </div>

        {/* SLA Breaches Card */}
        <div className="bg-zinc-900/60 border border-red-955 p-6 rounded-2xl relative overflow-hidden group hover:border-red-900 transition-all border-red-950">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-red-400 uppercase tracking-wider">SLA Breaches</span>
            <div className="p-2.5 bg-red-950/40 text-red-400 rounded-xl animate-pulse">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-3xl font-black text-red-500">{slaBreachedTickets.length}</h3>
          <p className="text-[10px] text-red-400 mt-1 font-bold">Unreplied tickets &gt; 24h</p>
        </div>

      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* SLA Tickets alerts queue */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400 animate-bounce" />
              SLA Critical Support Queue
            </h2>
            <a 
              href="/admin/support" 
              className="text-xs font-semibold text-cyan-400 hover:text-white flex items-center gap-1 group transition-colors"
            >
              Support Console
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </a>
          </div>

          <div className="space-y-4">
            {slaBreachedTickets.length > 0 ? (
              slaBreachedTickets.map((ticket: any) => {
                const ageHours = Math.floor((now - new Date(ticket.created_at).getTime()) / (1000 * 60 * 60));
                return (
                  <div 
                    key={ticket.ticket_id}
                    className="p-5 bg-red-950/5 border border-red-950 hover:border-red-900 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-red-950 text-red-400 border border-red-900 text-[9px] font-bold rounded uppercase">
                          SLA Breach
                        </span>
                        <span className="text-[10px] text-red-400 font-semibold flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          Unreplied for {ageHours} hours
                        </span>
                      </div>
                      <h4 className="font-extrabold text-sm text-white">{ticket.title}</h4>
                      <p className="text-xs text-zinc-400">Customer: {ticket.customer?.name}</p>
                    </div>

                    <div>
                      <a
                        href="/admin/support"
                        className="px-4 py-2 bg-red-950 text-red-400 border border-red-900 hover:bg-red-900 hover:text-white text-xs font-bold rounded-xl transition-all inline-block"
                      >
                        Reply Ticket
                      </a>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center bg-zinc-900/20 border border-zinc-800 rounded-2xl text-zinc-500 text-sm">
                No tickets in SLA breach. All support compliance parameters are met.
              </div>
            )}
          </div>
        </div>

        {/* Recent Deals Pipeline Monitor */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <Handshake className="w-5 h-5 text-cyan-400" />
              Recent Deals
            </h2>
            <a 
              href="/admin/deals" 
              className="text-xs font-semibold text-cyan-400 hover:text-white flex items-center gap-1 group transition-colors"
            >
              Auditor Deck
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </a>
          </div>

          <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-4 space-y-4 max-h-[400px] overflow-y-auto">
            {recentDeals && recentDeals.length > 0 ? (
              recentDeals.map((deal: any) => {
                const isWon = deal.current_stage === 'Closed Won';
                const isLost = deal.current_stage === 'Closed Lost';
                let stageColor = 'bg-zinc-950 text-zinc-400 border border-zinc-850';
                
                if (isWon) stageColor = 'bg-emerald-950 text-emerald-400 border border-emerald-900';
                else if (isLost) stageColor = 'bg-red-950/20 text-red-400 border border-red-900';
                else if (deal.current_stage === 'Token Paid') stageColor = 'bg-indigo-950 text-indigo-400 border border-indigo-900';

                return (
                  <div key={deal.deal_id} className="p-3.5 bg-zinc-900/40 border border-zinc-800 hover:border-zinc-750 rounded-xl space-y-2.5 transition-all">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-extrabold text-xs text-white truncate max-w-[125px]">
                        {deal.customer?.name}
                      </span>
                      <span className={`px-2 py-0.5 text-[8px] font-bold rounded uppercase ${stageColor}`}>
                        {deal.current_stage}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 line-clamp-1 font-medium">
                      Listing: {deal.property?.title || 'Property Bank'}
                    </p>
                    <div className="text-[9px] text-zinc-550 flex items-center gap-1 text-zinc-500">
                      <Clock className="w-3.5 h-3.5 text-zinc-600" />
                      <span>{new Date(deal.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-6 text-center text-zinc-500 text-xs">
                No active negotiations in pipeline.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
