import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { ClipboardList, Sparkles, User, ShieldAlert, ArrowUpRight, CheckCircle2, DollarSign, MapPin, Building } from 'lucide-react';

export default async function MatchMarketplacePage() {
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

  // Fetch all matches
  const { data: matches, error } = await adminSupabase
    .from('matching_requests')
    .select(`
      request_id,
      match_score,
      status,
      created_at,
      property_id,
      dealer_properties (
        property_id,
        title,
        price,
        city,
        area,
        deleted_at
      ),
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
        deleted_at,
        requirement_employee_assignments (
          status
        )
      )
    `)
    .eq('dealer_id', dealer.dealer_id)
    .order('match_score', { ascending: false });

  // Filter out any matches where property or requirement has been soft-deleted
  const activeMatches = (matches || []).filter(m => 
    m.dealer_properties && 
    !(m.dealer_properties as any).deleted_at && 
    m.requirements && 
    !(m.requirements as any).deleted_at
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Match Marketplace</h1>
        <p className="text-zinc-400 text-sm">
          Browse active customer requirements automatically matched to your listings. All buyer details are obfuscated.
        </p>
      </div>

      {activeMatches.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {activeMatches.map((match: any) => {
            const prop = match.dealer_properties;
            const req = match.requirements;
            const assignments = req?.requirement_employee_assignments || [];
            const hasCoordinator = !!assignments.find((a: any) => a.status === 'Active');

            return (
              <div 
                key={match.request_id}
                className="bg-zinc-900/40 border border-zinc-850 hover:border-zinc-750 p-6 rounded-3xl backdrop-blur-xl transition duration-300 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  {/* Header row: Match score & Obfuscated customer id */}
                  <div className="flex justify-between items-center pb-3 border-b border-zinc-850/60">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Requirement Target</span>
                      <h3 className="font-extrabold text-sm text-white">Customer {req?.requirement_code || 'REQ-UNKNOWN'}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-lg text-xs font-bold flex items-center gap-0.5">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                        {match.match_score}% Match
                      </span>
                    </div>
                  </div>

                  {/* Matching Property */}
                  <div className="p-3 bg-zinc-950/60 border border-zinc-850 rounded-2xl flex items-center gap-3">
                    <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-xl shrink-0">
                      <Building className="w-4 h-4" />
                    </div>
                    <div className="space-y-0.5 min-w-0">
                      <span className="text-[9px] font-bold text-zinc-500 uppercase block">Matched Listing</span>
                      <a 
                        href={`/dealer/properties/${prop?.property_id}`}
                        className="text-xs font-bold text-zinc-200 hover:text-cyan-400 transition block truncate"
                      >
                        {prop?.title}
                      </a>
                    </div>
                  </div>

                  {/* Customer Preferences (Obfuscated specifications) */}
                  <div className="space-y-2">
                    <span className="text-[9px] font-bold text-zinc-550 uppercase tracking-widest block">Buyer Preferences</span>
                    <div className="grid grid-cols-2 gap-3 text-xs bg-zinc-950/40 border border-zinc-850/40 p-3 rounded-2xl">
                      <div className="space-y-1">
                        <span className="text-zinc-500 text-[10px] block">Budget Range</span>
                        <span className="text-white font-bold block">
                          ₹{Number(req?.budget_min).toLocaleString()} - ₹{Number(req?.budget_max).toLocaleString()}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-zinc-500 text-[10px] block">Location</span>
                        <span className="text-white font-bold block truncate">
                          {req?.area}, {req?.city}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Notes / Comments */}
                  {req?.additional_notes && (
                    <div className="p-3 bg-zinc-950/20 border border-zinc-900 rounded-xl">
                      <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">Requirement Notes</span>
                      <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">{req.additional_notes}</p>
                    </div>
                  )}
                </div>

                {/* Coordination Status */}
                <div className="pt-4 border-t border-zinc-850/60 mt-4 flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-zinc-550 uppercase tracking-widest block">Coordination Status</span>
                    {hasCoordinator ? (
                      <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-400">
                        <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                        <span>Coordinator Assigned</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-zinc-555 text-zinc-500 text-[10px] italic">
                        <ShieldAlert className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                        <span>Pending Assignment</span>
                      </div>
                    )}
                  </div>

                  <a
                    href={`/dealer/properties/${prop?.property_id}`}
                    className="bg-zinc-950 border border-zinc-850 hover:bg-zinc-900 hover:border-zinc-700 text-cyan-400 p-2.5 rounded-xl transition flex items-center gap-1.5 text-xs font-bold"
                  >
                    View Match
                    <ArrowUpRight className="w-4 h-4" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-zinc-900/10 border border-dashed border-zinc-850 rounded-3xl space-y-4">
          <ClipboardList className="w-12 h-12 text-zinc-650 mx-auto" />
          <h3 className="font-bold text-lg text-zinc-300">No matches in marketplace</h3>
          <p className="text-zinc-500 text-sm max-w-sm mx-auto">
            Once buyers input matching requirements in your active coverage areas, matches will appear here automatically.
          </p>
        </div>
      )}
    </div>
  );
}
