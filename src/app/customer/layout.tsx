import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { signOut } from '@/app/actions/auth';
import { 
  LayoutDashboard, ClipboardList, Building2, MapPin, 
  Handshake, HelpCircle, LogOut 
} from 'lucide-react';

// Sidebar navigation items
const NAV_ITEMS = [
  { label: 'Dashboard', href: '/customer', icon: LayoutDashboard },
  { label: 'Requirements', href: '/customer/requirements', icon: ClipboardList },
  { label: 'Registered Sites', href: '/customer/sites', icon: MapPin },
  { label: 'Visits Tracker', href: '/customer/visits', icon: Building2 },
  { label: 'Deals Engine', href: '/customer/deals', icon: Handshake },
  { label: 'Support Centre', href: '/customer/support', icon: HelpCircle },
];

export default async function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  // double guard check (handled primarily by middleware)
  if (authError || !user || user.app_metadata?.role !== 'CUSTOMER') {
    redirect('/login');
  }

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
          {/* Logo / Title */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-cyan-500 to-indigo-500 rounded-xl shadow-lg shadow-indigo-500/10">
              <Building2 className="w-5 h-5 text-black" />
            </div>
            <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
              Estate Bridge
            </span>
          </div>

          {/* Navigation links */}
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

        {/* Footer info & Sign Out */}
        <div className="pt-6 border-t border-zinc-850 mt-6 space-y-4">
          <div className="px-4 text-xs text-zinc-500 font-medium">
            Logged in as Customer
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
