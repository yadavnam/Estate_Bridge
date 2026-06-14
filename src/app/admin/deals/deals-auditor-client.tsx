'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Handshake, Loader2, Sparkles, Building, User, DollarSign, Calendar, Upload, FileText } from 'lucide-react';
import { verifyDealMilestone } from '@/app/actions/admin';

interface DealsAuditorClientProps {
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

export default function DealsAuditorClient({ initialDeals }: DealsAuditorClientProps) {
  const router = useRouter();

  // Verification Modal State
  const [selectedDeal, setSelectedDeal] = useState<any | null>(null);
  const [targetStage, setTargetStage] = useState<DealStage>('Token Paid');
  const [proofUrl, setProofUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [submittingVerification, setSubmittingVerification] = useState(false);

  const handleOpenVerifyModal = (deal: any) => {
    setSelectedDeal(deal);
    setTargetStage('Token Paid');
    setProofUrl('');
    setNotes('');
  };

  const handleVerifyTransition = async () => {
    const needsProof = ['Token Paid', 'Registration', 'Closed Won'].includes(targetStage);
    if (needsProof && !proofUrl.trim()) {
      alert(`Proof document URL is mandatory for ${targetStage} transition.`);
      return;
    }
    if (!notes.trim()) {
      alert('Verification notes are mandatory.');
      return;
    }

    setSubmittingVerification(true);
    try {
      const response = await verifyDealMilestone(
        selectedDeal.deal_id,
        targetStage,
        proofUrl,
        notes
      );

      if (response.success) {
        setSelectedDeal(null);
        router.refresh();
      } else {
        alert(response.error || 'Failed to verify milestone.');
      }
    } catch (err: any) {
      alert(err.message || 'Error occurred.');
    } finally {
      setSubmittingVerification(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="overflow-x-auto bg-zinc-900/20 border border-zinc-800 rounded-2xl">
        <table className="w-full text-left border-collapse text-xs text-zinc-400">
          <thead>
            <tr className="border-b border-zinc-800 text-zinc-550 font-bold uppercase tracking-wider text-[10px] bg-zinc-950/40">
              <th className="p-4">Customer</th>
              <th className="p-4">Listing Details</th>
              <th className="p-4">Dealer Network</th>
              <th className="p-4 text-center">Stage Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-850">
            {initialDeals.length > 0 ? (
              initialDeals.map((deal) => {
                const isWon = deal.current_stage === 'Closed Won';
                const isLost = deal.current_stage === 'Closed Lost';
                let stageBadge = 'bg-zinc-950 text-zinc-400 border border-zinc-850';
                
                if (isWon) stageBadge = 'bg-emerald-950 text-emerald-400 border border-emerald-900';
                else if (isLost) stageBadge = 'bg-red-950/20 text-red-400 border border-red-900';
                else if (deal.current_stage === 'Token Paid') stageBadge = 'bg-indigo-950 text-indigo-400 border border-indigo-900';

                return (
                  <tr key={deal.deal_id} className="hover:bg-zinc-900/10 transition-colors">
                    <td className="p-4 space-y-0.5">
                      <div className="font-extrabold text-white text-xs">{deal.customer?.name}</div>
                      <div className="text-[10px] text-zinc-500">{deal.customer?.email}</div>
                    </td>
                    
                    <td className="p-4 space-y-0.5">
                      <div className="font-bold text-white truncate max-w-[200px]">{deal.property?.title}</div>
                      <div className="text-[10px] text-emerald-400 font-semibold">
                        ₹{(deal.property?.price / 100000).toFixed(1)} Lakhs
                      </div>
                    </td>

                    <td className="p-4 space-y-0.5">
                      <div className="font-semibold text-zinc-300">{deal.dealer?.company_name}</div>
                      <div className="text-[10px] text-zinc-500">{deal.dealer?.owner_name}</div>
                    </td>

                    <td className="p-4 text-center">
                      <span className={`inline-block px-2.5 py-0.5 text-[8px] font-bold rounded uppercase ${stageBadge}`}>
                        {deal.current_stage}
                      </span>
                    </td>

                    <td className="p-4 text-right">
                      {isWon ? (
                        <span className="text-[10px] text-zinc-500 font-bold uppercase italic p-1.5 bg-zinc-950 rounded border border-zinc-850">
                          Immutable Blocked
                        </span>
                      ) : (
                        <button
                          onClick={() => handleOpenVerifyModal(deal)}
                          className="px-3 py-1.5 bg-zinc-850 hover:bg-violet-600 text-white font-bold text-[10px] rounded-xl transition-all cursor-pointer"
                        >
                          Verify Transition
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5} className="p-8 text-center text-zinc-650">
                  No deal negotiations logged.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Verification Modal (Issue AP-4) */}
      {selectedDeal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 max-w-md w-full rounded-2xl p-6 space-y-4 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="space-y-1">
              <h4 className="font-extrabold text-base text-white">
                Verify Deal Transition
              </h4>
              <p className="text-xs text-zinc-400">
                Audit and transition deal lifecycle for client <strong className="text-zinc-200">{selectedDeal.customer?.name}</strong>.
              </p>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Target Stage</label>
                <select
                  value={targetStage}
                  onChange={(e) => setTargetStage(e.target.value as DealStage)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                >
                  {STAGES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* Document Proof input (Mandatory for Token Paid, Registration, and Closed Won) */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide flex items-center gap-1">
                  Document Verification Proof URL
                  {['Token Paid', 'Registration', 'Closed Won'].includes(targetStage) && (
                    <span className="text-red-400 text-[9px] font-bold uppercase">(Mandatory)</span>
                  )}
                </label>
                <input
                  type="text"
                  value={proofUrl}
                  onChange={(e) => setProofUrl(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                  placeholder="e.g. https://storage.estatebridge.com/receipts/proof.pdf"
                  required={['Token Paid', 'Registration', 'Closed Won'].includes(targetStage)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">
                  Verification Notes / Logs
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500 resize-none"
                  placeholder="Describe verification checks, payment details, sub-registrar details..."
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setSelectedDeal(null)}
                disabled={submittingVerification}
                className="px-4 py-2 bg-zinc-850 hover:bg-zinc-800 text-zinc-300 font-bold text-xs rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleVerifyTransition}
                disabled={submittingVerification || !notes.trim()}
                className="flex items-center gap-1.5 px-5 py-2 bg-violet-600 hover:bg-violet-750 text-white font-bold text-xs rounded-xl disabled:opacity-50 transition-all duration-300 cursor-pointer"
              >
                {submittingVerification && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Approve transition
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
