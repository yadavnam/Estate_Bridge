'use client';

import React from 'react';
import { 
  Handshake, Sparkles, AlertTriangle, FileText, 
  CheckCircle2, AlertCircle, ShieldAlert, ArrowRight
} from 'lucide-react';

interface DealLostReason {
  reason: string;
  notes: string | null;
}

interface Deal {
  deal_id: string;
  customer_id: string;
  dealer_id: string;
  property_id: string;
  requirement_id: string;
  current_stage: string;
  is_suspended: boolean;
  created_at: string;
  dealer_properties: {
    title: string;
    property_type: string;
    price: number;
    city: string;
    area: string;
  };
  requirements: {
    requirement_code: string;
    property_type: string;
  };
  deal_lost_reasons: DealLostReason[] | DealLostReason | null;
}

const STAGES = ['Interested', 'Negotiation', 'Token Paid', 'Documentation', 'Registration', 'Closed Won'];

export default function DealsClient({ deals }: { deals: Deal[] }) {
  
  const getStageIndex = (stage: string) => STAGES.indexOf(stage);

  return (
    <div className="space-y-6">
      {deals.length > 0 ? (
        <div className="space-y-8">
          {deals.map((deal) => {
            const isLost = deal.current_stage === 'Closed Lost';
            const lostReason = Array.isArray(deal.deal_lost_reasons)
              ? deal.deal_lost_reasons[0]
              : deal.deal_lost_reasons;

            const activeIndex = getStageIndex(deal.current_stage);

            return (
              <div 
                key={deal.deal_id} 
                className={`bg-zinc-900/40 border rounded-3xl overflow-hidden backdrop-blur-xl transition ${
                  deal.is_suspended 
                    ? 'border-amber-900/40 opacity-70' 
                    : isLost 
                      ? 'border-zinc-850 opacity-60' 
                      : 'border-zinc-800/80 shadow-xl'
                }`}
              >
                
                {/* Header card info */}
                <div className="p-6 sm:p-8 bg-zinc-950/40 border-b border-zinc-850/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-zinc-500">REQ: {deal.requirements?.requirement_code}</span>
                      {deal.is_suspended && (
                        <span className="px-2 py-0.5 bg-amber-500/15 text-amber-400 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Suspended
                        </span>
                      )}
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        isLost 
                          ? 'bg-red-500/15 text-red-400' 
                          : deal.current_stage === 'Closed Won' 
                            ? 'bg-emerald-500/15 text-emerald-400' 
                            : 'bg-cyan-500/15 text-cyan-400'
                      }`}>
                        {deal.current_stage}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-white">
                      {deal.dealer_properties?.title}
                    </h3>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Estimated Price</span>
                    <span className="font-extrabold text-zinc-200 text-lg">
                      ₹{Number(deal.dealer_properties?.price).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Body details */}
                <div className="p-6 sm:p-8 space-y-6">
                  
                  {/* Suspended alert banner */}
                  {deal.is_suspended && (
                    <div className="p-4 bg-amber-950/40 border border-amber-800/60 rounded-2xl flex items-start gap-3 text-amber-300 text-xs leading-relaxed">
                      <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">Deal Temporarily Suspended.</span> A competing deal for requirement {deal.requirements?.requirement_code} has received a Token Payment. If that negotiation collapses, your deal will automatically reactivate.
                      </div>
                    </div>
                  )}

                  {/* Lost reason panel */}
                  {isLost && lostReason && (
                    <div className="p-4 bg-zinc-950/50 border border-zinc-850 rounded-2xl space-y-2 text-xs">
                      <div className="flex items-center gap-2 text-red-400 font-bold">
                        <AlertCircle className="w-4 h-4" />
                        Deal Closed Lost: {lostReason.reason}
                      </div>
                      {lostReason.notes && (
                        <p className="text-zinc-400 italic">
                          &ldquo;{lostReason.notes}&rdquo;
                        </p>
                      )}
                    </div>
                  )}

                  {/* Stage Timeline (only if not Lost) */}
                  {!isLost ? (
                    <div className="space-y-4">
                      <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">Deal Progress Timeline</span>
                      
                      {/* Desktop layout */}
                      <div className="hidden sm:grid grid-cols-6 gap-2 pt-2 relative">
                        {/* Connecting Line */}
                        <div className="absolute top-6 left-6 right-6 h-0.5 bg-zinc-800 -z-10" />
                        
                        {STAGES.map((stage, idx) => {
                          const isCompleted = idx < activeIndex;
                          const isActive = idx === activeIndex;
                          const isPending = idx > activeIndex;

                          return (
                            <div key={stage} className="flex flex-col items-center text-center space-y-2">
                              {/* Step circle */}
                              <div className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all duration-300 ${
                                isCompleted 
                                  ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400' 
                                  : isActive 
                                    ? 'bg-gradient-to-tr from-cyan-500 to-indigo-500 border-indigo-400 text-black font-extrabold scale-110 shadow-lg shadow-indigo-500/25' 
                                    : 'bg-zinc-950 border-zinc-800 text-zinc-550'
                              }`}>
                                {isCompleted ? (
                                  <CheckCircle2 className="w-4 h-4" />
                                ) : (
                                  <span className="text-xs">{idx + 1}</span>
                                )}
                              </div>
                              <span className={`text-[10px] font-bold tracking-tight ${
                                isActive ? 'text-cyan-400' : isCompleted ? 'text-zinc-300' : 'text-zinc-555 text-zinc-500'
                              }`}>
                                {stage}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Mobile layout */}
                      <div className="sm:hidden space-y-3 pl-2 border-l-2 border-zinc-800">
                        {STAGES.map((stage, idx) => {
                          const isCompleted = idx < activeIndex;
                          const isActive = idx === activeIndex;
                          
                          return (
                            <div key={stage} className="flex items-center gap-3">
                              <div className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 ${
                                isCompleted 
                                  ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400' 
                                  : isActive 
                                    ? 'bg-gradient-to-tr from-cyan-500 to-indigo-500 border-indigo-400 text-black font-bold' 
                                    : 'bg-zinc-950 border-zinc-800 text-zinc-600'
                              }`}>
                                {isCompleted ? (
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                ) : (
                                  <span className="text-[10px]">{idx + 1}</span>
                                )}
                              </div>
                              <span className={`text-xs font-semibold ${
                                isActive ? 'text-cyan-400 font-bold' : isCompleted ? 'text-zinc-300' : 'text-zinc-500'
                              }`}>
                                {stage}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                    </div>
                  ) : (
                    <div className="py-2 text-center text-xs text-zinc-500 italic">
                      This negotiation has closed and is no longer moving forward.
                    </div>
                  )}

                  {/* Obfuscation Warning Footer */}
                  <div className="pt-4 border-t border-zinc-850/60 flex items-center gap-2 text-[10px] text-zinc-500 font-medium">
                    <FileText className="w-3.5 h-3.5" />
                    <span>Matched Property Location: {deal.dealer_properties?.area}, {deal.dealer_properties?.city}. Broker credentials masked.</span>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-zinc-900/20 border border-dashed border-zinc-850 rounded-3xl space-y-4">
          <Handshake className="w-12 h-12 text-zinc-600 mx-auto" />
          <h3 className="font-bold text-lg text-zinc-300">No active deals</h3>
          <p className="text-zinc-500 text-sm max-w-sm mx-auto">
            Deals are initiated by platform brokers once they negotiate token terms or document registrations for matches.
          </p>
        </div>
      )}
    </div>
  );
}
