import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { signOut } from '@/app/actions/auth';
import { 
  LayoutDashboard, UserCheck, ShieldAlert, ClipboardList, 
  Handshake, HelpCircle, LogOut, ShieldCheck, Settings, Users, User
} from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Admin Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Customer Directory', href: '/admin/customers', icon: User },
  { label: 'Dealer Approvals', href: '/admin/dealers', icon: UserCheck },
  { label: 'Staff Directory', href: '/admin/employees', icon: Users },
  { label: 'Modifications Desk', href: '/admin/requirements', icon: ClipboardList },
  { label: 'Deals Auditor', href: '/admin/deals', icon: Handshake },
  { label: 'Support Desk', href: '/admin/support', icon: HelpCircle },
  { label: 'Audit Log Console', href: '/admin/audit', icon: ShieldAlert },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  // Guard check
  if (authError || !user || user.app_metadata?.role !== 'ADMIN') {
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
          
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-cyan-500 to-indigo-500 rounded-xl shadow-lg shadow-indigo-500/10">
              <ShieldCheck className="w-5 h-5 text-black" />
            </div>
            <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
              Estate Bridge
            </span>
          </div>

          {/* Admin Profile Card */}
          <div className="bg-zinc-950/50 border border-zinc-850 p-4 rounded-2xl space-y-2 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-xl pointer-events-none" />
            <div className="space-y-0.5">
              <span className="text-[9px] font-bold text-cyan-400 uppercase tracking-widest block">System Console</span>
              <h4 className="font-bold text-xs text-white line-clamp-1">{user.email}</h4>
              <p className="text-[10px] text-zinc-400">Platform Administrator</p>
            </div>
            <div className="pt-2 border-t border-zinc-850/60 flex items-center justify-between text-[10px]">
              <span className="text-zinc-500 font-medium">Clearance</span>
              <span className="font-bold text-cyan-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                Root Admin
              </span>
            </div>
          </div>

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
            System Administration
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
