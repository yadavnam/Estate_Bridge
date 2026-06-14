'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { HelpCircle, AlertTriangle, Send, CheckCircle2, Clock, User, Mail, MessageSquare, Loader2 } from 'lucide-react';
import { addSupportTicketMessageAdmin, closeSupportTicketAdmin } from '@/app/actions/admin';

interface SupportDeskClientProps {
  initialTickets: any[];
}

export default function SupportDeskClient({ initialTickets }: SupportDeskClientProps) {
  const router = useRouter();

  const [activeTicketId, setActiveTicketId] = useState<string | null>(
    initialTickets.length > 0 ? initialTickets[0].ticket_id : null
  );
  const [replyText, setReplyText] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [closingTicket, setClosingTicket] = useState(false);

  const activeTicket = initialTickets.find(t => t.ticket_id === activeTicketId);
  const now = Date.now();

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !activeTicketId) return;

    setSendingMessage(true);
    try {
      const response = await addSupportTicketMessageAdmin(activeTicketId, replyText);
      if (response.success) {
        setReplyText('');
        router.refresh();
      } else {
        alert(response.error || 'Failed to send message.');
      }
    } catch (err: any) {
      alert(err.message || 'Error occurred.');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleCloseTicket = async () => {
    if (!activeTicketId) return;
    setClosingTicket(true);
    try {
      const response = await closeSupportTicketAdmin(activeTicketId);
      if (response.success) {
        router.refresh();
      } else {
        alert(response.error || 'Failed to close ticket.');
      }
    } catch (err: any) {
      alert(err.message || 'Error occurred.');
    } finally {
      setClosingTicket(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 bg-zinc-900/20 border border-zinc-800 rounded-3xl p-6 min-h-[550px]">
      
      {/* Tickets List Column */}
      <div className="space-y-4 md:border-r md:border-zinc-800 md:pr-6">
        <h3 className="text-sm font-bold uppercase text-zinc-500 tracking-wider">Support Cases</h3>
        
        <div className="space-y-3 overflow-y-auto max-h-[460px]">
          {initialTickets.length > 0 ? (
            initialDeconstructedTickets(initialTickets, now, activeTicketId, setActiveTicketId)
          ) : (
            <div className="text-center p-8 text-zinc-650 text-xs">
              No support tickets filed.
            </div>
          )}
        </div>
      </div>

      {/* Ticket Details/Chat Area */}
      <div className="md:col-span-2 flex flex-col justify-between h-[480px]">
        {activeTicket ? (
          <div className="flex flex-col justify-between h-full space-y-4">
            
            {/* Header */}
            <div className="border-b border-zinc-850 pb-3 flex justify-between items-center">
              <div className="space-y-0.5">
                <span className="text-[9px] bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded font-bold uppercase">
                  {activeTicket.status}
                </span>
                <h4 className="font-extrabold text-sm text-white line-clamp-1">
                  {activeTicket.title}
                </h4>
                <p className="text-[10px] text-zinc-400">
                  Customer: {activeTicket.customer?.name} ({activeTicket.customer?.email})
                </p>
              </div>

              {activeTicket.status === 'Open' && (
                <button
                  onClick={handleCloseTicket}
                  disabled={closingTicket}
                  className="px-3.5 py-1.5 bg-zinc-850 hover:bg-emerald-650 hover:text-white text-zinc-300 font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Mark Resolved
                </button>
              )}
            </div>

            {/* Chat Thread */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-zinc-800">
              <div className="p-3.5 bg-zinc-950/40 border border-zinc-850 rounded-2xl space-y-1">
                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-zinc-500" />
                  Customer Ticket Description:
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed font-medium">
                  {activeTicket.description}
                </p>
              </div>

              {activeTicket.support_messages && activeTicket.support_messages.length > 0 ? (
                activeTicket.support_messages
                  .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                  .map((msg: any) => {
                    const isAdminMsg = msg.sender_id !== activeTicket.customer?.user_id; // Check if sender is employee/admin
                    return (
                      <div 
                        key={msg.message_id}
                        className={`flex flex-col max-w-[80%] rounded-2xl p-3.5 space-y-1 ${
                          isAdminMsg 
                            ? 'ml-auto bg-violet-950/20 border border-violet-900/30 text-white' 
                            : 'bg-zinc-900/40 border border-zinc-800 text-zinc-300'
                        }`}
                      >
                        <p className="text-xs leading-relaxed">{msg.message_text}</p>
                        <span className="text-[9px] text-zinc-550 self-end text-zinc-500">
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    );
                  })
              ) : (
                <div className="text-center text-zinc-650 text-xs italic py-4">
                  No responses logged in thread.
                </div>
              )}
            </div>

            {/* Reply Input Form */}
            {activeTicket.status === 'Open' ? (
              <form onSubmit={handleSendMessage} className="flex gap-2 border-t border-zinc-850 pt-3">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={2}
                  className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500 resize-none"
                  placeholder="Type your administrator response here..."
                  required
                />
                <button
                  type="submit"
                  disabled={sendingMessage || !replyText.trim()}
                  className="px-4 bg-violet-650 bg-violet-650 bg-violet-600 hover:bg-violet-750 text-white rounded-xl disabled:opacity-50 transition-colors flex items-center justify-center cursor-pointer"
                >
                  {sendingMessage ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </form>
            ) : (
              <div className="p-3 bg-zinc-950 border border-zinc-850 rounded-xl text-xs text-zinc-500 text-center font-bold">
                This support ticket has been closed.
              </div>
            )}

          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-zinc-600 text-sm">
            Select a ticket from the left panel to begin replying.
          </div>
        )}
      </div>

    </div>
  );
}

function initialDeconstructedTickets(
  tickets: any[],
  now: number,
  activeTicketId: string | null,
  setActiveTicketId: (id: string) => void
) {
  return tickets.map((t) => {
    const isSelected = activeTicketId === t.ticket_id;
    const isClosed = t.status === 'Closed';
    
    // SLA Breach Calculation: Open ticket, unreplied for > 24 hours
    const createdTime = new Date(t.created_at).getTime();
    const ageHours = (now - createdTime) / (1000 * 60 * 60);
    const isSlabreach = !isClosed && ageHours > 24;

    let borderHighlight = isSelected ? 'border-violet-600' : 'border-zinc-800';
    let bgHighlight = isSelected ? 'bg-zinc-800/40' : 'bg-zinc-950/20';

    if (isSlabreach) {
      borderHighlight = isSelected ? 'border-red-500' : 'border-red-950';
      bgHighlight = isSelected ? 'bg-red-950/20' : 'bg-red-955/5 bg-red-950/5';
    }

    return (
      <div
        key={t.ticket_id}
        onClick={() => setActiveTicketId(t.ticket_id)}
        className={`p-3.5 border rounded-xl cursor-pointer hover:border-zinc-700 transition-all space-y-2 ${borderHighlight} ${bgHighlight}`}
      >
        <div className="flex justify-between items-start gap-2">
          <span className={`px-2 py-0.5 text-[8px] font-bold rounded uppercase ${
            isClosed ? 'bg-zinc-800 text-zinc-400' : 'bg-violet-950 text-violet-400 border border-violet-900'
          }`}>
            {t.status}
          </span>
          {isSlabreach && (
            <span className="text-[8px] text-red-500 font-bold flex items-center gap-0.5 animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5" />
              SLA Breach
            </span>
          )}
        </div>
        
        <h4 className={`font-bold text-xs truncate ${isSlabreach ? 'text-red-500 font-black' : 'text-white'}`}>
          {t.title}
        </h4>
        
        <div className="flex justify-between items-center text-[10px] text-zinc-500">
          <span>Client: {t.customer?.name}</span>
          <span>{new Date(t.created_at).toLocaleDateString()}</span>
        </div>
      </div>
    );
  });
}
