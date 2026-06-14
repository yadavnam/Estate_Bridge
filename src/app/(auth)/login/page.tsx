'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { sendOtp, verifyOtp, signInWithPassword } from '@/app/actions/auth';
import { Phone, KeyRound, Mail, Lock, ShieldAlert, ArrowRight, Sparkles, Building2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'client' | 'staff'>('client');
  
  // OTP state
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  
  // Staff state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // UX State
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    // Validate phone number format (simple check)
    if (!phone.startsWith('+')) {
      setErrorMsg('Please include country code, e.g. +91XXXXXXXXXX');
      setLoading(false);
      return;
    }

    const res = await sendOtp(phone, false); // unified login is isSignup = false
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
      setSuccessMsg('Authenticated successfully! Redirecting...');
      // Route user based on role/status
      if (res.role === 'ADMIN') {
        router.push('/admin');
      } else if (res.role === 'DEALER') {
        if (res.status === 'Pending') {
          router.push('/signup/pending');
        } else if (res.status === 'Rejected') {
          router.push('/signup/rejected');
        } else {
          router.push('/dealer');
        }
      } else if (res.role === 'EMPLOYEE') {
        router.push('/employee');
      } else {
        router.push('/customer');
      }
    } else {
      setErrorMsg(res.error || 'OTP verification failed.');
      setLoading(false);
    }
  };

  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const res = await signInWithPassword(email, password);
    if (res.success && res.role) {
      setSuccessMsg('Login successful! Redirecting...');
      if (res.role === 'ADMIN') {
        router.push('/admin');
      } else {
        router.push('/employee');
      }
    } else {
      setErrorMsg(res.error || 'Invalid email or password.');
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMsg(null);
    
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-zinc-950 to-slate-950 flex items-center justify-center p-4 sm:p-6 md:p-8 font-sans antialiased text-white selection:bg-cyan-500 selection:text-black">
      {/* Background Decorative Rings */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Glassmorphic Card Container */}
      <div className="w-full max-w-5xl bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/80 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row relative z-10 min-h-[600px]">
        
        {/* Left Section: Info/Branding */}
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
                Requirement-First <br/>
                <span className="bg-gradient-to-r from-cyan-400 via-teal-400 to-indigo-400 bg-clip-text text-transparent">
                  Real Estate
                </span>
              </h1>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Empowering customers and approved dealers through system-driven direct matches, eliminating arbitrary searches.
              </p>
            </div>
          </div>

          <div className="pt-8 border-t border-zinc-800/50 space-y-4">
            <div className="flex items-center gap-3 text-xs text-zinc-500">
              <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>Strict RLS Tenant Isolation Policies Active</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-zinc-500">
              <KeyRound className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>Secure Encrypted OTP Authentication</span>
            </div>
          </div>
        </div>

        {/* Right Section: Form */}
        <div className="w-full md:w-7/12 p-8 sm:p-12 flex flex-col justify-center bg-zinc-950/30">
          
          {/* Tab Switcher */}
          <div className="flex bg-zinc-900/80 p-1.5 rounded-xl mb-8 border border-zinc-800/60 self-start">
            <button
              onClick={() => {
                setActiveTab('client');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${
                activeTab === 'client'
                  ? 'bg-zinc-800 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Client Login
            </button>
            <button
              onClick={() => {
                setActiveTab('staff');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${
                activeTab === 'staff'
                  ? 'bg-zinc-800 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Staff Portal
            </button>
          </div>

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

          {/* Client Login View (OTP / Google) */}
          {activeTab === 'client' && (
            <div className="space-y-6">
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
                    {loading ? 'Sending Verification...' : 'Send OTP Code'}
                    <ArrowRight className="w-5 h-5" />
                  </button>
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
                    {loading ? 'Verifying Code...' : 'Verify & Sign In'}
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

              {/* Divider */}
              <div className="relative flex py-4 items-center">
                <div className="flex-grow border-t border-zinc-800/80"></div>
                <span className="flex-shrink mx-4 text-zinc-500 text-xs font-bold uppercase tracking-wider">or</span>
                <div className="flex-grow border-t border-zinc-800/80"></div>
              </div>

              {/* Google OAuth Login */}
              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full bg-zinc-900 border border-zinc-800 hover:bg-zinc-800/80 text-white font-bold py-3.5 px-6 rounded-xl flex items-center justify-center gap-3 transition duration-300 disabled:opacity-50 cursor-pointer"
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Sign in with Google (Customer Only)
              </button>

              <div className="text-center pt-4">
                <span className="text-xs text-zinc-500">
                  Are you a dealer looking to partner?{' '}
                  <a href="/signup" className="text-cyan-400 hover:text-cyan-300 font-semibold transition">
                    Self-Register Here
                  </a>
                </span>
              </div>
            </div>
          )}

          {/* Staff Login View (Email / Password) */}
          {activeTab === 'staff' && (
            <form onSubmit={handleStaffLogin} className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                  <input
                    type="email"
                    required
                    disabled={loading}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@estatebridge.com"
                    className="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition duration-300"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                  <input
                    type="password"
                    required
                    disabled={loading}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition duration-300"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-black font-bold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 transition duration-300 shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20 disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Signing In...' : 'Verify Staff Credentials'}
                <ArrowRight className="w-5 h-5" />
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
