'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateDealStage } from '@/app/actions/dealer';
import { 
  Handshake, User, Lock, AlertCircle, CheckCircle2, 
  HelpCircle, ShieldAlert, ArrowRight, Activity, TrendingUp 
} from 'lucide-react';

interface Deal {
  deal_id: string;
  current_stage: 'Interested' | 'Negotiation' | 'Token Paid' | 'Documentation' | 'Registration' | 'Closed Won' | 'Closed Lost';
  is_suspended: boolean;
  created_at: string;
  property_id: string;
  dealer_properties: {
    property_id: string;
    title: string;
    price: number;
    city: string;
    area: string;
  };
  requirement_id: string;
  requirements: {
    requirement_code: string;
    requirement_employee_assignments: {
      status: string;
      employees: {
        designation: string;
      };
    }[];
  };
}

const ORDERED_STAGES = [
  'Interested',
  'Negotiation',
  'Token Paid',
  'Documentation',
  'Registration',
  'Closed Won'
];

export default function DealsClient({ deals }: { deals: Deal[] }) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleStageChange = async (dealId: string, newStage: string) => {
    setLoadingId(dealId);
    setErrorMsg(null);
    setSuccessMsg(null);

    const res = await updateDealStage(dealId, newStage);
    if (res.success) {
      setSuccessMsg('Deal stage updated successfully.');
      router.refresh();
    } else {
      setErrorMsg(res.error || 'Failed to update deal stage.');
    }
    setLoadingId(null);
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'Interested':
        return 'text-cyan-400 bg-cyan-400/10 border-cyan-500/20';
      case 'Negotiation':
        return 'text-indigo-400 bg-indigo-400/10 border-indigo-500/20';
      case 'Token Paid':
        return 'text-amber-400 bg-amber-400/10 border-amber-500/20';
      case 'Documentation':
      case 'Registration':
        return 'text-purple-400 bg-purple-400/10 border-purple-500/20';
      case 'Closed Won':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'Closed Lost':
        return 'text-red-400 bg-red-400/10 border-red-500/20';
      default:
        return 'text-zinc-400 bg-zinc-800 border-zinc-700';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Deals Pipeline</h1>
        <p className="text-zinc-400 text-sm">
          Track transaction milestones. Note: milestone stages (Token Paid, Documentation, etc.) require platform representative verification.
        </p>
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div className="p-4 bg-red-955/30 border border-red-800/40 rounded-2xl flex items-start gap-3 text-red-300 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="p-4 bg-emerald-955/30 border border-emerald-800/40 rounded-2xl flex items-start gap-3 text-emerald-300 text-sm">
          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {deals.length > 0 ? (
        <div className="space-y-6">
          {deals.map((deal) => {
            const prop = deal.dealer_properties;
            const req = deal.requirements;
            const assignments = req?.requirement_employee_assignments || [];
            const hasCoordinator = !!assignments.find((a) => a.status === 'Active');

            const currentStageIndex = ORDERED_STAGES.indexOf(deal.current_stage);
            const isClosedLost = deal.current_stage === 'Closed Lost';
            
            // Stages dealers are allowed to transition to
            const canDealerModify = ['Interested', 'Negotiation'].includes(deal.current_stage) && !deal.is_suspended;

            return (
              <div 
                key={deal.deal_id}
                className={`bg-zinc-900/40 border border-zinc-850 p-6 sm:p-8 rounded-3xl backdrop-blur-xl transition duration-300 space-y-6 ${
                  deal.is_suspended ? 'opacity-60 border-amber-900/35' : ''
                }`}
              >
                {/* Upper Info Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-zinc-855/40">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Buyer Obfuscated ID</span>
                    <h3 className="font-extrabold text-base text-white">Customer {req?.requirement_code || 'REQ-UNKNOWN'}</h3>
                    <p className="text-xs text-zinc-400">
                      Listing: <span className="font-semibold text-zinc-200">{prop?.title}</span>
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    {deal.is_suspended && (
                      <span className="bg-amber-500/15 text-amber-400 border border-amber-500/20 px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 animate-pulse">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        Deal Suspended (Competing Token Paid)
                      </span>
                    )}
                    <span className={`px-3 py-1 rounded-xl text-xs font-bold border ${getStageColor(deal.current_stage)}`}>
                      {deal.current_stage}
                    </span>
                  </div>
                </div>

                {/* Pipeline visual stepper (skips if Closed Lost) */}
                {!isClosedLost ? (
                  <div className="relative pt-4 pb-2">
                    <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-zinc-800 -translate-y-1/2 z-0 hidden sm:block" />
                    <div className="grid grid-cols-2 sm:grid-cols-6 gap-4 relative z-10">
                      {ORDERED_STAGES.map((stage, idx) => {
                        const isCompleted = idx < currentStageIndex;
                        const isActive = idx === currentStageIndex;
                        
                        return (
                          <div key={stage} className="flex flex-col items-center text-center space-y-2">
                            <div 
                              className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold border transition duration-300 ${
                                isActive 
                                  ? 'bg-cyan-500 text-black border-cyan-500 shadow-lg shadow-cyan-500/20' 
                                  : isCompleted 
                                    ? 'bg-zinc-950 text-cyan-400 border-cyan-500/40' 
                                    : 'bg-zinc-950 text-zinc-650 border-zinc-850'
                              }`}
                            >
                              {isCompleted ? '✓' : idx + 1}
                            </div>
                            <span 
                              className={`text-[10px] font-bold uppercase tracking-wider block ${
                                isActive 
                                  ? 'text-cyan-400' 
                                  : isCompleted 
                                    ? 'text-zinc-300' 
                                    : 'text-zinc-500'
                              }`}
                            >
                              {stage.replace(' ', '\n')}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-red-950/20 border border-red-900/30 rounded-2xl flex items-center gap-3 text-red-300 text-xs">
                    <ShieldAlert className="w-5 h-5 text-red-400 shrink-0" />
                    <span>This deal was closed lost. competing requirements have been withdrawn or negotiations broke down.</span>
                  </div>
                )}

                {/* Controls and coordination details */}
                <div className="pt-4 border-t border-zinc-855/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                  
                  {/* Coordination Status */}
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-zinc-550 uppercase tracking-widest block">Coordination Status</span>
                    {hasCoordinator ? (
                      <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-400">
                        <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                        <span>Coordinator Assigned</span>
                      </div>
                    ) : (
                      <div className="text-zinc-500 text-xs italic">Pending Assignment</div>
                    )}
                  </div>

                  {/* Actions buttons */}
                  <div className="w-full sm:w-auto flex flex-wrap gap-2 items-center">
                    {canDealerModify ? (
                      <>
                        {deal.current_stage === 'Interested' && (
                          <button
                            onClick={() => handleStageChange(deal.deal_id, 'Negotiation')}
                            disabled={loadingId === deal.deal_id}
                            className="bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-[10px] uppercase py-2.5 px-4 rounded-xl transition cursor-pointer flex items-center gap-1"
                          >
                            <span>Move to Negotiation</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {deal.current_stage === 'Negotiation' && (
                          <button
                            onClick={() => handleStageChange(deal.deal_id, 'Interested')}
                            disabled={loadingId === deal.deal_id}
                            className="bg-zinc-950 border border-zinc-850 hover:bg-zinc-900 text-zinc-300 font-extrabold text-[10px] uppercase py-2.5 px-4 rounded-xl transition cursor-pointer"
                          >
                            Move to Interested
                          </button>
                        )}
                        <button
                          onClick={() => handleStageChange(deal.deal_id, 'Closed Lost')}
                          disabled={loadingId === deal.deal_id}
                          className="bg-red-955/15 hover:bg-red-955/25 border border-red-900/30 text-red-400 font-extrabold text-[10px] uppercase py-2.5 px-4 rounded-xl transition cursor-pointer"
                        >
                          Mark Lost
                        </button>
                      </>
                    ) : (
                      !isClosedLost && (
                        <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-550 bg-zinc-950/40 p-2.5 border border-zinc-850/60 rounded-xl">
                          <Lock className="w-4 h-4 text-zinc-500 shrink-0" />
                          <span>Validation Lock: Managed by Coordinator</span>
                        </div>
                      )
                    )}
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-zinc-900/10 border border-dashed border-zinc-850 rounded-3xl space-y-4">
          <Handshake className="w-12 h-12 text-zinc-650 mx-auto" />
          <h3 className="font-bold text-lg text-zinc-300">No active deals</h3>
          <p className="text-zinc-500 text-sm max-w-sm mx-auto">
            Once platform employees initiate negotiations between buyers and your listings, they will appear here.
          </p>
        </div>
      )}
    </div>
  );
}
