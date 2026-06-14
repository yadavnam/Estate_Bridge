'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { submitDealerProfile } from '@/app/actions/auth';
import { Building2, User, MapPin, Award, FileText, ArrowRight, ShieldAlert, Sparkles } from 'lucide-react';

export default function DealerDetailsForm() {
  const router = useRouter();
  
  // Form State
  const [companyName, setCompanyName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [address, setAddress] = useState('');
  const [reraNumber, setReraNumber] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [experienceYears, setExperienceYears] = useState<number>(0);
  
  // UX State
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    if (experienceYears < 0) {
      setErrorMsg('Years of experience cannot be negative.');
      setLoading(false);
      return;
    }

    const res = await submitDealerProfile({
      companyName,
      ownerName,
      address,
      reraNumber: reraNumber || undefined,
      gstNumber: gstNumber || undefined,
      experienceYears,
    });

    if (res.success) {
      router.push('/signup/pending');
    } else {
      setErrorMsg(res.error || 'Failed to submit dealer profile.');
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/80 rounded-3xl p-8 sm:p-12 shadow-2xl relative z-10 font-sans text-white">
      {/* Header */}
      <div className="space-y-3 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-tr from-cyan-500 to-indigo-500 rounded-xl">
            <Building2 className="w-6 h-6 text-black" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">Step 2 of 2</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Complete Partner Profile</h1>
        <p className="text-zinc-400 text-sm">
          Please provide your company details. These details will be verified by our administrative team before dashboard access is granted.
        </p>
      </div>

      {/* Error Alerts */}
      {errorMsg && (
        <div className="mb-6 p-4 bg-red-950/40 border border-red-800/60 rounded-xl flex items-start gap-3 text-red-300 text-sm">
          <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Details Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Company Name */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Company Name</label>
            <div className="relative">
              <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input
                type="text"
                required
                disabled={loading}
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Apex Realty"
                className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl py-3 pl-12 pr-4 text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500 transition"
              />
            </div>
          </div>

          {/* Owner Name */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Owner Name</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input
                type="text"
                required
                disabled={loading}
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="e.g. John Doe"
                className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl py-3 pl-12 pr-4 text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500 transition"
              />
            </div>
          </div>
        </div>

        {/* Office Address */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Office Address</label>
          <div className="relative">
            <MapPin className="absolute left-4 top-4 w-5 h-5 text-zinc-500" />
            <textarea
              required
              disabled={loading}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter full office or registered address"
              rows={3}
              className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl py-3 pl-12 pr-4 text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500 transition resize-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* RERA Number */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">RERA License Number</label>
            <div className="relative">
              <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input
                type="text"
                disabled={loading}
                value={reraNumber}
                onChange={(e) => setReraNumber(e.target.value)}
                placeholder="e.g. RERA-12345-XY"
                className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl py-3 pl-12 pr-4 text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500 transition"
              />
            </div>
          </div>

          {/* GST Number */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">GSTIN (Optional)</label>
            <div className="relative">
              <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input
                type="text"
                disabled={loading}
                value={gstNumber}
                onChange={(e) => setGstNumber(e.target.value)}
                placeholder="22AAAAA0000A1Z5"
                className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl py-3 pl-12 pr-4 text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500 transition"
              />
            </div>
          </div>
        </div>

        {/* Experience Years */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Years of Real Estate Experience</label>
          <div className="relative">
            <Award className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <input
              type="number"
              required
              min={0}
              disabled={loading}
              value={experienceYears || ''}
              onChange={(e) => setExperienceYears(parseInt(e.target.value) || 0)}
              placeholder="e.g. 5"
              className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl py-3 pl-12 pr-4 text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500 transition"
            />
          </div>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-black font-bold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 transition duration-300 shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20 disabled:opacity-50 cursor-pointer"
        >
          {loading ? 'Submitting Details...' : 'Submit Profile for Approval'}
          <ArrowRight className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}
