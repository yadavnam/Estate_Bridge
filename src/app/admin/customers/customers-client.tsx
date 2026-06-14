'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Trash2, Loader2, Mail, Phone, MapPin, Calendar } from 'lucide-react';
import { softDeleteCustomer } from '@/app/actions/admin';

interface CustomersClientProps {
  initialCustomers: any[];
}

export default function CustomersClient({ initialCustomers }: CustomersClientProps) {
  const router = useRouter();
  const [actioningId, setActioningId] = useState<string | null>(null);

  const handleSoftDelete = async (id: string) => {
    if (!confirm('Soft-delete and anonymize this customer? This will redact all PII fields (name, email, phone, city), withdraw all active requirements, cancel active visits, and sign out all their sessions globally. This cannot be undone.')) {
      return;
    }
    setActioningId(id);
    try {
      const response = await softDeleteCustomer(id);
      if (response.success) {
        router.refresh();
      } else {
        alert(response.error || 'Failed to soft delete customer.');
      }
    } catch (err: any) {
      alert(err.message || 'Error occurred.');
    } finally {
      setActioningId(null);
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="font-extrabold text-sm uppercase text-zinc-400 tracking-wider flex items-center gap-2">
        <Users className="w-5 h-5 text-cyan-400" />
        Customer List ({initialCustomers.length})
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {initialCustomers.map((cust) => {
          const isActive = cust.status === 'Active';
          const isActioning = actioningId === cust.customer_id;

          return (
            <div 
              key={cust.customer_id}
              className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 space-y-4 hover:border-zinc-750 transition-all flex flex-col justify-between relative"
            >
              {isActioning && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-xs z-10 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`px-2.5 py-0.5 text-[9px] font-bold rounded uppercase tracking-wider ${
                    isActive 
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-900' 
                      : 'bg-zinc-950 text-zinc-500 border border-zinc-850'
                  }`}>
                    {cust.status}
                  </span>
                  
                  <div className="flex items-center gap-1 text-[10px] text-zinc-500 font-medium">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Registered: {new Date(cust.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <h4 className="font-extrabold text-base text-white">{cust.name}</h4>
                  <div className="space-y-1 pl-1 text-xs text-zinc-400">
                    <p className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-zinc-500" />
                      {cust.email || 'No Email'}
                    </p>
                    <p className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-zinc-500" />
                      {cust.mobile || 'No Phone'}
                    </p>
                    <p className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                      City: {cust.city}
                    </p>
                  </div>
                </div>
              </div>

              {isActive && (
                <div className="pt-4 border-t border-zinc-800/40 flex justify-end">
                  <button
                    onClick={() => handleSoftDelete(cust.customer_id)}
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-red-950/20 hover:bg-red-900/40 border border-red-900/60 text-red-400 font-bold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Soft Delete & Anonymize
                  </button>
                </div>
              )}

              {!isActive && (
                <div className="pt-4 border-t border-zinc-800/40 text-right text-[10px] text-zinc-500 font-medium italic">
                  Profile deactivated and personal identifiers redacted.
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
