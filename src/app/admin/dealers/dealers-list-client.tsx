'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserCheck, ShieldAlert, Sparkles, Building, User, Phone, Mail, Award, XOctagon, Loader2 } from 'lucide-react';
import { approveDealer, rejectDealer, blockDealer, overrideDealerTrustScore } from '@/app/actions/admin';

interface DealersListClientProps {
  initialDealers: any[];
}

type TabType = 'Pending' | 'Approved' | 'Blocked/Rejected';

export default function DealersListClient({ initialDealers }: DealersListClientProps) {
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<TabType>('Pending');
  const [actioningId, setActioningId] = useState<string | null>(null);

  // Trust Score Override States
  const [selectedDealerOverride, setSelectedDealerOverride] = useState<any | null>(null);
  const [newTrustScore, setNewTrustScore] = useState<number>(80);
  const [overrideReason, setOverrideReason] = useState('');
  const [submittingOverride, setSubmittingOverride] = useState(false);

  // Filter list
  const filteredDealers = initialDealers.filter((d) => {
    if (activeTab === 'Pending') return d.status === 'Pending';
    if (activeTab === 'Approved') return d.status === 'Approved';
    return d.status === 'Blocked' || d.status === 'Rejected';
  });

  const handleApprove = async (id: string) => {
    setActioningId(id);
    try {
      const response = await approveDealer(id);
      if (response.success) {
        router.refresh();
      } else {
        alert(response.error || 'Failed to approve dealer.');
      }
    } catch (err: any) {
      alert(err.message || 'Error occurred.');
    } finally {
      setActioningId(null);
    }
  };

  const handleReject = async (id: string) => {
    if (!confirm('Reject this partner registration?')) return;
    setActioningId(id);
    try {
      const response = await rejectDealer(id);
      if (response.success) {
        router.refresh();
      } else {
        alert(response.error || 'Failed to reject dealer.');
      }
    } catch (err: any) {
      alert(err.message || 'Error occurred.');
    } finally {
      setActioningId(null);
    }
  };

  const handleBlock = async (id: string) => {
    if (!confirm('Block this dealer? This will instantly evict their active portal sessions and deny any database access.')) return;
    setActioningId(id);
    try {
      const response = await blockDealer(id);
      if (response.success) {
        router.refresh();
      } else {
        alert(response.error || 'Failed to block dealer.');
      }
    } catch (err: any) {
      alert(err.message || 'Error occurred.');
    } finally {
      setActioningId(null);
    }
  };

  const handleOpenOverride = (dealer: any) => {
    setSelectedDealerOverride(dealer);
    setNewTrustScore(Number(dealer.trust_score) || 80);
    setOverrideReason('');
  };

  const handleSubmitOverride = async () => {
    if (!overrideReason.trim()) {
      alert('Please enter override reason.');
      return;
    }
    setSubmittingOverride(true);
    try {
      const response = await overrideDealerTrustScore(
        selectedDealerOverride.dealer_id,
        newTrustScore,
        overrideReason
      );

      if (response.success) {
        setSelectedDealerOverride(null);
        router.refresh();
      } else {
        alert(response.error || 'Failed to update trust score.');
      }
    } catch (err: any) {
      alert(err.message || 'Error occurred.');
    } finally {
      setSubmittingOverride(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-zinc-800 pb-4">
        {(['Pending', 'Approved', 'Blocked/Rejected'] as TabType[]).map((tab) => {
          const count = tab === 'Pending'
            ? initialDealers.filter(d => d.status === 'Pending').length
            : tab === 'Approved'
            ? initialDealers.filter(d => d.status === 'Approved').length
            : initialDealers.filter(d => d.status === 'Blocked' || d.status === 'Rejected').length;
          const isActive = activeTab === tab;

          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all duration-300 flex items-center gap-2 border border-transparent hover:bg-zinc-850 cursor-pointer ${
                isActive ? 'bg-violet-650 bg-violet-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span>{tab} Listings</span>
              <span className="px-1.5 py-0.5 bg-zinc-950/60 rounded-full text-[9px] font-bold">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Grid listing */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredDealers.length > 0 ? (
          filteredDealers.map((d) => {
            const isPending = d.status === 'Pending';
            const isApproved = d.status === 'Approved';
            const isBlocked = d.status === 'Blocked';
            const isActioning = actioningId === d.dealer_id;

            return (
              <div 
                key={d.dealer_id}
                className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 space-y-4 hover:border-zinc-750 transition-all flex flex-col justify-between relative overflow-hidden"
              >
                {isActioning && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-xs z-10 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
                  </div>
                )}
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <span className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase tracking-wider ${
                      isPending ? 'bg-yellow-950 text-yellow-400 border border-yellow-900' :
                      isApproved ? 'bg-emerald-955 bg-emerald-950 text-emerald-400 border border-emerald-900' :
                      'bg-red-950/20 text-red-400 border border-red-900'
                    }`}>
                      {d.status}
                    </span>
                    
                    <span className="text-[10px] text-zinc-500 font-medium">
                      ID: {d.rera_registration_number || 'No RERA ID'}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                      <Building className="w-4 h-4 text-zinc-400" />
                      {d.company_name}
                    </h3>
                    <p className="text-xs text-zinc-400 flex items-center gap-1.5 pl-6">
                      <User className="w-3.5 h-3.5 text-zinc-500" />
                      Owner: {d.owner_name}
                    </p>
                  </div>

                  <div className="border-t border-zinc-800/60 pt-3 space-y-1.5 pl-6 text-xs text-zinc-400">
                    <p className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-zinc-500" />
                      {d.mobile_number || 'No Phone'}
                    </p>
                    <p className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-zinc-500" />
                      {d.email || 'No Email'}
                    </p>
                  </div>

                  {isApproved && (
                    <div className="pt-3 border-t border-zinc-800/60 flex items-center justify-between">
                      <span className="text-xs text-zinc-500 font-medium flex items-center gap-1">
                        <Award className="w-4 h-4 text-violet-400" />
                        Platform Trust Score:
                      </span>
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                        {d.trust_score}%
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-zinc-800/40 flex justify-end gap-2.5">
                  {isPending && (
                    <>
                      <button
                        onClick={() => handleReject(d.dealer_id)}
                        className="px-3.5 py-1.5 bg-zinc-850 hover:bg-zinc-800 text-zinc-400 hover:text-red-400 font-bold text-xs rounded-xl transition-all cursor-pointer"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleApprove(d.dealer_id)}
                        className="px-4 py-1.5 bg-violet-650 bg-violet-650 bg-violet-600 hover:bg-violet-750 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
                      >
                        Approve RERA
                      </button>
                    </>
                  )}

                  {isApproved && (
                    <>
                      <button
                        onClick={() => handleOpenOverride(d)}
                        className="px-3.5 py-1.5 bg-zinc-850 hover:bg-zinc-800 text-zinc-300 font-bold text-xs rounded-xl transition-all cursor-pointer"
                      >
                        Override Trust Score
                      </button>
                      <button
                        onClick={() => handleBlock(d.dealer_id)}
                        className="px-4 py-1.5 bg-red-950/20 hover:bg-red-900/40 border border-red-900/60 text-red-400 font-bold text-xs rounded-xl transition-all cursor-pointer"
                      >
                        Block Dealer
                      </button>
                    </>
                  )}

                  {(d.status === 'Blocked' || d.status === 'Rejected') && (
                    <button
                      onClick={() => handleApprove(d.dealer_id)}
                      className="px-4 py-1.5 bg-zinc-850 hover:bg-violet-600 text-zinc-350 hover:text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
                    >
                      Re-Approve Account
                    </button>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="md:col-span-2 p-12 text-center bg-zinc-900/20 border border-zinc-800 rounded-3xl text-zinc-500 text-sm">
            No partner accounts match this queue filter.
          </div>
        )}
      </div>

      {/* Manual Trust Score Override Modal (Issue AP-3) */}
      {selectedDealerOverride && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 max-w-md w-full rounded-2xl p-6 space-y-4 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="space-y-1">
              <h4 className="font-extrabold text-base text-white">
                Override Trust Score
              </h4>
              <p className="text-xs text-zinc-400">
                Manually adjust the platform trust rating for <strong className="text-zinc-200">{selectedDealerOverride.company_name}</strong>.
              </p>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Target Trust Score (0-100%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={newTrustScore}
                  onChange={(e) => setNewTrustScore(Number(e.target.value))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Override Reason</label>
                <textarea
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  rows={4}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500 resize-none"
                  placeholder="Explain why this trust score is being manually adjusted..."
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setSelectedDealerOverride(null)}
                disabled={submittingOverride}
                className="px-4 py-2 bg-zinc-850 hover:bg-zinc-800 text-zinc-300 font-bold text-xs rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitOverride}
                disabled={submittingOverride || !overrideReason.trim()}
                className="flex items-center gap-1.5 px-5 py-2 bg-violet-600 hover:bg-violet-750 text-white font-bold text-xs rounded-xl disabled:opacity-50 transition-all duration-300 cursor-pointer"
              >
                {submittingOverride && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Log Override
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
