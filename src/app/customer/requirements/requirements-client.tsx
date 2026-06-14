'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { withdrawRequirement, bookPropertyVisit } from '@/app/actions/customer';
import { confirmModificationByCustomer } from '@/app/actions/admin';
import { 
  ClipboardList, Calendar, Trash2, ArrowRight, 
  MapPin, ShieldAlert, Sparkles, Building2, Check, X, Clock, Loader2
} from 'lucide-react';

interface Match {
  request_id: string;
  match_score: number;
  status: string;
  property_id: string;
  dealer_properties: {
    title: string;
    property_type: string;
    price: number;
    city: string;
    area: string;
    area_size: number;
    bhk: string;
    facing: string;
  };
}

interface Requirement {
  requirement_id: string;
  requirement_code: string;
  property_type: string;
  budget_min: number;
  budget_max: number;
  city: string;
  area: string;
  area_min: number;
  area_max: number;
  additional_notes: string | null;
  status: string;
  created_at: string;
  requirement_amenities: { amenity_name: string }[];
  requirement_facilities: { facility_name: string }[];
  requirement_property_details: { furnishing: string }[];
  matches?: Match[];
}

export default function RequirementsClient({
  requirements,
  canCreateNew,
  pendingModifications = [],
}: {
  requirements: Requirement[];
  canCreateNew: boolean;
  pendingModifications?: any[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null); // tracks loading requirement_id or match_id
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Visit Booking State
  const [bookingMatch, setBookingMatch] = useState<Match | null>(null);
  const [bookingRequirementId, setBookingRequirementId] = useState<string>('');
  const [visitDate, setVisitDate] = useState('');
  const [visitTime, setVisitTime] = useState('');

  const handleWithdraw = async (reqId: string) => {
    if (!confirm('Are you sure you want to withdraw this requirement? All scheduled and pending visits linked to it will be cancelled.')) {
      return;
    }

    setLoading(reqId);
    setErrorMsg(null);
    setSuccessMsg(null);

    const res = await withdrawRequirement(reqId);
    if (res.success) {
      setSuccessMsg('Requirement withdrawn successfully and linked visits cancelled.');
      router.refresh();
    } else {
      setErrorMsg(res.error || 'Failed to withdraw requirement.');
    }
    setLoading(null);
  };

  const handleBookVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingMatch) return;

    const bookingId = bookingMatch.request_id;
    setLoading(bookingId);
    setErrorMsg(null);
    setSuccessMsg(null);

    const res = await bookPropertyVisit({
      requirementId: bookingRequirementId,
      propertyId: bookingMatch.property_id,
      visitDate,
      visitTime,
    });

    if (res.success) {
      setSuccessMsg('Visit requested successfully! You can track it in the Visits Tracker.');
      setBookingMatch(null);
      setVisitDate('');
      setVisitTime('');
      router.refresh();
    } else {
      setErrorMsg(res.error || 'Failed to request visit.');
    }
    setLoading(null);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Your Requirements</h1>
          <p className="text-zinc-400 text-sm">Review active searches, matched properties, and withdraw requests.</p>
        </div>

        {canCreateNew ? (
          <a
            href="/customer/requirements/new"
            className="bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-black font-bold py-3 px-6 rounded-xl flex items-center gap-2 transition shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20"
          >
            Submit New Requirement
            <ArrowRight className="w-5 h-5" />
          </a>
        ) : (
          <button
            disabled
            className="bg-zinc-800 text-zinc-500 font-bold py-3 px-6 rounded-xl cursor-not-allowed border border-zinc-850"
          >
            Active Limit Reached (3 Max)
          </button>
        )}
      </div>

      {/* Messaging alerts */}
      {errorMsg && (
        <div className="p-4 bg-red-950/40 border border-red-800/60 rounded-2xl flex items-start gap-3 text-red-300 text-sm">
          <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-800/60 rounded-2xl flex items-start gap-3 text-emerald-300 text-sm">
          <Sparkles className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Pending modifications section */}
      {pendingModifications.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-extrabold tracking-tight text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-400" />
            Proposed Specification Modifications
          </h2>
          <div className="grid grid-cols-1 gap-6">
            {pendingModifications.map((req) => {
              const proposed = req.proposed_specs;
              const isConfirming = loading === req.request_id;

              return (
                <div 
                  key={req.request_id}
                  className="bg-zinc-900/40 border border-violet-900/30 rounded-3xl p-6 sm:p-8 space-y-4 hover:border-violet-900/50 transition-all relative overflow-hidden"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-850 pb-3">
                    <div>
                      <h4 className="font-extrabold text-sm text-white flex items-center gap-2">
                        Requirement: {req.requirement?.requirement_code}
                      </h4>
                      <p className="text-[10px] text-zinc-400">
                        Recommended by: {req.employees?.employee_name}
                      </p>
                    </div>
                    <span className="px-2.5 py-0.5 text-[9px] font-bold rounded uppercase tracking-wider bg-violet-950 text-violet-400 border border-violet-900 self-start sm:self-auto">
                      Awaiting Your Confirmation
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-zinc-950/20 p-4 rounded-2xl border border-zinc-850/40">
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide block">Proposed Parameters</span>
                      <div className="space-y-1 text-xs">
                        <p className="text-zinc-400">Type: <strong className="text-white font-semibold">{proposed.property_type}</strong></p>
                        <p className="text-zinc-400">Budget: <strong className="text-white font-semibold">₹{(proposed.budget_min / 100000).toFixed(1)}L - ₹{(proposed.budget_max / 100000).toFixed(1)}L</strong></p>
                        <p className="text-zinc-400">Location: <strong className="text-white font-semibold">{proposed.area}, {proposed.city}</strong></p>
                        <p className="text-zinc-400">Size: <strong className="text-white font-semibold">{proposed.area_min} - {proposed.area_max} sq. ft.</strong></p>
                      </div>
                    </div>
                    <div className="flex flex-col justify-end items-end">
                      <button
                        onClick={async () => {
                          if (!confirm('Confirm these changes to your requirement parameters? Once confirmed, the representative will submit it for administrator approval.')) {
                            return;
                          }
                          setLoading(req.request_id);
                          setErrorMsg(null);
                          setSuccessMsg(null);
                          try {
                            const res = await confirmModificationByCustomer(req.request_id);
                            if (res.success) {
                              setSuccessMsg('Successfully confirmed modification request! Awaiting admin approval.');
                              router.refresh();
                            } else {
                              setErrorMsg(res.error || 'Failed to confirm modifications.');
                            }
                          } catch (err: any) {
                            setErrorMsg(err.message || 'Error occurred.');
                          } finally {
                            setLoading(null);
                          }
                        }}
                        disabled={isConfirming}
                        className="w-full sm:w-auto bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-black font-bold py-2.5 px-6 rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer text-xs"
                      >
                        {isConfirming ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Confirming...
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4" />
                            Confirm Proposed Specifications
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Requirements List */}
      {requirements.length > 0 ? (
        <div className="space-y-8">
          {requirements.map((req) => (
            <div 
              key={req.requirement_id} 
              className={`bg-zinc-900/40 border rounded-3xl overflow-hidden backdrop-blur-xl transition ${
                req.status === 'Withdrawn' ? 'border-zinc-850 opacity-60' : 'border-zinc-800/80 shadow-lg'
              }`}
            >
              {/* Header card info */}
              <div className="p-6 sm:p-8 bg-zinc-950/40 border-b border-zinc-850/65 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-zinc-500">{req.requirement_code}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      req.status === 'Withdrawn' ? 'bg-zinc-800 text-zinc-400' : 'bg-cyan-500/15 text-cyan-400'
                    }`}>
                      {req.status}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold">
                    {req.property_type} in {req.area}, {req.city}
                  </h3>
                </div>

                {req.status !== 'Withdrawn' && (
                  <button
                    onClick={() => handleWithdraw(req.requirement_id)}
                    disabled={loading === req.requirement_id}
                    className="text-zinc-400 hover:text-red-400 p-2.5 hover:bg-red-950/25 rounded-xl border border-transparent hover:border-red-900/30 transition cursor-pointer disabled:opacity-50"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Requirement Details Grid */}
              <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-3 gap-6 border-b border-zinc-850/40">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Budget Details</span>
                  <p className="font-extrabold text-zinc-200">
                    ₹{Number(req.budget_min).toLocaleString()} - ₹{Number(req.budget_max).toLocaleString()}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Area Size Specs</span>
                  <p className="font-extrabold text-zinc-200">
                    {req.area_min} - {req.area_max} sq. ft.
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Furnishing State</span>
                  <p className="font-extrabold text-zinc-200">
                    {req.requirement_property_details?.[0]?.furnishing || 'Unspecified'}
                  </p>
                </div>

                {/* Amenities */}
                {req.requirement_amenities && req.requirement_amenities.length > 0 && (
                  <div className="md:col-span-3 space-y-2">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Requested Amenities</span>
                    <div className="flex flex-wrap gap-2">
                      {req.requirement_amenities.map((amenity, i) => (
                        <span key={i} className="px-2.5 py-1 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-300">
                          {amenity.amenity_name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Matched Properties section */}
              {req.status !== 'Withdrawn' && (
                <div className="p-6 sm:p-8 bg-zinc-950/20 space-y-6">
                  <h4 className="text-sm font-extrabold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    Compatible Match Pool
                  </h4>

                  {req.matches && req.matches.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      {req.matches.map((match) => (
                        <div 
                          key={match.request_id}
                          className="bg-zinc-900/40 border border-zinc-850 hover:border-zinc-800 rounded-2xl p-5 space-y-4 flex flex-col justify-between"
                        >
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="px-2.5 py-0.5 bg-cyan-950/30 text-cyan-400 rounded-lg text-xs font-bold">
                                {match.match_score}% Score
                              </span>
                              <span className="text-[10px] font-bold text-zinc-500">
                                {match.dealer_properties.bhk || 'N/A'} Configuration
                              </span>
                            </div>
                            <h5 className="font-bold text-zinc-200 line-clamp-1">
                              {match.dealer_properties.title}
                            </h5>
                            <p className="text-xs text-zinc-400 flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                              <span>{match.dealer_properties.area}, {match.dealer_properties.city}</span>
                            </p>
                          </div>

                          <div className="pt-3 border-t border-zinc-850/60 flex items-center justify-between gap-4">
                            <div>
                              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">Price</span>
                              <span className="font-bold text-zinc-200">₹{Number(match.dealer_properties.price).toLocaleString()}</span>
                            </div>

                            <button
                              onClick={() => {
                                setBookingMatch(match);
                                setBookingRequirementId(req.requirement_id);
                              }}
                              className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:text-white px-4 py-2 rounded-xl text-xs font-bold text-zinc-300 transition cursor-pointer"
                            >
                              Request Visit
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-zinc-500 text-xs border border-dashed border-zinc-850 rounded-2xl">
                      No matching properties found yet. Our matching engine will update listings as dealers add properties.
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-zinc-900/20 border border-dashed border-zinc-850 rounded-3xl space-y-4">
          <ClipboardList className="w-12 h-12 text-zinc-600 mx-auto" />
          <h3 className="font-bold text-lg text-zinc-300">No Requirements Submitted</h3>
          <p className="text-zinc-500 text-sm max-w-sm mx-auto">
            Get started by submitting your property requirements, and our engine will match them with dealer properties.
          </p>
          <a
            href="/customer/requirements/new"
            className="inline-flex bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-black font-bold py-3 px-6 rounded-xl items-center gap-2 transition shadow-lg shadow-indigo-500/10"
          >
            Submit Your First Requirement
            <ArrowRight className="w-5 h-5" />
          </a>
        </div>
      )}

      {/* Visit Booking Modal */}
      {bookingMatch && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative">
            <button
              onClick={() => {
                setBookingMatch(null);
                setVisitDate('');
                setVisitTime('');
              }}
              className="absolute right-4 top-4 text-zinc-400 hover:text-white transition p-2 hover:bg-zinc-800 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1.5">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                Schedule visit
              </span>
              <h3 className="text-lg font-bold text-zinc-200">
                {bookingMatch.dealer_properties.title}
              </h3>
              <p className="text-xs text-zinc-400">
                Matched property for your active requirement. Pick your preferred date and time.
              </p>
            </div>

            <form onSubmit={handleBookVisit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Preferred Date</label>
                <input
                  type="date"
                  required
                  disabled={loading === bookingMatch.request_id}
                  min={new Date().toISOString().split('T')[0]}
                  value={visitDate}
                  onChange={(e) => setVisitDate(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-cyan-500 transition"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Preferred Time</label>
                <div className="relative">
                  <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                  <input
                    type="time"
                    required
                    disabled={loading === bookingMatch.request_id}
                    value={visitTime}
                    onChange={(e) => setVisitTime(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-cyan-500 transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading === bookingMatch.request_id}
                className="w-full bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-black font-bold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 transition duration-300 disabled:opacity-50 cursor-pointer"
              >
                {loading === bookingMatch.request_id ? 'Submitting Request...' : 'Confirm Visit Request'}
                <ArrowRight className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
