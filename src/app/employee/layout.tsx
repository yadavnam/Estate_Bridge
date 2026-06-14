import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { signOut } from '@/app/actions/auth';
import { 
  LayoutDashboard, ClipboardList, Handshake, 
  UserCheck, Clock, LogOut, ShieldCheck, BadgeAlert
} from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/employee', icon: LayoutDashboard },
  { label: 'Requirements Work', href: '/employee/requirements', icon: ClipboardList },
  { label: 'Visits Coordinator', href: '/employee/visits', icon: UserCheck },
  { label: 'Deals Pipeline', href: '/employee/deals', icon: Handshake },
  { label: 'Follow-up Scheduler', href: '/employee/followups', icon: Clock },
];

export default async function EmployeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  // Guard check
  if (authError || !user || user.app_metadata?.role !== 'EMPLOYEE') {
    redirect('/login');
  }

  const status = user.app_metadata?.status;
  if (status !== 'Active') {
    redirect('/login?error=inactive_employee');
  }

  const adminSupabase = createAdminClient();
  const { data: employee } = await adminSupabase
    .from('employees')
    .select('employee_id, name, designation, status')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!employee || employee.status !== 'Active') {
    redirect('/login?error=inactive_employee');
  }

  const handleSignOutAction = async () => {
    'use server';
    await signOut();
    redirect('/login');
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-zinc-950 via-slate-950 to-zinc-950 text-white font-sans antialiased flex flex-col md:flex-row">
      
      {/* Sidebar navigation */}
      <aside className="w-full md:w-64 bg-slate-900/40 backdrop-blur-xl border-b md:border-b-0 md:border-r border-zinc-800/80 p-6 flex flex-col justify-between shrink-0">
        <div className="space-y-8">
          
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-violet-500 to-indigo-500 rounded-xl shadow-lg shadow-indigo-500/10">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
              Estate Bridge
            </span>
          </div>

          {/* Employee Profile Card */}
          {employee && (
            <div className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-2xl space-y-2 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-violet-600/10 rounded-full blur-xl pointer-events-none" />
              <div className="space-y-0.5">
                <span className="text-[9px] font-bold text-violet-400 uppercase tracking-widest block">Internal Staff</span>
                <h4 className="font-bold text-xs text-white line-clamp-1">{employee.name}</h4>
                <p className="text-[10px] text-zinc-400 line-clamp-1">{employee.designation || 'Representative'}</p>
              </div>
              <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between text-[10px]">
                <span className="text-zinc-500 font-medium">Status</span>
                <span className="font-bold text-violet-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Active
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
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-zinc-400 hover:text-white hover:bg-zinc-900/50 hover:border-zinc-800 border border-transparent transition-all duration-300 group"
                >
                  <Icon className="w-5 h-5 group-hover:text-violet-400 transition-colors" />
                  <span>{item.label}</span>
                </a>
              );
            })}
          </nav>
        </div>

        {/* Footer & Sign Out */}
        <div className="pt-6 border-t border-zinc-800/80 mt-6 space-y-4">
          <div className="px-4 text-xs text-zinc-500 font-medium">
            Authorized Personnel
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
