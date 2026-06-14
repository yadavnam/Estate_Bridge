'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { addCoverageArea, deleteCoverageArea } from '@/app/actions/dealer';
import { MapPin, Plus, Trash2, ShieldAlert, Sparkles } from 'lucide-react';

interface CoverageArea {
  coverage_id: string;
  state: string;
  city: string;
  area: string;
}

export default function CoverageClient({ coverage }: { coverage: CoverageArea[] }) {
  const router = useRouter();

  // Form State
  const [state, setState] = useState('Maharashtra');
  const [city, setCity] = useState('');
  const [area, setArea] = useState('');

  // UX State
  const [loading, setLoading] = useState<string | null>(null); // tracks active load operation ('add' or coverage_id)
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!city.trim() || !area.trim()) return;

    setLoading('add');
    setErrorMsg(null);
    setSuccessMsg(null);

    const res = await addCoverageArea({
      state: state.trim(),
      city: city.trim(),
      area: area.trim(),
    });

    if (res.success) {
      setSuccessMsg(`Serviced area '${area}, ${city}' added successfully!`);
      setCity('');
      setArea('');
      router.refresh();
    } else {
      setErrorMsg(res.error || 'Failed to add coverage area.');
    }
    setLoading(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this coverage area? Your listings in this locality might not match future searches.')) {
      return;
    }

    setLoading(id);
    setErrorMsg(null);
    setSuccessMsg(null);

    const res = await deleteCoverageArea(id);
    if (res.success) {
      setSuccessMsg('Serviced area removed successfully.');
      router.refresh();
    } else {
      setErrorMsg(res.error || 'Failed to delete coverage area.');
    }
    setLoading(null);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      {/* Add Coverage Form */}
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-3xl p-6 sm:p-8 backdrop-blur-xl h-fit space-y-6 shadow-xl">
        <div className="space-y-1">
          <h3 className="font-bold text-white text-lg flex items-center gap-2">
            <Plus className="w-5 h-5 text-cyan-400" />
            Add Locality
          </h3>
          <p className="text-zinc-500 text-xs">Register new zones your broker agency supports to run compatible matching checks.</p>
        </div>

        {/* Messaging */}
        {errorMsg && (
          <div className="p-4 bg-red-950/40 border border-red-800/60 rounded-xl flex items-start gap-3 text-red-300 text-xs">
            <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="p-4 bg-emerald-950/40 border border-emerald-800/60 rounded-xl flex items-start gap-3 text-emerald-300 text-xs">
            <Sparkles className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleAdd} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">State</label>
            <input
              type="text"
              required
              disabled={loading !== null}
              value={state}
              onChange={(e) => setState(e.target.value)}
              placeholder="e.g. Maharashtra"
              className="w-full bg-zinc-950 border border-zinc-850 rounded-xl py-3 px-4 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500 transition"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">City</label>
            <input
              type="text"
              required
              disabled={loading !== null}
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Pune"
              className="w-full bg-zinc-950 border border-zinc-850 rounded-xl py-3 px-4 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500 transition"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">Area / Locality</label>
            <input
              type="text"
              required
              disabled={loading !== null}
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="e.g. Baner"
              className="w-full bg-zinc-950 border border-zinc-850 rounded-xl py-3 px-4 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500 transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading !== null}
            className="w-full bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-black font-bold py-3.5 px-6 rounded-xl flex items-center justify-center gap-1.5 transition text-xs shadow-lg shadow-indigo-500/10 disabled:opacity-50 cursor-pointer"
          >
            {loading === 'add' ? 'Registering Area...' : 'Register Area'}
          </button>
        </form>
      </div>

      {/* Serviced Locations List */}
      <div className="lg:col-span-2 bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-6 sm:p-8 backdrop-blur-xl space-y-6 shadow-xl">
        <h3 className="font-bold text-white text-lg flex items-center gap-2 border-b border-zinc-850 pb-4">
          <MapPin className="w-5 h-5 text-indigo-400" />
          Serviced Locations Directory
        </h3>

        {coverage.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {coverage.map((loc) => (
              <div 
                key={loc.coverage_id} 
                className="bg-zinc-950/40 border border-zinc-850 p-4 rounded-2xl flex items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">{loc.state}</span>
                  <p className="font-bold text-white text-sm">{loc.area}</p>
                  <p className="text-xs text-zinc-400">{loc.city}</p>
                </div>
                <button
                  onClick={() => handleDelete(loc.coverage_id)}
                  disabled={loading !== null}
                  className="text-zinc-500 hover:text-red-400 p-2.5 hover:bg-red-950/15 rounded-xl border border-transparent hover:border-red-900/20 transition cursor-pointer disabled:opacity-40"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 border border-dashed border-zinc-850 rounded-2xl text-xs text-zinc-500">
            No coverage areas registered yet. Add territories on the left to start receiving matching requests.
          </div>
        )}
      </div>

    </div>
  );
}
