import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { 
  ClipboardList, UserCheck, Clock, AlertTriangle, 
  ArrowRight, Phone, MessageSquare, Plus, CheckCircle, HelpCircle
} from 'lucide-react';

export default async function EmployeeDashboard() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return (
      <div className="p-8 text-red-500 font-bold bg-red-950/20 border border-red-900 rounded-2xl">
        Unauthorized access. Please log in.
      </div>
    );
  }

  const adminSupabase = createAdminClient();
  
  // Fetch Employee ID
  const { data: employee } = await adminSupabase
    .from('employees')
    .select('employee_id, name')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!employee) {
    return (
      <div className="p-8 text-red-500 font-bold bg-red-950/20 border border-red-900 rounded-2xl">
        Employee profile not found.
      </div>
    );
  }

  const employeeId = employee.employee_id;

  // 1. Fetch Active Assignments
  const { data: assignments } = await adminSupabase
    .from('requirement_employee_assignments')
    .select(`
      assignment_id,
      is_lead,
      requirement:requirement_id (
        requirement_id,
        budget_min,
        budget_max,
        property_type,
        city,
        area,
        customer:customer_id (
          name
        )
      )
    `)
    .eq('employee_id', employeeId)
    .eq('status', 'Active');

  const activeRequirementsCount = assignments?.length || 0;

  // 2. Fetch Assigned Visits
  const { data: visitAssignments } = await adminSupabase
    .from('visit_employees')
    .select(`
      visit_id,
      visits:visit_id (
        visit_id,
        visit_date,
        visit_time,
        status,
        customer:customer_id (
          name
        )
      )
    `)
    .eq('employee_id', employeeId);

  // Extract scheduled visits
  const scheduledVisits = visitAssignments
    ?.map((va: any) => va.visits)
    ?.filter((v: any) => v && v.status === 'Scheduled') || [];
  
  const upcomingVisitsCount = scheduledVisits.length;

  // 3. Fetch Follow-ups
  const { data: followUps } = await adminSupabase
    .from('follow_ups')
    .select(`
      followup_id,
      next_followup_date,
      notes,
      status,
      customer:customer_id (
        name
      ),
      requirement:requirement_id (
        requirement_id,
        property_type
      )
    `)
    .eq('employee_id', employeeId);

  const pendingFollowUps = followUps?.filter(f => f.status === 'Pending') || [];
  const missedFollowUps = followUps?.filter(f => f.status === 'Missed') || [];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-zinc-900 via-slate-900 to-zinc-900 p-8 rounded-3xl border border-zinc-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-2 relative z-10">
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
            Welcome back, {employee.name}
          </h1>
          <p className="text-zinc-400 text-sm max-w-xl">
            Manage assignments, coordinate dealer property visits, log client interactions, and progress negotiations in the pipeline.
          </p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Active Assignments Card */}
        <div className="bg-zinc-900/60 border border-zinc-800/80 p-6 rounded-2xl hover:border-zinc-700/80 transition-all duration-300 relative group overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/5 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Active Requirements</span>
            <div className="p-2 bg-indigo-950/40 text-indigo-400 rounded-xl">
              <ClipboardList className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-3xl font-black tracking-tight">{activeRequirementsCount}</h3>
            <p className="text-xs text-zinc-400 font-medium">Assigned client profiles</p>
          </div>
        </div>

        {/* Upcoming Visits Card */}
        <div className="bg-zinc-900/60 border border-zinc-800/80 p-6 rounded-2xl hover:border-zinc-700/80 transition-all duration-300 relative group overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-cyan-500/5 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Upcoming Visits</span>
            <div className="p-2 bg-cyan-950/40 text-cyan-400 rounded-xl">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-3xl font-black tracking-tight">{upcomingVisitsCount}</h3>
            <p className="text-xs text-zinc-400 font-medium">Coordinated property inspections</p>
          </div>
        </div>

        {/* Pending Follow-ups Card */}
        <div className="bg-zinc-900/60 border border-zinc-800/80 p-6 rounded-2xl hover:border-zinc-700/80 transition-all duration-300 relative group overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-violet-500/5 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Pending Tasks</span>
            <div className="p-2 bg-violet-950/40 text-violet-400 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-3xl font-black tracking-tight">{pendingFollowUps.length}</h3>
            <p className="text-xs text-zinc-400 font-medium">Follow-up callbacks pending</p>
          </div>
        </div>

        {/* Missed Follow-ups Card */}
        <div className="bg-zinc-900/60 border border-red-950 p-6 rounded-2xl hover:border-red-900/60 transition-all duration-300 relative group overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-red-500/5 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-red-400 uppercase tracking-wider">Overdue Callbacks</span>
            <div className="p-2 bg-red-950/40 text-red-400 rounded-xl animate-pulse">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-3xl font-black tracking-tight text-red-500">{missedFollowUps.length}</h3>
            <p className="text-xs text-red-400 font-medium font-bold">Overdue &gt; 12 Hours (Action Required)</p>
          </div>
        </div>

      </div>

      {/* Main Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Requirements Workspace Panel */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-indigo-400" />
              Active Requirements Workspace
            </h2>
            <a 
              href="/employee/requirements" 
              className="text-xs font-semibold text-violet-400 hover:text-white flex items-center gap-1 group transition-colors"
            >
              View All Requirements
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </a>
          </div>

          <div className="space-y-4">
            {assignments && assignments.length > 0 ? (
              assignments.map((item: any) => {
                const req = item.requirement;
                if (!req) return null;
                return (
                  <div 
                    key={item.assignment_id}
                    className="p-5 bg-zinc-900/40 border border-zinc-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-zinc-900/80 transition-all duration-300"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-zinc-800 text-zinc-300 text-[10px] font-bold rounded uppercase">
                          {req.property_type}
                        </span>
                        {item.is_lead && (
                          <span className="px-2 py-0.5 bg-violet-950 text-violet-300 text-[10px] font-bold rounded border border-violet-850">
                            Lead Representative
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-sm text-white">
                        Customer: {req.customer?.name || 'Unassigned Customer'}
                      </h4>
                      <p className="text-xs text-zinc-400">
                        Budget: ₹{(req.budget_min / 100000).toFixed(1)}L - ₹{(req.budget_max / 100000).toFixed(1)}L | Location: {req.area}, {req.city}
                      </p>
                    </div>

                    <div>
                      <a
                        href={`/employee/requirements/${req.requirement_id}`}
                        className="px-4 py-2 bg-zinc-850 hover:bg-violet-600 text-white text-xs font-bold rounded-xl transition-all duration-300 inline-block text-center"
                      >
                        Open Workspace
                      </a>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center bg-zinc-900/20 border border-zinc-800 rounded-2xl text-zinc-500 text-sm">
                No active requirements assigned to your profile.
              </div>
            )}
          </div>
        </div>

        {/* Follow-up Feed Panel */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-violet-400" />
              Follow-up Feed
            </h2>
            <a 
              href="/employee/followups" 
              className="text-xs font-semibold text-violet-400 hover:text-white flex items-center gap-1 group transition-colors"
            >
              Task Board
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </a>
          </div>

          <div className="bg-zinc-900/30 border border-zinc-800/80 rounded-2xl p-4 space-y-4 max-h-[400px] overflow-y-auto">
            {followUps && followUps.length > 0 ? (
              followUps.slice(0, 5).map((f: any) => {
                const isMissed = f.status === 'Missed';
                return (
                  <div 
                    key={f.followup_id}
                    className={`p-3.5 rounded-xl border transition-all duration-300 ${
                      isMissed 
                        ? 'bg-red-950/10 border-red-950 hover:border-red-900/60' 
                        : 'bg-zinc-900/40 border-zinc-800 hover:border-zinc-700/80'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="font-bold text-xs text-white truncate max-w-[120px]">
                        {f.customer?.name || 'Client'}
                      </span>
                      <span className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase ${
                        isMissed 
                          ? 'bg-red-950 text-red-400 border border-red-900' 
                          : 'bg-violet-950 text-violet-400 border border-violet-900'
                      }`}>
                        {f.status}
                      </span>
                    </div>
                    <p className={`text-xs ${isMissed ? 'text-red-400 font-semibold' : 'text-zinc-400'} line-clamp-2 mb-2`}>
                      {f.notes || 'No callback details provided.'}
                    </p>
                    <div className="text-[10px] text-zinc-500 font-medium flex justify-between items-center">
                      <span>Schedule Date:</span>
                      <span className={isMissed ? 'text-red-400 font-bold' : ''}>
                        {new Date(f.next_followup_date).toLocaleDateString()} {new Date(f.next_followup_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-6 text-center text-zinc-500 text-xs">
                No active callbacks scheduled.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
