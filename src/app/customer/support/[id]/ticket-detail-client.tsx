'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { sendSupportMessage, closeSupportTicket } from '@/app/actions/customer';
import { 
  Send, HelpCircle, ShieldCheck, ShieldAlert, 
  Lock, CheckCircle2, AlertCircle, Sparkles, MessageSquare
} from 'lucide-react';

interface Message {
  message_id: string;
  sender_id: string;
  sender_role: string;
  message: string;
  created_at: string;
  designation: string;
}

interface Ticket {
  ticket_id: string;
  subject: string;
  category: string;
  status: string;
  created_at: string;
}

export default function TicketDetailClient({
  ticket,
  initialMessages,
  currentUserId,
}: {
  ticket: Ticket;
  initialMessages: Message[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [closeLoading, setCloseLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Message Box State
  const [text, setText] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom helper
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [initialMessages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const res = await sendSupportMessage({
      ticketId: ticket.ticket_id,
      message: text.trim(),
    });

    if (res.success) {
      setText('');
      router.refresh();
    } else {
      setErrorMsg(res.error || 'Failed to send message.');
    }
    setLoading(false);
  };

  const handleCloseTicket = async () => {
    if (!confirm('Are you sure you want to close this ticket? It will be marked as resolved.')) {
      return;
    }

    setCloseLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const res = await closeSupportTicket(ticket.ticket_id);
    if (res.success) {
      setSuccessMsg('Ticket closed successfully.');
      router.refresh();
    } else {
      setErrorMsg(res.error || 'Failed to close ticket.');
    }
    setCloseLoading(false);
  };

  const isClosed = ticket.status === 'Closed';

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
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

      {/* Ticket Header Gated Controls */}
      <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-6 backdrop-blur-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xl">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-zinc-950 border border-zinc-850 rounded-lg text-[9px] font-bold text-zinc-400 uppercase tracking-wider">
              {ticket.category}
            </span>
            <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
              isClosed 
                ? 'bg-zinc-800 text-zinc-400 border border-zinc-700/65' 
                : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/35'
            }`}>
              {ticket.status}
            </span>
          </div>
          <h1 className="text-xl font-extrabold text-white">{ticket.subject}</h1>
          <p className="text-[10px] text-zinc-550 text-zinc-500">
            Created on {new Date(ticket.created_at).toLocaleString()}
          </p>
        </div>

        {!isClosed && (
          <button
            onClick={handleCloseTicket}
            disabled={closeLoading}
            className="w-full md:w-auto bg-zinc-950 hover:bg-zinc-900 text-red-400 hover:text-red-350 border border-zinc-850 hover:border-red-950/50 font-bold py-3 px-5 rounded-xl text-xs transition cursor-pointer disabled:opacity-50"
          >
            {closeLoading ? 'Closing Ticket...' : 'Mark as Resolved / Close'}
          </button>
        )}
      </div>

      {/* Chat Messages Body */}
      <div className="bg-zinc-900/40 border border-zinc-850 rounded-3xl backdrop-blur-xl shadow-xl overflow-hidden flex flex-col h-[500px]">
        
        {/* Messages list */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {initialMessages.length > 0 ? (
            initialMessages.map((msg) => {
              const isMine = msg.sender_role === 'CUSTOMER';
              return (
                <div 
                  key={msg.message_id} 
                  className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[75%] rounded-2xl p-4 space-y-1.5 shadow-md ${
                    isMine 
                      ? 'bg-gradient-to-tr from-cyan-600/30 to-indigo-600/30 border border-cyan-800/40 text-zinc-100 rounded-tr-none' 
                      : 'bg-zinc-950 border border-zinc-850 text-zinc-200 rounded-tl-none'
                  }`}>
                    {/* Sender designation/info */}
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] font-bold uppercase tracking-wider ${
                        isMine ? 'text-cyan-400' : 'text-indigo-400'
                      }`}>
                        {isMine ? 'You' : msg.designation}
                      </span>
                      <span className="text-[9px] text-zinc-550 text-zinc-500">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <p className="text-xs leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-20 text-zinc-550 text-xs italic">
              No messages inside this ticket.
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-zinc-950/40 border-t border-zinc-850/60">
          {!isClosed ? (
            <form onSubmit={handleSend} className="flex gap-2">
              <input
                type="text"
                required
                disabled={loading}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type your reply to the support staff..."
                className="flex-1 bg-zinc-950 border border-zinc-850 rounded-xl py-3 px-4 text-xs text-white focus:outline-none focus:border-cyan-500 transition placeholder-zinc-650"
              />
              <button
                type="submit"
                disabled={loading || !text.trim()}
                className="bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-black font-bold p-3 px-5 rounded-xl transition flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <Send className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline text-xs">Send</span>
              </button>
            </form>
          ) : (
            <div className="py-2.5 px-4 bg-zinc-950 border border-zinc-850 rounded-xl flex items-center justify-center gap-2 text-xs text-zinc-500 font-semibold">
              <Lock className="w-4 h-4 text-zinc-500" />
              <span>This support ticket is closed. If your problem persists, please raise a new ticket.</span>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
