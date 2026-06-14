'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, User, Building, MapPin, CheckCircle, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { updateVisitOutcome } from '@/app/actions/employee';

interface VisitsCoordinatorClientProps {
  initialVisits: any[];
}

export default function VisitsCoordinatorClient({ initialVisits }: VisitsCoordinatorClientProps) {
  const router = useRouter();
  
  const [selectedVisit, setSelectedVisit] = useState<any | null>(null);
  const [outcomeStatus, setOutcomeStatus] = useState('Completed');
  const [outcomeNotes, setOutcomeNotes] = useState('');
  const [submittingOutcome, setSubmittingOutcome] = useState(false);

  const handleOpenOutcomeModal = (visit: any) => {
    setSelectedVisit(visit);
    setOutcomeStatus('Completed');
    setOutcomeNotes('');
  };

  const handleSubmitOutcome = async () => {
    if (!outcomeNotes.trim()) {
      alert('Please enter outcome description.');
      return;
    }
    setSubmittingOutcome(true);
    try {
      const response = await updateVisitOutcome(
        selectedVisit.visit_id,
        outcomeStatus,
        outcomeNotes
      );

      if (response.success) {
        setSelectedVisit(null);
        router.refresh();
      } else {
        alert(response.error || 'Failed to update visit outcome.');
      }
    } catch (err: any) {
      alert(err.message || 'Error occurred.');
    } finally {
      setSubmittingOutcome(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {initialVisits.length > 0 ? (
          initialVisits.map((visit) => {
            const isScheduled = visit.status === 'Scheduled';
            const isCompleted = visit.status === 'Completed';
            const isCancelled = visit.status === 'Cancelled';

            let statusColor = 'bg-zinc-800 text-zinc-300';
            if (isScheduled) statusColor = 'bg-cyan-950 text-cyan-400 border border-cyan-900/60';
            else if (isCompleted) statusColor = 'bg-emerald-950 text-emerald-400 border border-emerald-900/60';
            else if (isCancelled) statusColor = 'bg-red-950/20 text-red-400 border border-red-900/60';

            return (
              <div 
                key={visit.visit_id}
                className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 space-y-4 hover:border-zinc-700/80 transition-all duration-300 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <span className={`px-2.5 py-0.5 text-[9px] font-bold rounded uppercase tracking-wider ${statusColor}`}>
                      {visit.status}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-zinc-400">
                      <Calendar className="w-3.5 h-3.5 text-violet-400" />
                      <span>{visit.visit_date} @ {visit.visit_time.substring(0, 5)}</span>
                    </div>
                  </div>

                  <div className="border-t border-zinc-800/60 pt-3 space-y-2">
                    <h4 className="font-extrabold text-sm text-white flex items-center gap-2">
                      <Building className="w-4 h-4 text-zinc-500" />
                      {visit.property?.title || 'Property Bank Listing'}
                    </h4>
                    <p className="text-xs text-zinc-400 flex items-center gap-1.5 pl-6">
                      <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                      {visit.property?.area}, {visit.property?.city}
                    </p>
                  </div>

                  <div className="bg-zinc-950/40 border border-zinc-850/60 p-3 rounded-xl space-y-1">
                    <div className="flex items-center gap-2 text-xs font-semibold text-white">
                      <User className="w-3.5 h-3.5 text-zinc-500" />
                      {visit.customer?.name}
                    </div>
                    <p className="text-[10px] text-zinc-400 pl-5">
                      Phone: {visit.customer?.phone} | Email: {visit.customer?.email}
                    </p>
                  </div>
                </div>

                {isScheduled && (
                  <div className="pt-4 border-t border-zinc-800/40 flex justify-end">
                    <button
                      onClick={() => handleOpenOutcomeModal(visit)}
                      className="px-4 py-2 bg-violet-600 hover:bg-violet-750 text-white font-bold text-xs rounded-xl transition-all duration-300 cursor-pointer"
                    >
                      Log Visit Outcome
                    </button>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="md:col-span-2 p-12 text-center bg-zinc-900/20 border border-zinc-800 rounded-3xl text-zinc-500 text-sm">
            No coordinated property inspections or walkthroughs scheduled.
          </div>
        )}
      </div>

      {/* Outcome Dialog Modal */}
      {selectedVisit && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 max-w-md w-full rounded-2xl p-6 space-y-4 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="space-y-1">
              <h4 className="font-extrabold text-base text-white">
                Log Visit Outcome
              </h4>
              <p className="text-xs text-zinc-400">
                Log the results of the client site inspection at <strong className="text-zinc-200">{selectedVisit.property?.title}</strong>.
              </p>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Visit Outcome Status</label>
                <select
                  value={outcomeStatus}
                  onChange={(e) => setOutcomeStatus(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                >
                  <option value="Completed">Completed Successfully</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="Rescheduled">Rescheduled</option>
                  <option value="Client No Show">Client No Show</option>
                  <option value="Property Unavailable">Property Unavailable / Locked</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Outcome Notes</label>
                <textarea
                  value={outcomeNotes}
                  onChange={(e) => setOutcomeNotes(e.target.value)}
                  rows={4}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500 resize-none"
                  placeholder="e.g. Client liked the layout but requested a lower floor model. Will negotiate pricing..."
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setSelectedVisit(null)}
                disabled={submittingOutcome}
                className="px-4 py-2 bg-zinc-850 hover:bg-zinc-800 text-zinc-300 font-bold text-xs rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitOutcome}
                disabled={submittingOutcome || !outcomeNotes.trim()}
                className="flex items-center gap-1.5 px-5 py-2 bg-violet-600 hover:bg-violet-750 text-white font-bold text-xs rounded-xl disabled:opacity-50 transition-all duration-300 cursor-pointer"
              >
                {submittingOutcome && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Log Outcome
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
