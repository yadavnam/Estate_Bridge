'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupportTicket } from '@/app/actions/customer';
import { 
  HelpCircle, Plus, MessageSquare, Clock, 
  ArrowRight, ShieldAlert, CheckCircle2, X, AlertCircle
} from 'lucide-react';

interface SupportTicket {
  ticket_id: string;
  subject: string;
  category: string;
  status: string;
  created_at: string;
  support_messages: {
    message_id: string;
    created_at: string;
  }[];
}

const CATEGORIES = [
  'Property Matching',
  'Visit Scheduling',
  'Deals & Payments',
  'Portal & Technical Issues',
  'General Enquiries'
];

export default function SupportClient({ tickets }: { tickets: SupportTicket[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // New ticket modal and form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [message, setMessage] = useState('');

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const res = await createSupportTicket({
      subject,
      category,
      message,
    });

    if (res.success) {
      setSuccessMsg('Support ticket opened successfully!');
      setSubject('');
      setMessage('');
      setIsModalOpen(false);
      router.refresh();
    } else {
      setErrorMsg(res.error || 'Failed to create support ticket.');
    }
    setLoading(false);
  };

  const getStatusBadge = (status: string) => {
    if (status === 'Closed') {
      return 'bg-zinc-800 text-zinc-400 border border-zinc-700/60';
    }
    return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30';
  };

  return (
    <div className="space-y-6">
      
      {/* Header Panel */}
      <div className="flex justify-between items-center bg-zinc-900/40 border border-zinc-800/80 p-6 rounded-3xl backdrop-blur-xl">
        <div className="space-y-1">
          <h3 className="font-bold text-zinc-300">Need immediate assistance?</h3>
          <p className="text-zinc-500 text-xs">Our system coordinators and support staff typically respond within a few hours.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-black font-bold py-3 px-5 rounded-xl flex items-center gap-2 transition text-xs shadow-lg shadow-indigo-500/10 cursor-pointer"
        >
          <Plus className="w-4.5 h-4.5" />
          Open New Ticket
        </button>
      </div>

      {/* Notifications */}
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

      {/* Ticket List */}
      {tickets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tickets.map((ticket) => (
            <div
              key={ticket.ticket_id}
              className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-6 backdrop-blur-xl flex flex-col justify-between hover:border-zinc-700/80 transition-all duration-300 group"
            >
              <div className="space-y-4">
                <div className="flex justify-between items-start gap-3">
                  <span className="px-2 py-0.5 bg-zinc-950 border border-zinc-850 rounded-lg text-[9px] font-bold text-zinc-400 uppercase tracking-wider">
                    {ticket.category}
                  </span>
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider ${getStatusBadge(ticket.status)}`}>
                    {ticket.status}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h4 className="font-bold text-white group-hover:text-cyan-400 transition-colors line-clamp-1">
                    {ticket.subject}
                  </h4>
                  <p className="text-[10px] text-zinc-500 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Opened on {new Date(ticket.created_at).toLocaleDateString()}</span>
                  </p>
                </div>
              </div>

              <div className="pt-5 mt-5 border-t border-zinc-850/40 flex items-center justify-between">
                <span className="text-[10px] font-bold text-zinc-450 text-zinc-400 flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-zinc-500" />
                  {ticket.support_messages?.length || 0} messages
                </span>
                
                <a
                  href={`/customer/support/${ticket.ticket_id}`}
                  className="bg-zinc-950 border border-zinc-850 hover:bg-zinc-900 group-hover:border-cyan-800/60 text-zinc-300 group-hover:text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  View Chat
                  <ArrowRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
                </a>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-zinc-900/10 border border-dashed border-zinc-850 rounded-3xl space-y-4">
          <HelpCircle className="w-12 h-12 text-zinc-650 mx-auto" />
          <h3 className="font-bold text-lg text-zinc-300">No Support Tickets Found</h3>
          <p className="text-zinc-500 text-sm max-w-sm mx-auto">
            If you need help resolving property issues, scheduling, or technical faults, open your first ticket above.
          </p>
        </div>
      )}

      {/* New Ticket Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative">
            
            <button
              onClick={() => {
                setIsModalOpen(false);
                setSubject('');
                setMessage('');
              }}
              className="absolute right-4 top-4 text-zinc-400 hover:text-white transition p-2 hover:bg-zinc-800 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1.5">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4" />
                New Support Ticket
              </span>
              <h3 className="text-lg font-bold text-zinc-200">
                Describe your issue
              </h3>
              <p className="text-xs text-zinc-400">
                Select a category and write a summary. Our agents will assist you promptly.
              </p>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">Subject</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Issue booking site visit at Pune project"
                  disabled={loading}
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-cyan-500 transition text-xs placeholder-zinc-650"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">Category</label>
                <select
                  value={category}
                  disabled={loading}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-cyan-500 transition text-xs cursor-pointer"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">Detailed Message</label>
                <textarea
                  required
                  placeholder="Provide complete context. Include property codes or visit timings if relevant."
                  disabled={loading}
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-cyan-500 transition resize-none text-xs placeholder-zinc-650"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-black font-bold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 transition duration-300 disabled:opacity-50 cursor-pointer shadow-lg shadow-indigo-500/10"
              >
                {loading ? 'Creating ticket...' : 'Submit Support Ticket'}
                <ArrowRight className="w-5 h-5 shrink-0" />
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
