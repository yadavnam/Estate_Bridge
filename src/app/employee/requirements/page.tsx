import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { ClipboardList, ArrowRight, User, Sparkles, SlidersHorizontal } from 'lucide-react';

export default async function EmployeeRequirementsPage() {
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
    .select('employee_id')
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

  // Fetch all assignments (active assignments)
  const { data: assignments, error } = await adminSupabase
    .from('requirement_employee_assignments')
    .select(`
      assignment_id,
      is_lead,
      requirement:requirement_id (
        requirement_id,
        property_type,
        budget_min,
        budget_max,
        city,
        area,
        area_min,
        area_max,
        additional_notes,
        created_at,
        customer:customer_id (
          customer_id,
          name,
          email,
          phone
        )
      )
    `)
    .eq('employee_id', employeeId)
    .eq('status', 'Active')
    .order('assigned_at', { ascending: false });

  if (error) {
    return (
      <div className="p-8 text-red-500 font-bold bg-red-950/20 border border-red-900 rounded-2xl">
        Failed to fetch requirements list: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-indigo-400" />
            Requirement Assignments
          </h1>
          <p className="text-sm text-zinc-400">
            You are assigned to the following client property requirements.
          </p>
        </div>
      </div>

      {/* Grid listing */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {assignments && assignments.length > 0 ? (
          assignments.map((item: any) => {
            const req = item.requirement;
            if (!req) return null;
            const customer = req.customer;

            return (
              <div 
                key={item.assignment_id} 
                className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 space-y-4 hover:border-zinc-700/80 transition-all duration-300 relative overflow-hidden flex flex-col justify-between"
              >
                {item.is_lead && (
                  <div className="absolute top-0 right-0 px-3 py-1 bg-violet-650/20 border-l border-b border-violet-800/80 rounded-bl-xl text-[10px] font-bold text-violet-400 uppercase tracking-wider">
                    Lead Assignee
                  </div>
                )}
                
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 bg-zinc-800 text-zinc-300 text-[10px] font-bold rounded-md uppercase">
                      {req.property_type}
                    </span>
                    <span className="text-zinc-500 text-[10px]">
                      Created: {new Date(req.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                      <User className="w-4 h-4 text-zinc-400" />
                      {customer?.name || 'Customer Profile Locked'}
                    </h3>
                    {customer && (
                      <p className="text-xs text-zinc-400 truncate">
                        {customer.email} | {customer.phone}
                      </p>
                    )}
                  </div>

                  <div className="border-t border-zinc-800/60 pt-3 space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-500">Location:</span>
                      <span className="font-semibold text-white">{req.area}, {req.city}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-500">Budget Range:</span>
                      <span className="font-semibold text-emerald-400">
                        ₹{(req.budget_min / 100000).toFixed(1)}L - ₹{(req.budget_max / 100000).toFixed(1)}L
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-555 text-zinc-500">Size Range:</span>
                      <span className="font-semibold text-white">
                        {req.area_min} - {req.area_max} sq. ft.
                      </span>
                    </div>
                  </div>

                  {req.additional_notes && (
                    <div className="bg-zinc-950/40 p-3 rounded-xl border border-zinc-850/60 text-xs text-zinc-400 line-clamp-2">
                      <strong>Client Note:</strong> {req.additional_notes}
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-zinc-800/40 flex items-center justify-end">
                  <a
                    href={`/employee/requirements/${req.requirement_id}`}
                    className="flex items-center gap-2 px-4 py-2 bg-zinc-850 hover:bg-violet-600 text-white text-xs font-bold rounded-xl transition-all duration-300 group"
                  >
                    Open Workspace
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </a>
                </div>
              </div>
            );
          })
        ) : (
          <div className="md:col-span-2 p-12 text-center bg-zinc-900/20 border border-zinc-800 rounded-3xl text-zinc-500 text-sm">
            No customer requirements assignments found. Contact system administrator for assignment mappings.
          </div>
        )}
      </div>
    </div>
  );
}
