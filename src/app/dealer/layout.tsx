import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { signOut } from '@/app/actions/auth';
import { 
  LayoutDashboard, ClipboardList, Building2, MapPin, 
  Handshake, HelpCircle, LogOut, ShieldAlert, Sparkles, UserCheck 
} from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dealer', icon: LayoutDashboard },
  { label: 'Property Bank', href: '/dealer/properties', icon: Building2 },
  { label: 'Coverage Areas', href: '/dealer/coverage', icon: MapPin },
  { label: 'Match Marketplace', href: '/dealer/marketplace', icon: ClipboardList },
  { label: 'Visits Coordinator', href: '/dealer/visits', icon: UserCheck },
  { label: 'Deals Pipeline', href: '/dealer/deals', icon: Handshake },
];

export default async function DealerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  // Guard check (handled primarily by middleware)
  if (authError || !user || user.app_metadata?.role !== 'DEALER') {
    redirect('/login');
  }

  const status = user.app_metadata?.status;
  if (status !== 'Approved') {
    redirect('/login?error=not_approved');
  }

  const adminSupabase = createAdminClient();
  const { data: dealer } = await adminSupabase
    .from('dealers')
    .select('company_name, owner_name, trust_score')
    .eq('user_id', user.id)
    .maybeSingle();

  const handleSignOutAction = async () => {
    'use server';
    await signOut();
    redirect('/login');
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-950 via-zinc-950 to-zinc-950 text-white font-sans antialiased flex flex-col md:flex-row">
      
      {/* Sidebar navigation */}
      <aside className="w-full md:w-64 bg-zinc-900/60 backdrop-blur-xl border-b md:border-b-0 md:border-r border-zinc-800/80 p-6 flex flex-col justify-between shrink-0">
        <div className="space-y-8">
          
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-cyan-500 to-indigo-500 rounded-xl shadow-lg shadow-indigo-500/10">
              <Building2 className="w-5 h-5 text-black" />
            </div>
            <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
              Estate Bridge
            </span>
          </div>

          {/* Dealer Info Card */}
          {dealer && (
            <div className="bg-zinc-950/50 border border-zinc-850 p-4 rounded-2xl space-y-2">
              <div className="space-y-0.5">
                <span className="text-[9px] font-bold text-zinc-550 uppercase tracking-widest block text-cyan-400">Partner Account</span>
                <h4 className="font-bold text-xs text-white line-clamp-1">{dealer.company_name}</h4>
                <p className="text-[10px] text-zinc-400 line-clamp-1">{dealer.owner_name}</p>
              </div>
              <div className="pt-2 border-t border-zinc-850/60 flex items-center justify-between text-[10px]">
                <span className="text-zinc-550 text-zinc-500 font-medium">Trust Score</span>
                <span className="font-bold text-emerald-400 flex items-center gap-0.5">
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                  {dealer.trust_score}%
                </span>
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-all duration-300 group"
                >
                  <Icon className="w-5 h-5 group-hover:text-cyan-400 transition-colors" />
                  <span>{item.label}</span>
                </a>
              );
            })}
          </nav>
        </div>

        {/* Footer & Sign Out */}
        <div className="pt-6 border-t border-zinc-855 mt-6 space-y-4">
          <div className="px-4 text-xs text-zinc-500 font-medium">
            Logged in as Partner
          </div>
          
          <form action={handleSignOutAction}>
            <button
              type="submit"
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-zinc-400 hover:text-red-400 hover:bg-red-950/10 transition-all duration-300 cursor-pointer"
            >
              <LogOut className="w-5 h-5" />
              <span>Log Out Session</span>
            </button>
          </form>
        </div>
      </aside>

      {/* Main page content area */}
      <main className="flex-1 p-6 sm:p-8 md:p-10 max-h-screen overflow-y-auto relative z-10">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
