import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import NewRequirementForm from './new-requirement-form';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export default async function NewRequirementPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const adminSupabase = createAdminClient();

  // Resolve Customer profile
  const { data: customer, error: customerError } = await adminSupabase
    .from('customers')
    .select('customer_id, city')
    .eq('user_id', user.id)
    .maybeSingle();

  if (customerError || !customer) {
    return (
      <div className="text-center py-20 text-red-400">
        Customer profile not found. Please log in again.
      </div>
    );
  }

  // Count active requirements (status is not Withdrawn, deleted_at is null)
  const { data: activeReqs, error: reqError } = await adminSupabase
    .from('requirements')
    .select('requirement_id')
    .eq('customer_id', customer.customer_id)
    .is('deleted_at', null)
    .neq('status', 'Withdrawn');

  if (reqError) {
    return (
      <div className="text-center py-20 text-red-400">
        Error checking existing requirements. Please try again.
      </div>
    );
  }

  const activeCount = activeReqs?.length || 0;
  const canCreateNew = activeCount < 3;

  if (!canCreateNew) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/80 rounded-3xl p-8 sm:p-12 text-center space-y-6">
          <div className="w-16 h-16 bg-red-950/40 border border-red-800/60 text-red-400 rounded-2xl flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-extrabold text-white">Active Limit Reached</h1>
            <p className="text-zinc-400 text-sm max-w-md mx-auto">
              You currently have {activeCount} active requirements. The system enforces a maximum of 3 active requirements per customer.
            </p>
            <p className="text-zinc-500 text-xs max-w-md mx-auto">
              Please withdraw one of your existing active requirements before submitting a new one.
            </p>
          </div>
          <div className="pt-4">
            <a
              href="/customer/requirements"
              className="inline-flex items-center gap-2 text-sm font-semibold bg-zinc-800 hover:bg-zinc-700 text-white py-3 px-6 rounded-xl transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Requirements
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Fallback to empty string if city is null/empty
  const defaultCity = customer.city || '';

  return (
    <div className="max-w-3xl mx-auto py-4">
      <div className="mb-6">
        <a
          href="/customer/requirements"
          className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Requirements
        </a>
      </div>
      <NewRequirementForm defaultCity={defaultCity} />
    </div>
  );
}
