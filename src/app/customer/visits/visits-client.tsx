'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { submitVisitFeedback, cancelVisit } from '@/app/actions/customer';
import { 
  Calendar, Clock, Star, MessageSquare, 
  MapPin, Sparkles, AlertCircle, Building2, CheckCircle2, X, ArrowRight
} from 'lucide-react';

interface Feedback {
  feedback_id: string;
  site_rating: number;
  visit_rating: number;
  comments: string | null;
}

interface Visit {
  visit_id: string;
  visit_date: string;
  visit_time: string;
  status: string;
  requirement_id: string | null;
  site_id: string | null;
  property_id: string | null;
  registered_sites: {
    site_name: string;
    builder_name: string;
    city: string;
    area: string;
  } | null;
  dealer_properties: {
    title: string;
    property_type: string;
    city: string;
    area: string;
  } | null;
  feedbacks: Feedback[] | null;
}

export default function VisitsClient({ initialVisits }: { initialVisits: Visit[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null); // tracks active submit visit_id
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Feedback Form State
  const [selectedVisitId, setSelectedVisitId] = useState<string | null>(null);
  const [siteRating, setSiteRating] = useState(5);
  const [visitRating, setVisitRating] = useState(5);
  const [comments, setComments] = useState('');

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVisitId) return;

    setLoading(selectedVisitId);
    setErrorMsg(null);
    setSuccessMsg(null);

    const res = await submitVisitFeedback({
      visitId: selectedVisitId,
      siteRating,
      visitRating,
      comments,
    });

    if (res.success) {
      setSuccessMsg('Thank you! Feedback submitted successfully.');
      setSelectedVisitId(null);
      setComments('');
      setSiteRating(5);
      setVisitRating(5);
      router.refresh();
    } else {
      setErrorMsg(res.error || 'Failed to submit feedback.');
    }
    setLoading(null);
  };

  const handleCancel = async (visitId: string) => {
    if (!confirm('Are you sure you want to cancel this visit request?')) {
      return;
    }

    setLoading(visitId);
    setErrorMsg(null);
    setSuccessMsg(null);

    const res = await cancelVisit(visitId);
    if (res.success) {
      setSuccessMsg('Visit appointment cancelled successfully.');
      router.refresh();
    } else {
      setErrorMsg(res.error || 'Failed to cancel visit.');
    }
    setLoading(null);
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Requested':
      case 'Under Review':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      case 'Approved':
      case 'Scheduled':
      case 'Rescheduled':
        return 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/25';
      case 'Completed':
      case 'Closed':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'Rejected':
      case 'Cancelled':
        return 'bg-red-500/10 text-red-400 border border-red-500/20';
      default:
        return 'bg-zinc-800 text-zinc-400 border border-zinc-700';
    }
  };

  // Divide visits into Active/Upcoming and Past/Completed
  const upcomingStatuses = ['Requested', 'Under Review', 'Approved', 'Scheduled', 'Rescheduled', 'Postponed'];
  const upcomingVisits = initialVisits.filter(v => upcomingStatuses.includes(v.status));
  const pastVisits = initialVisits.filter(v => !upcomingStatuses.includes(v.status));

  return (
    <div className="space-y-10">
      
      {/* Messages */}
      {errorMsg && (
        <div className="p-4 bg-red-950/40 border border-red-800/60 rounded-2xl flex items-start gap-3 text-red-300 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-800/60 rounded-2xl flex items-start gap-3 text-emerald-300 text-sm">
          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* 1. Upcoming & Scheduled Visits */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Calendar className="w-5 h-5 text-cyan-400" />
          Scheduled & Requested Visits
        </h2>
        {upcomingVisits.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {upcomingVisits.map((visit) => {
              const isSite = !!visit.site_id;
              const name = isSite 
                ? visit.registered_sites?.site_name 
                : visit.dealer_properties?.title;
              const locationText = isSite
                ? `${visit.registered_sites?.area}, ${visit.registered_sites?.city}`
                : `${visit.dealer_properties?.area}, ${visit.dealer_properties?.city}`;

              return (
                <div 
                  key={visit.visit_id} 
                  className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-6 backdrop-blur-xl space-y-4 shadow-lg hover:border-zinc-700/80 transition-all duration-300"
                >
                  <div className="flex justify-between items-start gap-3">
                    <div className="space-y-1">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500 block">
                        {isSite ? `Workflow 2: Builder Site` : `Workflow 1: Matched Property`}
                      </span>
                      <h3 className="font-bold text-white text-base line-clamp-1">{name}</h3>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold ${getStatusBadgeClass(visit.status)}`}>
                      {visit.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 bg-zinc-950/50 border border-zinc-850 p-4 rounded-2xl text-xs">
                    <div className="space-y-1">
                      <span className="text-zinc-500 font-semibold uppercase tracking-wider block text-[9px]">Proposed Date</span>
                      <div className="flex items-center gap-1.5 text-zinc-300">
                        <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{visit.visit_date}</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-zinc-500 font-semibold uppercase tracking-wider block text-[9px]">Proposed Time</span>
                      <div className="flex items-center gap-1.5 text-zinc-300">
                        <Clock className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{visit.visit_time}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-zinc-400 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                    <span className="line-clamp-1">{locationText}</span>
                  </div>

                  <div className="pt-3 border-t border-zinc-850/40">
                    {(() => {
                      const visitDateTime = new Date(`${visit.visit_date}T${visit.visit_time}`);
                      const canCancel = (visitDateTime.getTime() - Date.now()) > (3 * 60 * 60 * 1000);
                      
                      return canCancel ? (
                        <button
                          onClick={() => handleCancel(visit.visit_id)}
                          disabled={loading === visit.visit_id}
                          className="w-full bg-zinc-950 border border-zinc-850 hover:bg-zinc-900 text-red-400 hover:text-red-350 hover:border-red-950/20 font-bold py-2.5 px-4 rounded-xl text-xs transition cursor-pointer disabled:opacity-50"
                        >
                          {loading === visit.visit_id ? 'Cancelling...' : 'Cancel Appointment'}
                        </button>
                      ) : (
                        <div className="w-full bg-zinc-950/30 border border-zinc-850 text-zinc-500 py-2.5 px-4 rounded-xl text-[10px] text-center font-medium">
                          Cancellation Locked (Less than 3h left)
                        </div>
                      );
                    })()}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-10 bg-zinc-900/10 border border-dashed border-zinc-850 rounded-3xl text-xs text-zinc-500">
            No scheduled or pending visits at the moment.
          </div>
        )}
      </section>

      {/* 2. Past & Completed Visits */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          Past & Completed Visits
        </h2>
        {pastVisits.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pastVisits.map((visit) => {
              const isSite = !!visit.site_id;
              const name = isSite 
                ? visit.registered_sites?.site_name 
                : visit.dealer_properties?.title;
              const locationText = isSite
                ? `${visit.registered_sites?.area}, ${visit.registered_sites?.city}`
                : `${visit.dealer_properties?.area}, ${visit.dealer_properties?.city}`;

              const feedback = visit.feedbacks?.[0] || null;

              return (
                <div 
                  key={visit.visit_id} 
                  className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-6 backdrop-blur-xl space-y-4 shadow-lg hover:border-zinc-700/80 transition-all duration-300"
                >
                  <div className="flex justify-between items-start gap-3">
                    <div className="space-y-1">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500 block">
                        {isSite ? `Builder Site` : `Matched Property`}
                      </span>
                      <h3 className="font-bold text-white text-base line-clamp-1">{name}</h3>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold ${getStatusBadgeClass(visit.status)}`}>
                      {visit.status}
                    </span>
                  </div>

                  <div className="text-xs text-zinc-400 flex items-center justify-between border-b border-zinc-850 pb-3">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                      <span>{visit.visit_date} @ {visit.visit_time}</span>
                    </div>
                    <span className="text-zinc-500">{locationText}</span>
                  </div>

                  {/* Feedback Section */}
                  <div className="space-y-3">
                    {feedback ? (
                      /* Feedback Submitted State */
                      <div className="bg-zinc-950/40 border border-zinc-850 p-4 rounded-2xl space-y-3 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-zinc-400">Your Feedback</span>
                          <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1 text-cyan-400">
                              <Building2 className="w-3.5 h-3.5 shrink-0" />
                              Site: {feedback.site_rating}/5
                            </span>
                            <span className="flex items-center gap-1 text-indigo-400">
                              <Star className="w-3.5 h-3.5 shrink-0 fill-indigo-400" />
                              Visit: {feedback.visit_rating}/5
                            </span>
                          </div>
                        </div>
                        {feedback.comments && (
                          <p className="text-zinc-300 italic">
                            &ldquo;{feedback.comments}&rdquo;
                          </p>
                        )}
                      </div>
                    ) : visit.status === 'Completed' ? (
                      /* Feedback Request Button */
                      <button
                        onClick={() => setSelectedVisitId(visit.visit_id)}
                        className="w-full bg-zinc-950 border border-zinc-850 hover:bg-zinc-900 text-cyan-400 hover:text-cyan-300 font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition text-xs cursor-pointer border-dashed border-cyan-800/40"
                      >
                        <MessageSquare className="w-4 h-4 shrink-0" />
                        Submit Visit Feedback
                      </button>
                    ) : (
                      <span className="text-[10px] text-zinc-550 italic block">No feedback required for cancelled/rejected visits.</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-10 bg-zinc-900/10 border border-dashed border-zinc-850 rounded-3xl text-xs text-zinc-500">
            No past visits found.
          </div>
        )}
      </section>

      {/* Feedback Modal */}
      {selectedVisitId && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedVisitId(null)}
              className="absolute right-4 top-4 text-zinc-400 hover:text-white transition p-2 hover:bg-zinc-800 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1.5">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                Feedback & Review
              </span>
              <h3 className="text-lg font-bold text-zinc-200">
                Submit Visit Feedback
              </h3>
              <p className="text-xs text-zinc-400">
                Rate the property quality and your scheduling/guiding experience.
              </p>
            </div>

            <form onSubmit={handleFeedbackSubmit} className="space-y-5">
              {/* Site / Property Rating */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
                  Property / Site Score
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setSiteRating(star)}
                      className="p-1 hover:scale-110 transition cursor-pointer"
                    >
                      <Building2 className={`w-7 h-7 ${star <= siteRating ? 'text-cyan-400' : 'text-zinc-700'}`} />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-cyan-400 ml-2">({siteRating}/5)</span>
                </div>
              </div>

              {/* Experience Rating */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
                  Visit Experience Score
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setVisitRating(star)}
                      className="p-1 hover:scale-110 transition cursor-pointer"
                    >
                      <Star className={`w-7 h-7 ${star <= visitRating ? 'text-indigo-400 fill-indigo-400' : 'text-zinc-700'}`} />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-indigo-400 ml-2">({visitRating}/5)</span>
                </div>
              </div>

              {/* Comments */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
                  Comments & Notes
                </label>
                <textarea
                  required
                  placeholder="Describe your visit experience. Mention any specific likes, concerns, or next steps."
                  rows={4}
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500 transition resize-none text-xs"
                />
              </div>

              <button
                type="submit"
                disabled={loading === selectedVisitId}
                className="w-full bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-black font-bold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 transition duration-300 disabled:opacity-50 cursor-pointer"
              >
                {loading === selectedVisitId ? 'Saving Feedback...' : 'Confirm Submission'}
                <ArrowRight className="w-5 h-5 shrink-0" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
