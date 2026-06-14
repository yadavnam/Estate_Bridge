'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { sendOtp, verifyOtp } from '@/app/actions/auth';
import { Phone, KeyRound, ShieldAlert, ArrowRight, Sparkles, Building2 } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  
  // OTP state
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  
  // UX State
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!phone.startsWith('+')) {
      setErrorMsg('Please include country code, e.g. +91XXXXXXXXXX');
      setLoading(false);
      return;
    }

    // Pass isSignup = true to check for existing registrations and restrict role to DEALER
    const res = await sendOtp(phone, true);
    if (res.success) {
      setIsOtpSent(true);
      setSuccessMsg('Verification code sent to your mobile number.');
    } else {
      setErrorMsg(res.error || 'Failed to send verification code.');
    }
    setLoading(false);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const res = await verifyOtp(phone, otp);
    if (res.success && res.role) {
      setSuccessMsg('Mobile verified successfully! Loading profile intake...');
      // Once authenticated via signup, they must complete details. Redirect to details.
      router.push('/signup/details');
    } else {
      setErrorMsg(res.error || 'OTP verification failed.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-zinc-950 to-slate-950 flex items-center justify-center p-4 sm:p-6 md:p-8 font-sans antialiased text-white selection:bg-cyan-500 selection:text-black">
      {/* Background Decorative Rings */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Glassmorphic Card Container */}
      <div className="w-full max-w-5xl bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/80 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row relative z-10 min-h-[500px]">
        
        {/* Left Section: Branding */}
        <div className="w-full md:w-5/12 bg-gradient-to-br from-indigo-950/80 via-slate-950/90 to-zinc-950/90 p-8 sm:p-12 flex flex-col justify-between border-b md:border-b-0 md:border-r border-zinc-800/80 relative">
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-tr from-cyan-500 to-indigo-500 rounded-xl shadow-lg shadow-indigo-500/20">
                <Building2 className="w-6 h-6 text-black" />
              </div>
              <span className="font-extrabold text-2xl tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
                Estate Bridge
              </span>
            </div>
            
            <div className="space-y-4 pt-4">
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
                Dealer <br/>
                <span className="bg-gradient-to-r from-cyan-400 via-teal-400 to-indigo-400 bg-clip-text text-transparent">
                  Self-Registration
                </span>
              </h1>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Join our premium partner program. Verify your mobile number to begin filling out your RERA-compliant dealer profile.
              </p>
            </div>
          </div>

          <div className="pt-8 border-t border-zinc-800/50 space-y-4">
            <div className="flex items-center gap-3 text-xs text-zinc-500">
              <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>Verifiable RERA & GST Profile Intake</span>
            </div>
          </div>
        </div>

        {/* Right Section: Form */}
        <div className="w-full md:w-7/12 p-8 sm:p-12 flex flex-col justify-center bg-zinc-950/30">
          
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-cyan-400" />
            Dealer Verification
          </h2>

          {/* Feedback Messages */}
          {errorMsg && (
            <div className="mb-6 p-4 bg-red-950/40 border border-red-800/60 rounded-xl flex items-start gap-3 text-red-300 text-sm animate-fade-in">
              <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="mb-6 p-4 bg-emerald-950/40 border border-emerald-800/60 rounded-xl flex items-start gap-3 text-emerald-300 text-sm animate-fade-in">
              <Sparkles className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {!isOtpSent ? (
            // Send OTP Form
            <form onSubmit={handleSendOtp} className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Mobile Number</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                  <input
                    type="tel"
                    required
                    disabled={loading}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91XXXXXXXXXX"
                    className="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition duration-300"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-black font-bold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 transition duration-300 shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20 disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Sending Code...' : 'Send OTP Verification'}
                <ArrowRight className="w-5 h-5" />
              </button>

              <div className="text-center pt-4">
                <span className="text-xs text-zinc-500">
                  Already registered?{' '}
                  <a href="/login" className="text-cyan-400 hover:text-cyan-300 font-semibold transition">
                    Go to Login
                  </a>
                </span>
              </div>
            </form>
          ) : (
            // Verify OTP Form
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Enter OTP Code</label>
                <div className="relative">
                  <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                  <input
                    type="text"
                    required
                    disabled={loading}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="6-digit code"
                    className="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition duration-300 tracking-widest text-center text-lg font-bold"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-black font-bold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 transition duration-300 shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20 disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Verifying...' : 'Verify Phone Number'}
                <ArrowRight className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsOtpSent(false);
                  setOtp('');
                }}
                className="w-full text-center text-xs text-zinc-400 hover:text-white transition"
              >
                Change phone number
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
