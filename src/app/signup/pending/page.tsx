import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { signOut } from '@/app/actions/auth';
import { Clock, Building2, LogOut, RefreshCw } from 'lucide-react';

export default async function PendingPage() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  // Redirect if not authenticated
  if (error || !user) {
    redirect('/login');
  }

  const role = user.app_metadata?.role;
  const status = user.app_metadata?.status;

  // Gate page for Pending Dealers only
  if (role !== 'DEALER' || status !== 'Pending') {
    if (status === 'Approved') {
      redirect('/dealer');
    } else if (status === 'Rejected') {
      redirect('/signup/rejected');
    } else {
      redirect('/login');
    }
  }

  const handleSignOutAction = async () => {
    'use server';
    await signOut();
    redirect('/login');
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-zinc-950 to-slate-950 flex items-center justify-center p-4 sm:p-6 md:p-8 font-sans antialiased text-white selection:bg-cyan-500 selection:text-black">
      {/* Background Decorative Rings */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Glassmorphic Panel */}
      <div className="w-full max-w-lg bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/80 rounded-3xl p-8 sm:p-12 shadow-2xl text-center space-y-8 relative z-10">
        
        {/* Animated Clock Icon */}
        <div className="flex justify-center">
          <div className="p-5 bg-gradient-to-tr from-amber-500 to-orange-500 rounded-full shadow-lg shadow-orange-500/10 animate-pulse">
            <Clock className="w-10 h-10 text-black animate-spin-slow" />
          </div>
        </div>

        {/* Text Details */}
        <div className="space-y-3">
          <div className="flex items-center justify-center gap-2 text-zinc-400">
            <Building2 className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold uppercase tracking-wider">Partner Onboarding</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Approval Pending</h1>
          <p className="text-zinc-400 text-sm leading-relaxed max-w-sm mx-auto">
            Your dealer profile has been submitted and is currently undergoing verification. Please check back later or refresh to see if access has been granted.
          </p>
        </div>

        {/* Buttons */}
        <div className="pt-4 space-y-3 border-t border-zinc-800/50">
          {/* Refresh Action */}
          <form action={async () => {
            'use server';
            // Simple form submit will reload the page and fetch the updated user metadata
          }}>
            <button
              type="submit"
              className="w-full bg-zinc-900 border border-zinc-850 hover:bg-zinc-800 text-white font-semibold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              Check Status Update
            </button>
          </form>

          {/* Sign Out Action */}
          <form action={handleSignOutAction}>
            <button
              type="submit"
              className="w-full hover:bg-red-950/20 border border-transparent hover:border-red-900/40 text-zinc-400 hover:text-red-400 font-semibold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              Sign Out Session
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
