'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Handshake, Loader2, Sparkles, Building, User, DollarSign, Calendar, TrendingUp } from 'lucide-react';
import { updateEmployeeDealStage } from '@/app/actions/employee';

interface DealsPipelineClientProps {
  initialDeals: any[];
}

const STAGES = [
  'Interested',
  'Negotiation',
  'Token Paid',
  'Documentation',
  'Registration',
  'Closed Won',
  'Closed Lost'
] as const;

type DealStage = typeof STAGES[number];

export default function DealsPipelineClient({ initialDeals }: DealsPipelineClientProps) {
  const router = useRouter();
  const [updatingDealId, setUpdatingDealId] = useState<string | null>(null);

  const handleStageChange = async (dealId: string, targetStage: DealStage) => {
    setUpdatingDealId(dealId);
    try {
      const response = await updateEmployeeDealStage(dealId, targetStage);
      if (response.success) {
        router.refresh();
      } else {
        alert(response.error || 'Failed to update deal stage.');
      }
    } catch (err: any) {
      alert(err.message || 'Error updating stage.');
    } finally {
      setUpdatingDealId(null);
    }
  };

  // Group deals by stage
  const dealsByStage = STAGES.reduce((acc, stage) => {
    acc[stage] = initialDeals.filter(d => d.current_stage === stage);
    return acc;
  }, {} as Record<DealStage, any[]>);

  return (
    <div className="space-y-6">
      {/* Horizontal Pipeline Grid */}
      <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
        {STAGES.map((stage) => {
          const stageDeals = dealsByStage[stage] || [];
          let stageHeaderColor = 'text-zinc-400';
          let stageBg = 'bg-zinc-900/20';
          let borderHighlight = 'border-zinc-850';

          if (stage === 'Token Paid') {
            stageHeaderColor = 'text-indigo-400';
            borderHighlight = 'border-indigo-900/30';
          } else if (stage === 'Closed Won') {
            stageHeaderColor = 'text-emerald-400';
            borderHighlight = 'border-emerald-900/30';
          } else if (stage === 'Closed Lost') {
            stageHeaderColor = 'text-red-400';
            borderHighlight = 'border-red-900/30';
          }

          return (
            <div 
              key={stage}
              className={`w-80 shrink-0 ${stageBg} border ${borderHighlight} rounded-2xl p-4 flex flex-col space-y-4 min-h-[500px]`}
            >
              {/* Stage Header */}
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800/60">
                <span className={`font-bold text-xs uppercase tracking-wider ${stageHeaderColor}`}>
                  {stage}
                </span>
                <span className="px-2 py-0.5 bg-zinc-950 text-zinc-400 text-[10px] font-bold rounded-full border border-zinc-850">
                  {stageDeals.length}
                </span>
              </div>

              {/* Deals List */}
              <div className="flex-1 space-y-3 overflow-y-auto max-h-[420px]">
                {stageDeals.length > 0 ? (
                  stageDeals.map((deal) => {
                    const prop = deal.property;
                    const customer = deal.customer;
                    const isUpdating = updatingDealId === deal.deal_id;

                    return (
                      <div 
                        key={deal.deal_id}
                        className="p-4 bg-zinc-950/60 border border-zinc-900 rounded-xl space-y-3 hover:border-zinc-800 transition-all duration-300 relative overflow-hidden"
                      >
                        {isUpdating && (
                          <div className="absolute inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-10">
                            <Loader2 className="w-5 h-5 animate-spin text-violet-400" />
                          </div>
                        )}

                        <div className="space-y-1">
                          <h4 className="font-extrabold text-xs text-white line-clamp-1 flex items-center gap-1.5">
                            <Building className="w-3.5 h-3.5 text-zinc-400" />
                            {prop?.title || 'Property Bank Details'}
                          </h4>
                          <p className="text-[10px] text-zinc-500">
                            {prop?.area}, {prop?.city}
                          </p>
                        </div>

                        <div className="border-t border-zinc-900 pt-2 space-y-1">
                          <div className="flex items-center gap-1.5 text-xs text-zinc-300">
                            <User className="w-3.5 h-3.5 text-zinc-500" />
                            <span className="font-semibold truncate">{customer?.name}</span>
                          </div>
                          {prop && (
                            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold">
                              <DollarSign className="w-3.5 h-3.5" />
                              <span>₹{(prop.price / 100000).toFixed(1)} Lakhs</span>
                            </div>
                          )}
                        </div>

                        {/* Stage Selector */}
                        <div className="pt-2 border-t border-zinc-900 space-y-1">
                          <div className="flex items-center justify-between">
                            <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wide block">
                              Change Stage Status
                            </label>
                            {!deal.is_lead && (
                              <span className="text-[8px] bg-zinc-900 text-zinc-500 px-1.5 py-0.5 rounded font-bold uppercase">
                                Helper Read-Only
                              </span>
                            )}
                          </div>
                          <select
                            disabled={isUpdating || !deal.is_lead || deal.current_stage === 'Closed Won'}
                            value={deal.current_stage}
                            onChange={(e) => handleStageChange(deal.deal_id, e.target.value as DealStage)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1 text-[11px] text-white focus:outline-none focus:border-violet-500 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            {STAGES.map((s) => {
                              const isClosedWonOption = s === 'Closed Won' && deal.current_stage !== 'Closed Won';
                              return (
                                <option 
                                  key={s} 
                                  value={s} 
                                  disabled={isClosedWonOption}
                                >
                                  {s} {isClosedWonOption ? '(Admin Only)' : ''}
                                </option>
                              );
                            })}
                          </select>
                        </div>

                        <div className="text-[9px] text-zinc-650 text-zinc-550 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-zinc-600" />
                          <span>Started: {new Date(deal.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="h-full flex items-center justify-center p-8 text-center text-zinc-600 text-xs">
                    No deals in this stage.
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
