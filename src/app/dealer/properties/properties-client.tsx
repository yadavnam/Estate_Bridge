'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updatePropertyStatus, softDeleteProperty } from '@/app/actions/dealer';
import { 
  Building2, Plus, Trash2, ShieldAlert, Sparkles, MapPin, 
  Lock, Eye, ChevronDown, CheckCircle2, AlertCircle 
} from 'lucide-react';

interface Property {
  property_id: string;
  title: string;
  property_type: string;
  price: number;
  city: string;
  area: string;
  locality: string;
  area_size: number;
  bhk: string;
  facing: string;
  status: 'Active' | 'Inactive' | 'Sold';
  visits: { visit_id: string; status: string }[];
  deals: { deal_id: string; current_stage: string }[];
}

export default function PropertiesClient({ properties }: { properties: Property[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null); // tracks active operation property_id
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleStatusChange = async (id: string, currentStatus: string, newStatus: 'Active' | 'Inactive' | 'Sold') => {
    if (currentStatus === newStatus) return;

    setLoading(id);
    setErrorMsg(null);
    setSuccessMsg(null);

    const res = await updatePropertyStatus(id, newStatus);
    if (res.success) {
      setSuccessMsg('Property status updated successfully.');
      router.refresh();
    } else {
      setErrorMsg(res.error || 'Failed to update property status.');
    }
    setLoading(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this property? It will be archived and removed from match directories.')) {
      return;
    }

    setLoading(id);
    setErrorMsg(null);
    setSuccessMsg(null);

    const res = await softDeleteProperty(id);
    if (res.success) {
      setSuccessMsg('Property listing deleted successfully.');
      router.refresh();
    } else {
      setErrorMsg(res.error || 'Failed to delete property.');
    }
    setLoading(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/25';
      case 'Sold':
        return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25';
      default:
        return 'bg-zinc-800 text-zinc-400 border border-zinc-700/60';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Property Bank</h1>
          <p className="text-zinc-400 text-sm">Add and modify listings, monitor compatibility matching, and manage RERA license bindings.</p>
        </div>

        <a
          href="/dealer/properties/new"
          className="bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-black font-bold py-3 px-6 rounded-xl flex items-center gap-2 transition shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20 cursor-pointer text-sm"
        >
          <Plus className="w-5 h-5 shrink-0" />
          Add New Property
        </a>
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

      {/* Properties list */}
      {properties.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {properties.map((prop) => {
            const activeVisits = prop.visits?.filter(v => 
              ['Requested', 'Under Review', 'Approved', 'Scheduled', 'Rescheduled', 'Postponed'].includes(v.status)
            ) || [];
            
            const activeDeals = prop.deals?.filter(d => 
              ['Interested', 'Negotiation', 'Token Paid', 'Documentation', 'Registration'].includes(d.current_stage)
            ) || [];

            const isLocked = activeVisits.length > 0 || activeDeals.length > 0;

            return (
              <div 
                key={prop.property_id}
                className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl overflow-hidden backdrop-blur-xl hover:border-zinc-700/80 transition-all duration-300 flex flex-col justify-between"
              >
                
                {/* Body Specs */}
                <div className="p-6 sm:p-8 space-y-5">
                  <div className="flex justify-between items-start gap-3">
                    <div className="space-y-0.5">
                      <span className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-500 block">
                        {prop.property_type} • {prop.bhk} BHK • {prop.facing} Facing
                      </span>
                      <h3 className="font-bold text-white text-base line-clamp-1">{prop.title}</h3>
                    </div>

                    <div className="flex items-center gap-2">
                      {isLocked && (
                        <span className="p-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-lg shrink-0" title="Locked: Linked to active deals/visits">
                          <Lock className="w-3.5 h-3.5" />
                        </span>
                      )}
                      <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold uppercase ${getStatusBadge(prop.status)}`}>
                        {prop.status}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 bg-zinc-950/40 border border-zinc-850 p-4 rounded-2xl text-xs">
                    <div className="space-y-0.5">
                      <span className="text-zinc-500 font-semibold block text-[9px] uppercase tracking-wider">Price</span>
                      <span className="text-white font-extrabold text-sm">₹{Number(prop.price).toLocaleString()}</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-zinc-500 font-semibold block text-[9px] uppercase tracking-wider">Area Size</span>
                      <span className="text-white font-extrabold text-sm">{prop.area_size} sq. ft.</span>
                    </div>
                  </div>

                  <div className="text-xs text-zinc-400 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-zinc-500 shrink-0" />
                    <span>{prop.locality}, {prop.area}, {prop.city}</span>
                  </div>

                  {isLocked && (
                    <div className="p-3 bg-amber-950/25 border border-amber-900/30 rounded-xl flex items-start gap-2 text-[10px] text-amber-400/90 leading-normal">
                      <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                      <span>Property protection lock is active. Deactivation or deletion is blocked due to ongoing visits ({activeVisits.length}) or deal flows ({activeDeals.length}).</span>
                    </div>
                  )}
                </div>

                {/* Footer Controls */}
                <div className="p-6 pt-0 border-t border-zinc-850/40 flex items-center justify-between gap-3 mt-4">
                  
                  {/* Status Dropdown (Gated by Lock) */}
                  <div className="relative">
                    <select
                      disabled={loading === prop.property_id || isLocked}
                      value={prop.status}
                      onChange={(e) => handleStatusChange(prop.property_id, prop.status, e.target.value as any)}
                      className="bg-zinc-950 border border-zinc-850 text-xs font-bold py-2 px-3 pr-8 rounded-xl appearance-none cursor-pointer focus:outline-none focus:border-cyan-500 transition disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <option value="Active">Set Active</option>
                      <option value="Inactive">Set Inactive</option>
                      <option value="Sold">Mark Sold</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <a
                      href={`/dealer/properties/${prop.property_id}`}
                      className="bg-zinc-950 border border-zinc-855 hover:bg-zinc-900 text-zinc-300 hover:text-white p-2.5 rounded-xl transition cursor-pointer"
                    >
                      <Eye className="w-4.5 h-4.5" />
                    </a>
                    
                    <button
                      onClick={() => handleDelete(prop.property_id)}
                      disabled={loading === prop.property_id || isLocked}
                      className="text-zinc-550 hover:text-red-400 p-2.5 bg-zinc-950 border border-zinc-855 hover:border-red-950/20 hover:bg-red-955/10 rounded-xl transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="w-4.5 h-4.5" />
                    </button>
                  </div>

                </div>

              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-zinc-900/10 border border-dashed border-zinc-850 rounded-3xl space-y-4">
          <Building2 className="w-12 h-12 text-zinc-650 mx-auto" />
          <h3 className="font-bold text-lg text-zinc-300">No listed properties</h3>
          <p className="text-zinc-500 text-sm max-w-sm mx-auto">
            Get started by adding properties to your platform property bank to participate in customer matches.
          </p>
          <a
            href="/dealer/properties/new"
            className="inline-flex bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-black font-bold py-3 px-6 rounded-xl items-center gap-1.5 transition text-xs shadow-lg shadow-indigo-500/10"
          >
            Add Your First Property
          </a>
        </div>
      )}
    </div>
  );
}
