'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, UserPlus, ShieldAlert, Award, Calendar, Trash2, Loader2, Mail, Briefcase } from 'lucide-react';
import { createEmployee, deactivateEmployee } from '@/app/actions/admin';

interface EmployeesRosterClientProps {
  initialEmployees: any[];
}

export default function EmployeesRosterClient({ initialEmployees }: EmployeesRosterClientProps) {
  const router = useRouter();

  // Create Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    designation: '',
    email: ''
  });
  const [submittingForm, setSubmittingForm] = useState(false);
  const [actioningId, setActioningId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.designation.trim() || !formData.email.trim()) {
      alert('Please fill out all inputs.');
      return;
    }
    setSubmittingForm(true);
    try {
      const response = await createEmployee(formData);
      if (response.success) {
        setShowAddForm(false);
        setFormData({ name: '', designation: '', email: '' });
        router.refresh();
      } else {
        alert(response.error || 'Failed to create employee profile.');
      }
    } catch (err: any) {
      alert(err.message || 'Error occurred.');
    } finally {
      setSubmittingForm(false);
    }
  };

  const handleDeactivate = async (id: string) => {
    if (!confirm('Deactivate this employee? This will unassign them from requirements, log-out all active sessions, and alert you to map replacements for any upcoming visits.')) {
      return;
    }
    setActioningId(id);
    try {
      const response = await deactivateEmployee(id);
      if (response.success) {
        router.refresh();
      } else {
        alert(response.error || 'Failed to deactivate employee.');
      }
    } catch (err: any) {
      alert(err.message || 'Error occurred.');
    } finally {
      setActioningId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Directory Actions */}
      <div className="flex justify-between items-center">
        <h3 className="font-extrabold text-sm uppercase text-zinc-400 tracking-wider flex items-center gap-2">
          <Users className="w-5 h-5 text-cyan-400" />
          Internal Staff List ({initialEmployees.length})
        </h3>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-4 py-2 bg-violet-650 bg-violet-600 hover:bg-violet-750 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
        >
          <UserPlus className="w-4.5 h-4.5" />
          Add Coordinator Staff
        </button>
      </div>

      {/* Add Staff form popup */}
      {showAddForm && (
        <form 
          onSubmit={handleSubmit}
          className="p-6 bg-zinc-900/40 border border-zinc-800 rounded-2xl space-y-4 max-w-md"
        >
          <h4 className="font-extrabold text-sm text-white">Add New Employee Account</h4>
          
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Employee Full Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                placeholder="e.g. Abhishek Sahu"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Designation / Role Title</label>
              <input
                type="text"
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                placeholder="e.g. Senior Representative"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Email Address</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                placeholder="e.g. abhishek@estatebridge.com"
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 bg-zinc-850 hover:bg-zinc-800 text-zinc-300 font-bold text-xs rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingForm}
              className="flex items-center gap-1.5 px-5 py-2 bg-violet-600 hover:bg-violet-750 text-white font-bold text-xs rounded-xl disabled:opacity-50 transition-all cursor-pointer"
            >
              {submittingForm && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Create Profile
            </button>
          </div>
        </form>
      )}

      {/* Staff Roster Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {initialEmployees.map((emp) => {
          const isActive = emp.status === 'Active';
          const isActioning = actioningId === emp.employee_id;

          return (
            <div 
              key={emp.employee_id}
              className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 space-y-4 hover:border-zinc-750 transition-all flex flex-col justify-between relative"
            >
              {isActioning && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-xs z-10 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`px-2.5 py-0.5 text-[9px] font-bold rounded uppercase tracking-wider ${
                    isActive 
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-900' 
                      : 'bg-zinc-950 text-zinc-500 border border-zinc-850'
                  }`}>
                    {emp.status}
                  </span>
                  
                  <div className="flex items-center gap-1 text-[10px] text-zinc-500 font-medium">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Joined: {new Date(emp.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <h4 className="font-extrabold text-base text-white">{emp.name}</h4>
                  <p className="text-xs text-zinc-400 flex items-center gap-1.5 pl-1">
                    <Briefcase className="w-3.5 h-3.5 text-zinc-500" />
                    {emp.designation || 'Platform Representative'}
                  </p>
                </div>
              </div>

              {isActive && (
                <div className="pt-4 border-t border-zinc-800/40 flex justify-end">
                  <button
                    onClick={() => handleDeactivate(emp.employee_id)}
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-red-950/20 hover:bg-red-900/40 border border-red-900/60 text-red-400 font-bold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Deactivate Account
                  </button>
                </div>
              )}

              {!isActive && (
                <div className="pt-4 border-t border-zinc-800/40 text-right text-[10px] text-zinc-550 text-zinc-500 font-medium italic">
                  Employee deassigned from requirement accounts.
                </div>
              )}

            </div>
          );
        })}
      </div>
    </div>
  );
}
