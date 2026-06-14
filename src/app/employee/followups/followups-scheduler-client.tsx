'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, User, Phone, CheckCircle2, AlertTriangle, Loader2, Info } from 'lucide-react';
import { resolveFollowUp } from '@/app/actions/employee';

interface FollowupsSchedulerClientProps {
  initialFollowups: any[];
}

type FilterStatus = 'All' | 'Pending' | 'Completed' | 'Missed';

export default function FollowupsSchedulerClient({ initialFollowups }: FollowupsSchedulerClientProps) {
  const router = useRouter();
  
  const [filter, setFilter] = useState<FilterStatus>('All');
  const [resolvingFollowup, setResolvingFollowup] = useState<any | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [submittingResolution, setSubmittingResolution] = useState(false);

  // Filter follow-ups
  const filteredFollowups = initialFollowups.filter((f) => {
    if (filter === 'All') return true;
    return f.status === filter;
  });

  const handleOpenResolveModal = (followup: any) => {
    setResolvingFollowup(followup);
    setResolutionNotes('');
  };

  const handleResolve = async () => {
    if (!resolutionNotes.trim()) {
      alert('Please enter resolution outcome details.');
      return;
    }
    setSubmittingResolution(true);
    try {
      const response = await resolveFollowUp(
        resolvingFollowup.followup_id,
        resolutionNotes
      );

      if (response.success) {
        setResolvingFollowup(null);
        router.refresh();
      } else {
        alert(response.error || 'Failed to resolve follow-up.');
      }
    } catch (err: any) {
      alert(err.message || 'Error occurred.');
    } finally {
      setSubmittingResolution(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters menu */}
      <div className="flex flex-wrap gap-2 border-b border-zinc-800 pb-4">
        {(['All', 'Pending', 'Completed', 'Missed'] as FilterStatus[]).map((tab) => {
          const count = tab === 'All' 
            ? initialFollowups.length 
            : initialFollowups.filter(f => f.status === tab).length;
          const isActive = filter === tab;

          let activeStyle = 'bg-zinc-800 text-white';
          if (isActive) {
            if (tab === 'Missed') activeStyle = 'bg-red-950 text-red-400 border border-red-900';
            else if (tab === 'Completed') activeStyle = 'bg-emerald-950 text-emerald-400 border border-emerald-900';
            else activeStyle = 'bg-violet-600 text-white';
          }

          return (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all duration-300 flex items-center gap-2 border border-transparent hover:bg-zinc-850 cursor-pointer ${
                isActive ? activeStyle : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span>{tab}</span>
              <span className="px-1.5 py-0.5 bg-zinc-950/60 rounded-full text-[9px] font-bold">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Checklist Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredFollowups.length > 0 ? (
          filteredFollowups.map((f) => {
            const isMissed = f.status === 'Missed';
            const isCompleted = f.status === 'Completed';

            let cardBorder = isMissed ? 'border-red-950 hover:border-red-900' : 'border-zinc-800 hover:border-zinc-700/80';
            let cardBg = isMissed ? 'bg-red-950/5' : 'bg-zinc-900/40';

            return (
              <div 
                key={f.followup_id}
                className={`${cardBg} border ${cardBorder} rounded-2xl p-6 space-y-4 transition-all duration-300 flex flex-col justify-between`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <span className={`px-2.5 py-0.5 text-[9px] font-bold rounded uppercase tracking-wider ${
                      isMissed 
                        ? 'bg-red-950 text-red-500 font-bold border border-red-900' 
                        : isCompleted 
                        ? 'bg-emerald-955 bg-emerald-950 text-emerald-400 border border-emerald-900' 
                        : 'bg-violet-955 bg-violet-950 text-violet-400 border border-violet-900'
                    }`}>
                      {f.status}
                    </span>
                    <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                      <Calendar className={`w-3.5 h-3.5 ${isMissed ? 'text-red-500 animate-pulse' : 'text-zinc-500'}`} />
                      <span className={isMissed ? 'text-red-500 font-bold' : ''}>
                        {new Date(f.next_followup_date).toLocaleDateString()} @ {new Date(f.next_followup_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <h4 className={`font-extrabold text-sm flex items-center gap-2 ${isMissed ? 'text-red-500 font-black' : 'text-white'}`}>
                      <User className="w-4 h-4 text-zinc-500" />
                      {f.customer?.name}
                    </h4>
                    <p className="text-[10px] text-zinc-400 pl-6">
                      Phone: {f.customer?.phone} | Email: {f.customer?.email}
                    </p>
                  </div>

                  <div className="border-t border-zinc-800/60 pt-3 space-y-1">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">
                      Follow-up Task details:
                    </span>
                    <p className={`text-xs ${isMissed ? 'text-red-400 font-bold' : 'text-zinc-350'} leading-relaxed`}>
                      {f.notes || 'No notes logged.'}
                    </p>
                  </div>

                  {isMissed && (
                    <div className="p-3 bg-red-950/20 border border-red-900/60 rounded-xl text-[10px] text-red-400 font-bold flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                      Critical: This callback is overdue by more than 12 hours. Please contact customer immediately.
                    </div>
                  )}
                </div>

                {!isCompleted && (
                  <div className="pt-4 border-t border-zinc-800/40 flex justify-end gap-2">
                    <a
                      href={`/employee/requirements/${f.requirement?.requirement_id}`}
                      className="px-3 py-1.5 bg-zinc-850 hover:bg-zinc-800 text-zinc-300 font-bold text-xs rounded-xl transition-all"
                    >
                      Workspace
                    </a>
                    <button
                      onClick={() => handleOpenResolveModal(f)}
                      className={`px-4 py-1.5 font-bold text-xs rounded-xl transition-all duration-300 cursor-pointer ${
                        isMissed 
                          ? 'bg-red-600 hover:bg-red-750 text-white' 
                          : 'bg-violet-600 hover:bg-violet-750 text-white'
                      }`}
                    >
                      Complete Callback
                    </button>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="md:col-span-2 p-12 text-center bg-zinc-900/20 border border-zinc-800 rounded-3xl text-zinc-500 text-sm">
            No follow-ups matches the selected status filter.
          </div>
        )}
      </div>

      {/* Resolve Dialog Modal */}
      {resolvingFollowup && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 max-w-md w-full rounded-2xl p-6 space-y-4 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="space-y-1">
              <h4 className="font-extrabold text-base text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                Resolve Follow-up Callback
              </h4>
              <p className="text-xs text-zinc-400">
                Log the conversation results to complete this callback reminder.
              </p>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Resolution Outcome Details</label>
                <textarea
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  rows={4}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500 resize-none"
                  placeholder="e.g. Spoke with customer. They confirmed receipt of matching property details and scheduled a visit..."
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setResolvingFollowup(null)}
                disabled={submittingResolution}
                className="px-4 py-2 bg-zinc-850 hover:bg-zinc-800 text-zinc-300 font-bold text-xs rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleResolve}
                disabled={submittingResolution || !resolutionNotes.trim()}
                className="flex items-center gap-1.5 px-5 py-2 bg-violet-600 hover:bg-violet-750 text-white font-bold text-xs rounded-xl disabled:opacity-50 transition-all duration-300 cursor-pointer"
              >
                {submittingResolution && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Mark Completed
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
