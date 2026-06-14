'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Phone, MessageSquare, Plus, Trash2, Settings, UserPlus, 
  Star, FileText, CheckCircle2, Calendar, DollarSign, AlertCircle, 
  Loader2, Sparkles, CheckSquare, XCircle, ArrowRightLeft, UserCheck
} from 'lucide-react';
import { 
  assignEmployeeToRequirement,
  setRequirementLeadAssignee,
  removeEmployeeAssignment,
  logCustomerInteraction,
  createRequirementDeal,
  modifyRequirementSpecs,
  submitWithdrawalRecommendation
} from '@/app/actions/employee';

interface RequirementWorkspaceClientProps {
  requirement: any;
  assignments: any[];
  notes: any[];
  matchingRequests: any[];
  allEmployees: any[];
  currentEmployeeId: string;
  isLead: boolean;
  visits: any[];
  deals: any[];
}

export default function RequirementWorkspaceClient({
  requirement,
  assignments,
  notes,
  matchingRequests,
  allEmployees,
  currentEmployeeId,
  isLead,
  visits: initialVisits,
  deals: initialDeals,
}: RequirementWorkspaceClientProps) {
  const router = useRouter();
  
  // Specs Form State
  const [specs, setSpecs] = useState({
    property_type: requirement.property_type || '',
    budget_min: Number(requirement.budget_min) || 0,
    budget_max: Number(requirement.budget_max) || 0,
    city: requirement.city || '',
    area: requirement.area || '',
    area_min: Number(requirement.area_min) || 0,
    area_max: Number(requirement.area_max) || 0,
    additional_notes: requirement.additional_notes || '',
  });

  const [savingSpecs, setSavingSpecs] = useState(false);
  const [specsMessage, setSpecsMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Helper Staff State
  const [selectedHelperId, setSelectedHelperId] = useState('');
  const [assigningStaff, setAssigningStaff] = useState(false);

  // Interaction Log Modal State
  const [activeLogSession, setActiveLogSession] = useState<'Call' | 'WhatsApp' | null>(null);
  const [showLogModal, setShowLogModal] = useState(false);
  const [logOutcome, setLogOutcome] = useState('Connected');
  const [logNotes, setLogNotes] = useState('');
  const [logFollowupDate, setLogFollowupDate] = useState('');
  const [savingLog, setSavingLog] = useState(false);

  // Withdrawal Recommendation State
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [withdrawalReason, setWithdrawalReason] = useState('');
  const [submittingWithdrawal, setSubmittingWithdrawal] = useState(false);

  // Deal launching State
  const [launchingDealId, setLaunchingDealId] = useState<string | null>(null);
  const [dealLaunchStatus, setDealLaunchStatus] = useState<string | null>(null);

  // window refocused event detector for Issue EMP-6.1
  useEffect(() => {
    const handleFocus = () => {
      if (activeLogSession) {
        setShowLogModal(true);
      }
    };
    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [activeLogSession]);

  const handleCallClick = () => {
    setActiveLogSession('Call');
    window.open(`tel:${requirement.customer.phone}`, '_blank');
  };

  const handleWhatsAppClick = () => {
    setActiveLogSession('WhatsApp');
    const waPhone = requirement.customer.phone.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${waPhone}`, '_blank');
  };

  const submitLog = async () => {
    if (!logNotes.trim()) {
      alert('Please enter detailed interaction notes.');
      return;
    }
    setSavingLog(true);
    try {
      const response = await logCustomerInteraction({
        requirementId: requirement.requirement_id,
        customerId: requirement.customer_id,
        type: activeLogSession!,
        outcome: logOutcome,
        notes: logNotes,
        nextFollowupDate: logFollowupDate || undefined,
      });

      if (response.success) {
        setShowLogModal(false);
        setActiveLogSession(null);
        setLogNotes('');
        setLogFollowupDate('');
        router.refresh();
      } else {
        alert(response.error || 'Failed to save interaction logs.');
      }
    } catch (err: any) {
      alert(err.message || 'Error saving interaction.');
    } finally {
      setSavingLog(false);
    }
  };

  const handleSaveSpecs = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLead) return;
    setSavingSpecs(true);
    setSpecsMessage(null);
    try {
      const response = await modifyRequirementSpecs(requirement.requirement_id, specs);
      if (response.success) {
        setSpecsMessage({ type: 'success', text: 'Modification request proposed successfully. Status: Pending Customer Confirmation.' });
        router.refresh();
      } else {
        setSpecsMessage({ type: 'error', text: response.error || 'Failed to update specs.' });
      }
    } catch (err: any) {
      setSpecsMessage({ type: 'error', text: err.message || 'Error occurred.' });
    } finally {
      setSavingSpecs(false);
    }
  };

  const handleAddHelper = async () => {
    if (!selectedHelperId) return;
    setAssigningStaff(true);
    try {
      const response = await assignEmployeeToRequirement(requirement.requirement_id, selectedHelperId);
      if (response.success) {
        setSelectedHelperId('');
        router.refresh();
      } else {
        alert(response.error || 'Failed to assign helper coordinator.');
      }
    } catch (err: any) {
      alert(err.message || 'Error adding staff assignment.');
    } finally {
      setAssigningStaff(false);
    }
  };

  const handleSetLead = async (assignmentId: string) => {
    if (!confirm('Are you sure you want to transfer Lead Assignee status to this coworker? You will lose editing rights.')) {
      return;
    }
    try {
      const response = await setRequirementLeadAssignee(requirement.requirement_id, assignmentId);
      if (response.success) {
        router.refresh();
      } else {
        alert(response.error || 'Failed to update Lead representative.');
      }
    } catch (err: any) {
      alert(err.message || 'Error updating Lead assignee.');
    }
  };

  const handleRemoveHelper = async (assignmentId: string) => {
    if (!confirm('Remove this coordinator from this requirement?')) return;
    try {
      const response = await removeEmployeeAssignment(assignmentId);
      if (response.success) {
        router.refresh();
      } else {
        alert(response.error || 'Failed to remove staff assignment.');
      }
    } catch (err: any) {
      alert(err.message || 'Error removing assignment.');
    }
  };

  const handleSubmitWithdrawal = async () => {
    if (!withdrawalReason.trim()) {
      alert('Please enter a recommendation reason.');
      return;
    }
    setSubmittingWithdrawal(true);
    try {
      const response = await submitWithdrawalRecommendation(requirement.requirement_id, withdrawalReason);
      if (response.success) {
        setShowWithdrawalModal(false);
        setWithdrawalReason('');
        alert('Withdrawal recommendation submitted. Notes have been logged to the history timeline.');
        router.refresh();
      } else {
        alert(response.error || 'Failed to submit recommendation.');
      }
    } catch (err: any) {
      alert(err.message || 'Error submitting recommendation.');
    } finally {
      setSubmittingWithdrawal(false);
    }
  };

  const handleLaunchDeal = async (propId: string, dealerId: string) => {
    if (!confirm('Launch deal negotiation between this client requirement and the matching property?')) {
      return;
    }
    setLaunchingDealId(propId);
    setDealLaunchStatus(null);
    try {
      const response = await createRequirementDeal(
        requirement.requirement_id,
        propId,
        requirement.customer_id,
        dealerId
      );

      if (response.success) {
        setDealLaunchStatus('Deal launched successfully! Check Deals Pipeline.');
        router.refresh();
      } else {
        setDealLaunchStatus(`Launch failed: ${response.error}`);
      }
    } catch (err: any) {
      setDealLaunchStatus(`Launch failed: ${err.message}`);
    } finally {
      setLaunchingDealId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Client Header Info */}
      <div className="bg-gradient-to-r from-zinc-900 via-slate-900 to-zinc-900 p-6 rounded-3xl border border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="space-y-2 relative z-10">
          <span className="px-2.5 py-0.5 bg-violet-950/60 text-violet-400 text-[10px] font-bold rounded border border-violet-900/60 uppercase tracking-widest inline-block">
            Customer Workspace
          </span>
          <h1 className="text-2xl font-black text-white">{requirement.customer.name}</h1>
          <div className="flex flex-wrap gap-4 text-xs text-zinc-400">
            <span>Email: <strong className="text-zinc-200">{requirement.customer.email}</strong></span>
            <span>Phone: <strong className="text-zinc-200">{requirement.customer.phone}</strong></span>
          </div>
        </div>

        {/* Action Triggers */}
        <div className="flex flex-wrap gap-3 relative z-10">
          <button
            onClick={handleCallClick}
            className="flex items-center gap-2 px-4 py-2.5 bg-zinc-850 hover:bg-violet-600 text-white font-bold text-xs rounded-xl border border-zinc-800 transition-all duration-300"
          >
            <Phone className="w-4 h-4" />
            Call Client
          </button>
          
          <button
            onClick={handleWhatsAppClick}
            className="flex items-center gap-2 px-4 py-2.5 bg-zinc-850 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl border border-zinc-800 transition-all duration-300"
          >
            <MessageSquare className="w-4 h-4" />
            WhatsApp Message
          </button>

          {isLead && (
            <button
              onClick={() => setShowWithdrawalModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-red-950/20 hover:bg-red-900/40 text-red-400 font-bold text-xs rounded-xl border border-red-900/60 transition-all duration-300"
            >
              <XCircle className="w-4 h-4" />
              Recommend Withdrawal
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Columns - Details, Matches, Timeline */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Requirement Specifications Form */}
          <div className="bg-zinc-900/40 border border-zinc-800/80 p-6 rounded-2xl space-y-4">
            <h3 className="font-extrabold text-sm uppercase text-zinc-400 tracking-wider">
              Requirement Specifications
            </h3>

            {!isLead && (
              <div className="p-3 bg-zinc-950 text-zinc-400 border border-zinc-850 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-violet-400" />
                Read-Only: Specs editing is restricted to the Lead Representative.
              </div>
            )}

            <form onSubmit={handleSaveSpecs} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-zinc-550 text-zinc-400 font-semibold">Property Type</label>
                  <input
                    type="text"
                    disabled={!isLead}
                    value={specs.property_type}
                    onChange={(e) => setSpecs({ ...specs, property_type: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500 disabled:opacity-50"
                    placeholder="e.g. Apartment, Villa"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-xs text-zinc-400 font-semibold">Min Budget (₹)</label>
                    <input
                      type="number"
                      disabled={!isLead}
                      value={specs.budget_min}
                      onChange={(e) => setSpecs({ ...specs, budget_min: Number(e.target.value) })}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500 disabled:opacity-50"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-zinc-400 font-semibold">Max Budget (₹)</label>
                    <input
                      type="number"
                      disabled={!isLead}
                      value={specs.budget_max}
                      onChange={(e) => setSpecs({ ...specs, budget_max: Number(e.target.value) })}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500 disabled:opacity-50"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-zinc-400 font-semibold">City</label>
                  <input
                    type="text"
                    disabled={!isLead}
                    value={specs.city}
                    onChange={(e) => setSpecs({ ...specs, city: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500 disabled:opacity-50"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-zinc-400 font-semibold">Area / Locality</label>
                  <input
                    type="text"
                    disabled={!isLead}
                    value={specs.area}
                    onChange={(e) => setSpecs({ ...specs, area: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500 disabled:opacity-50"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-zinc-400 font-semibold">Min Size (sq. ft.)</label>
                  <input
                    type="number"
                    disabled={!isLead}
                    value={specs.area_min}
                    onChange={(e) => setSpecs({ ...specs, area_min: Number(e.target.value) })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500 disabled:opacity-50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-zinc-400 font-semibold">Max Size (sq. ft.)</label>
                  <input
                    type="number"
                    disabled={!isLead}
                    value={specs.area_max}
                    onChange={(e) => setSpecs({ ...specs, area_max: Number(e.target.value) })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500 disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-zinc-400 font-semibold">Additional Specs & Notes</label>
                <textarea
                  disabled={!isLead}
                  value={specs.additional_notes}
                  onChange={(e) => setSpecs({ ...specs, additional_notes: e.target.value })}
                  rows={3}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500 disabled:opacity-50 resize-none"
                  placeholder="e.g. Prefer east facing balconies, high rise..."
                />
              </div>

              {isLead && (
                <div className="flex items-center justify-between pt-2">
                  {specsMessage && (
                    <span className={`text-xs font-semibold ${specsMessage.type === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {specsMessage.text}
                    </span>
                  )}
                  <button
                    type="submit"
                    disabled={savingSpecs}
                    className="ml-auto flex items-center gap-2 px-5 py-2 bg-violet-600 hover:bg-violet-750 text-white font-bold text-xs rounded-xl disabled:opacity-50 transition-all duration-300 cursor-pointer"
                  >
                    {savingSpecs && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Save Parameters
                  </button>
                </div>
              )}
            </form>
          </div>

          {/* Matches & Deals Launcher */}
          <div className="bg-zinc-900/40 border border-zinc-800/80 p-6 rounded-2xl space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm uppercase text-zinc-400 tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-violet-400" />
                Property Matches (Launch Deals)
              </h3>
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                Matches found: {matchingRequests.length}
              </span>
            </div>

            {dealLaunchStatus && (
              <div className="p-3 bg-zinc-950 text-xs border border-zinc-800 rounded-xl text-violet-400 font-bold">
                {dealLaunchStatus}
              </div>
            )}

            <div className="space-y-4">
              {matchingRequests.length > 0 ? (
                matchingRequests.map((req: any) => {
                  const prop = req.dealer_properties;
                  if (!prop) return null;
                  const isLaunching = launchingDealId === prop.property_id;

                  return (
                    <div 
                      key={req.request_id}
                      className="p-5 bg-zinc-950/40 border border-zinc-850 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-zinc-800 transition-all duration-300"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-violet-950/60 text-violet-400 border border-violet-900/40 text-[9px] font-bold rounded">
                            Score: {req.match_score}%
                          </span>
                          <span className="text-zinc-500 text-[10px] uppercase font-bold">
                            {prop.property_type}
                          </span>
                        </div>
                        <h4 className="font-extrabold text-sm text-white">{prop.title}</h4>
                        <p className="text-xs text-zinc-400">
                          ₹{(prop.price / 100000).toFixed(1)}L | {prop.area}, {prop.city}
                        </p>
                      </div>

                      <div>
                        {isLead ? (
                          <button
                            onClick={() => handleLaunchDeal(prop.property_id, req.dealer_id)}
                            disabled={isLaunching}
                            className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-750 text-white font-bold text-xs rounded-xl disabled:opacity-50 transition-all duration-300 cursor-pointer"
                          >
                            {isLaunching && <Loader2 className="w-3 h-3 animate-spin" />}
                            Launch Negotiation
                          </button>
                        ) : (
                          <span className="text-[10px] text-zinc-500 font-bold uppercase italic">
                            Lead Representative Action Only
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-zinc-500 text-xs bg-zinc-950/20 border border-zinc-850 rounded-2xl">
                  No dealer property matching matches submitted.
                </div>
              )}
            </div>
          </div>

          {/* Timeline / Interaction Logs */}
          <div className="bg-zinc-900/40 border border-zinc-800/80 p-6 rounded-2xl space-y-6">
            <h3 className="font-extrabold text-sm uppercase text-zinc-400 tracking-wider">
              Interaction & Action Logs Timeline
            </h3>

            <div className="relative border-l-2 border-zinc-800/60 ml-3.5 pl-6 space-y-6">
              {notes.length > 0 ? (
                notes.map((note: any) => {
                  const isCallLog = note.note_text.startsWith('[CALL_LOG]');
                  const isWhatsAppLog = note.note_text.startsWith('[WHATSAPP_LOG]');
                  const isWithdrawal = note.note_text.startsWith('[WITHDRAWAL_RECOMMENDATION]');
                  
                  let logIcon = <FileText className="w-4 h-4 text-zinc-400" />;
                  let bgClass = 'bg-zinc-900/40 border-zinc-800';
                  
                  if (isCallLog) {
                    logIcon = <Phone className="w-4 h-4 text-violet-400" />;
                    bgClass = 'bg-violet-950/10 border-violet-950';
                  } else if (isWhatsAppLog) {
                    logIcon = <MessageSquare className="w-4 h-4 text-emerald-400" />;
                    bgClass = 'bg-emerald-950/10 border-emerald-950';
                  } else if (isWithdrawal) {
                    logIcon = <AlertCircle className="w-4 h-4 text-red-400" />;
                    bgClass = 'bg-red-950/10 border-red-950';
                  }

                  return (
                    <div key={note.note_id} className="relative">
                      {/* Timeline point */}
                      <span className="absolute -left-[35px] top-1 flex items-center justify-center w-6.5 h-6.5 rounded-full bg-zinc-950 border border-zinc-800">
                        {logIcon}
                      </span>
                      
                      <div className={`p-4 border rounded-2xl space-y-2 ${bgClass}`}>
                        <p className="text-xs text-zinc-300 leading-relaxed font-medium">
                          {note.note_text}
                        </p>
                        <div className="flex justify-between items-center text-[10px] text-zinc-550 text-zinc-500">
                          <span>By: {note.users?.email || 'System'}</span>
                          <span>{new Date(note.created_at).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-4 text-zinc-500 text-xs italic">
                  No interactions logged. Click "Call Client" or "WhatsApp Message" to log your first call.
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Right Side Column - Staff Assignments, Deals, Visits */}
        <div className="space-y-8">
          
          {/* Staff Assignments Panel */}
          <div className="bg-zinc-900/40 border border-zinc-800/80 p-6 rounded-2xl space-y-4">
            <h3 className="font-extrabold text-sm uppercase text-zinc-400 tracking-wider">
              Assigned Representatives
            </h3>

            <div className="space-y-3">
              {assignments.map((assign: any) => (
                <div 
                  key={assign.assignment_id}
                  className="p-3 bg-zinc-950/50 border border-zinc-850 rounded-xl flex items-center justify-between gap-3"
                >
                  <div className="space-y-0.5">
                    <h5 className="font-bold text-xs text-white">
                      {assign.employees?.name}
                    </h5>
                    <p className="text-[10px] text-zinc-500">
                      {assign.employees?.designation || 'Representative'}
                    </p>
                    {assign.is_lead && (
                      <span className="inline-block text-[8px] bg-violet-950 text-violet-400 border border-violet-900 font-bold px-1.5 py-0.5 rounded-md mt-1 uppercase tracking-wide">
                        Lead Representative
                      </span>
                    )}
                  </div>

                  {/* Actions for Lead Assignee */}
                  {isLead && assign.employee_id !== currentEmployeeId && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleSetLead(assign.assignment_id)}
                        title="Transfer Lead Role"
                        className="p-1.5 bg-zinc-850 hover:bg-violet-600 text-zinc-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                      >
                        <Star className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleRemoveHelper(assign.assignment_id)}
                        title="Remove Assignment"
                        className="p-1.5 bg-zinc-855 hover:bg-red-950 text-zinc-400 hover:text-red-400 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Add helper staff */}
            {isLead && (
              <div className="pt-3 border-t border-zinc-850 space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide block">
                  Add Coordinator helper
                </label>
                <div className="flex gap-2">
                  <select
                    value={selectedHelperId}
                    onChange={(e) => setSelectedHelperId(e.target.value)}
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                  >
                    <option value="">Select Employee...</option>
                    {allEmployees
                      .filter(emp => !assignments.some(a => a.employee_id === emp.employee_id))
                      .map(emp => (
                        <option key={emp.employee_id} value={emp.employee_id}>
                          {emp.name} ({emp.designation || 'Staff'})
                        </option>
                      ))}
                  </select>
                  <button
                    onClick={handleAddHelper}
                    disabled={assigningStaff || !selectedHelperId}
                    className="p-2 bg-violet-600 hover:bg-violet-750 text-white rounded-xl disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    {assigningStaff ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <UserPlus className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Visits Timeline panel */}
          <div className="bg-zinc-900/40 border border-zinc-800/80 p-6 rounded-2xl space-y-4">
            <h3 className="font-extrabold text-sm uppercase text-zinc-400 tracking-wider">
              Coordinated Visits
            </h3>
            
            <div className="space-y-3">
              {initialVisits.length > 0 ? (
                initialVisits.map((v: any) => (
                  <div key={v.visit_id} className="p-3 bg-zinc-950/50 border border-zinc-850 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] bg-zinc-800 text-zinc-300 font-bold px-1.5 py-0.5 rounded">
                        {v.status}
                      </span>
                      <span className="text-[9px] text-zinc-500 font-semibold">
                        {v.visit_date} @ {v.visit_time.substring(0, 5)}
                      </span>
                    </div>
                    <h6 className="font-bold text-xs text-white line-clamp-1">{v.property?.title}</h6>
                    <p className="text-[10px] text-zinc-400">{v.property?.area}, {v.property?.city}</p>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-zinc-500 text-xs">
                  No visits scheduled for this requirement.
                </div>
              )}
            </div>
          </div>

          {/* Deals Negotiation panel */}
          <div className="bg-zinc-900/40 border border-zinc-800/80 p-6 rounded-2xl space-y-4">
            <h3 className="font-extrabold text-sm uppercase text-zinc-400 tracking-wider">
              Active Deals
            </h3>

            <div className="space-y-3">
              {initialDeals.length > 0 ? (
                initialDeals.map((d: any) => (
                  <div key={d.deal_id} className="p-3 bg-zinc-950/50 border border-zinc-850 rounded-xl flex items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <h6 className="font-bold text-xs text-white line-clamp-1">{d.property?.title}</h6>
                      <span className="inline-block text-[9px] bg-violet-950 text-violet-400 border border-violet-900/40 font-bold px-1.5 py-0.5 rounded">
                        Stage: {d.current_stage}
                      </span>
                    </div>
                    <a
                      href="/employee/deals"
                      className="p-1.5 bg-zinc-850 hover:bg-violet-600 rounded-lg text-zinc-400 hover:text-white transition-colors"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5" />
                    </a>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-zinc-500 text-xs">
                  No negotiations started. Launch a deal from the property matches panel.
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Interaction Log Modal (Issue EMP-6.1) */}
      {showLogModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 max-w-md w-full rounded-2xl p-6 space-y-4 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/10 rounded-full blur-xl pointer-events-none" />
            
            <div className="space-y-1">
              <h4 className="font-extrabold text-base text-white">
                Log {activeLogSession} Interaction
              </h4>
              <p className="text-xs text-zinc-400">
                Please log the details of your conversation with <strong className="text-zinc-200">{requirement.customer.name}</strong>.
              </p>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Interaction Outcome</label>
                <select
                  value={logOutcome}
                  onChange={(e) => setLogOutcome(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                >
                  <option value="Connected">Connected & Spoke</option>
                  <option value="No Answer">No Answer / Left Voicemail</option>
                  <option value="Busy">Line Busy</option>
                  <option value="Not Interested">Customer Not Interested</option>
                  <option value="Callback Scheduled">Callback Requested</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Detailed Conversation Notes</label>
                <textarea
                  value={logNotes}
                  onChange={(e) => setLogNotes(e.target.value)}
                  rows={4}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500 resize-none"
                  placeholder="Summarize the client requirements, feedback on match listings, or follow-up details..."
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">
                  Schedule Follow-up callback (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={logFollowupDate}
                  onChange={(e) => setLogFollowupDate(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  setShowLogModal(false);
                  setActiveLogSession(null);
                }}
                disabled={savingLog}
                className="px-4 py-2 bg-zinc-850 hover:bg-zinc-800 text-zinc-300 font-bold text-xs rounded-xl transition-all duration-300"
              >
                Skip / Dismiss
              </button>
              <button
                onClick={submitLog}
                disabled={savingLog || !logNotes.trim()}
                className="flex items-center gap-1.5 px-5 py-2 bg-violet-600 hover:bg-violet-750 text-white font-bold text-xs rounded-xl disabled:opacity-50 transition-all duration-300 cursor-pointer"
              >
                {savingLog && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Log Interaction
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Withdrawal Recommendation Modal */}
      {showWithdrawalModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 max-w-md w-full rounded-2xl p-6 space-y-4 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="space-y-1">
              <h4 className="font-extrabold text-base text-white">
                Submit Withdrawal Recommendation
              </h4>
              <p className="text-xs text-zinc-400">
                Recommend that this customer requirement be withdrawn. Describe the client circumstances or reason. This must be approved by the customer or an admin.
              </p>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Reason / Circumstances</label>
                <textarea
                  value={withdrawalReason}
                  onChange={(e) => setWithdrawalReason(e.target.value)}
                  rows={4}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500 resize-none"
                  placeholder="e.g. Buyer has bought another property, or budget no longer aligns..."
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  setShowWithdrawalModal(false);
                  setWithdrawalReason('');
                }}
                disabled={submittingWithdrawal}
                className="px-4 py-2 bg-zinc-850 hover:bg-zinc-800 text-zinc-300 font-bold text-xs rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitWithdrawal}
                disabled={submittingWithdrawal || !withdrawalReason.trim()}
                className="flex items-center gap-1.5 px-5 py-2 bg-red-650 hover:bg-red-750 text-white font-bold text-xs rounded-xl disabled:opacity-50 transition-all duration-300 cursor-pointer"
              >
                {submittingWithdrawal && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Submit Recommendation
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
