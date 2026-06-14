'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ClipboardList, CheckCircle2, AlertCircle, RefreshCw, XCircle, ArrowRight, Loader2, User } from 'lucide-react';
import { confirmModificationByCustomer, approveRequirementModification, rejectRequirementModification } from '@/app/actions/admin';

interface ModificationsClientProps {
  initialRequests: any[];
}

export default function ModificationsClient({ initialRequests }: ModificationsClientProps) {
  const router = useRouter();
  const [actioningId, setActioningId] = useState<string | null>(null);

  const handleConfirmCustomer = async (id: string) => {
    setActioningId(id);
    try {
      const response = await confirmModificationByCustomer(id);
      if (response.success) {
        router.refresh();
      } else {
        alert(response.error || 'Failed to confirm request.');
      }
    } catch (err: any) {
      alert(err.message || 'Error occurred.');
    } finally {
      setActioningId(null);
    }
  };

  const handleApprove = async (id: string) => {
    setActioningId(id);
    try {
      const response = await approveRequirementModification(id);
      if (response.success) {
        router.refresh();
      } else {
        alert(response.error || 'Failed to approve modifications.');
      }
    } catch (err: any) {
      alert(err.message || 'Error occurred.');
    } finally {
      setActioningId(null);
    }
  };

  const handleReject = async (id: string) => {
    if (!confirm('Reject this modification request?')) return;
    setActioningId(id);
    try {
      const response = await rejectRequirementModification(id);
      if (response.success) {
        router.refresh();
      } else {
        alert(response.error || 'Failed to reject modifications.');
      }
    } catch (err: any) {
      alert(err.message || 'Error occurred.');
    } finally {
      setActioningId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6">
        {initialRequests.length > 0 ? (
          initialRequests.map((req) => {
            const proposed = req.proposed_specs;
            const original = req.requirement;
            if (!original) return null;
            
            const isPending = req.status === 'Pending';
            const isConfirmed = req.status === 'Confirmed';
            const isApproved = req.status === 'Approved';
            const isRejected = req.status === 'Rejected';
            const isActioning = actioningId === req.request_id;

            return (
              <div 
                key={req.request_id}
                className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 space-y-4 hover:border-zinc-750 transition-all relative overflow-hidden"
              >
                {isActioning && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-xs z-10 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-850 pb-3">
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-sm text-white flex items-center gap-2">
                      <User className="w-4 h-4 text-zinc-500" />
                      Client: {original.customer?.name}
                    </h4>
                    <p className="text-[10px] text-zinc-400">
                      Proposed by Lead: {req.employees?.name}
                    </p>
                  </div>

                  <span className={`px-2.5 py-0.5 text-[9px] font-bold rounded uppercase tracking-wider self-start sm:self-auto ${
                    isPending ? 'bg-yellow-950 text-yellow-400 border border-yellow-900' :
                    isConfirmed ? 'bg-indigo-950 text-indigo-400 border border-indigo-900' :
                    isApproved ? 'bg-emerald-955 bg-emerald-950 text-emerald-400 border border-emerald-900' :
                    'bg-red-950/20 text-red-400 border border-red-900'
                  }`}>
                    {req.status}
                  </span>
                </div>

                {/* Specs comparison */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Original specs */}
                  <div className="space-y-2 bg-zinc-950/40 border border-zinc-850 p-4 rounded-xl">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide block">
                      Original Specifications
                    </span>
                    <div className="space-y-1 text-xs">
                      <p className="text-zinc-400">Type: <strong className="text-white font-semibold">{original.property_type}</strong></p>
                      <p className="text-zinc-400">Budget: <strong className="text-white font-semibold">₹{(original.budget_min / 100000).toFixed(1)}L - ₹{(original.budget_max / 100000).toFixed(1)}L</strong></p>
                      <p className="text-zinc-400">Location: <strong className="text-white font-semibold">{original.area}, {original.city}</strong></p>
                      <p className="text-zinc-400">Size: <strong className="text-white font-semibold">{original.area_min} - {original.area_max} sq. ft.</strong></p>
                    </div>
                  </div>

                  {/* Proposed specs */}
                  <div className="space-y-2 bg-violet-950/5 border border-violet-900/20 p-4 rounded-xl">
                    <span className="text-[10px] font-bold text-violet-400 uppercase tracking-wide block">
                      Proposed Specifications
                    </span>
                    <div className="space-y-1 text-xs">
                      <p className="text-zinc-400">Type: <strong className="text-violet-400 font-semibold">{proposed.property_type}</strong></p>
                      <p className="text-zinc-400">Budget: <strong className="text-violet-400 font-semibold">₹{(proposed.budget_min / 100000).toFixed(1)}L - ₹{(proposed.budget_max / 100000).toFixed(1)}L</strong></p>
                      <p className="text-zinc-400">Location: <strong className="text-violet-400 font-semibold">{proposed.area}, {proposed.city}</strong></p>
                      <p className="text-zinc-400">Size: <strong className="text-violet-400 font-semibold">{proposed.area_min} - {proposed.area_max} sq. ft.</strong></p>
                    </div>
                  </div>
                </div>

                {isPending && (
                  <div className="p-3 bg-yellow-950/20 border border-yellow-900/60 rounded-xl text-[10px] text-yellow-400 font-bold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-yellow-400 shrink-0" />
                    Pending Customer Confirmation: This recommendation must be confirmed by the client before Admin approval can proceed.
                  </div>
                )}

                {isConfirmed && (
                  <div className="p-3 bg-indigo-950/20 border border-indigo-900/60 rounded-xl text-[10px] text-indigo-400 font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                    Customer Confirmed: Credentials verified. Ready for Administrative approval.
                  </div>
                )}

                <div className="pt-4 border-t border-zinc-800/40 flex justify-end gap-2.5">
                  {isPending && (
                    <button
                      onClick={() => handleConfirmCustomer(req.request_id)}
                      className="px-4 py-1.5 bg-zinc-850 hover:bg-zinc-800 text-zinc-300 font-bold text-xs rounded-xl transition-all cursor-pointer"
                    >
                      Log Customer Confirmation (Mock)
                    </button>
                  )}
                  
                  {(isPending || isConfirmed) && (
                    <>
                      <button
                        onClick={() => handleReject(req.request_id)}
                        className="px-3.5 py-1.5 bg-zinc-850 hover:bg-zinc-800 text-zinc-400 hover:text-red-400 font-bold text-xs rounded-xl transition-all cursor-pointer"
                      >
                        Reject Request
                      </button>
                      <button
                        onClick={() => handleApprove(req.request_id)}
                        disabled={isPending}
                        className="px-4 py-1.5 bg-violet-600 hover:bg-violet-750 text-white font-bold text-xs rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                      >
                        Approve Modifications
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-12 text-center bg-zinc-900/20 border border-zinc-800 rounded-3xl text-zinc-500 text-sm">
            No pending requirement modifications found.
          </div>
        )}
      </div>
    </div>
  );
}
