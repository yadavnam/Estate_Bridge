import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { signOut } from '@/app/actions/auth';
import { XCircle, Building2, LogOut } from 'lucide-react';

export default async function RejectedPage() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  // Redirect if not authenticated
  if (error || !user) {
    redirect('/login');
  }

  const role = user.app_metadata?.role;
  const status = user.app_metadata?.status;

  // Gate page for Rejected Dealers only
  if (role !== 'DEALER' || status !== 'Rejected') {
    if (status === 'Approved') {
      redirect('/dealer');
    } else if (status === 'Pending') {
      redirect('/signup/pending');
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
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Glassmorphic Panel */}
      <div className="w-full max-w-lg bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/80 rounded-3xl p-8 sm:p-12 shadow-2xl text-center space-y-8 relative z-10">
        
        {/* Animated X Icon */}
        <div className="flex justify-center">
          <div className="p-5 bg-gradient-to-tr from-red-500 to-rose-500 rounded-full shadow-lg shadow-red-500/10 animate-pulse">
            <XCircle className="w-10 h-10 text-black" />
          </div>
        </div>

        {/* Text Details */}
        <div className="space-y-3">
          <div className="flex items-center justify-center gap-2 text-zinc-400">
            <Building2 className="w-4 h-4 text-red-400" />
            <span className="text-xs font-bold uppercase tracking-wider">Onboarding Result</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-red-400">Registration Declined</h1>
          <p className="text-zinc-400 text-sm leading-relaxed max-w-sm mx-auto">
            Unfortunately, your request to register as a partner dealer has been declined. This may be due to verification failure or invalid regulatory credentials. Please contact support for assistance.
          </p>
        </div>

        {/* Buttons */}
        <div className="pt-4 border-t border-zinc-800/50">
          {/* Sign Out Action */}
          <form action={handleSignOutAction}>
            <button
              type="submit"
              className="w-full bg-zinc-900 border border-zinc-850 hover:bg-zinc-800 text-white font-semibold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer"
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
