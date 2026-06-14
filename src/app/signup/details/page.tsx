import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import DealerDetailsForm from './details-form';

export default async function DetailsPage() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  // If user is not logged in, redirect to login
  if (authError || !user) {
    redirect('/login');
  }

  const role = user.app_metadata?.role;
  const status = user.app_metadata?.status;

  // Block non-dealers
  if (role !== 'DEALER') {
    redirect('/login');
  }

  // Check if dealer profile already exists
  const adminSupabase = createAdminClient();
  const { data: existingDealer, error: dbError } = await adminSupabase
    .from('dealers')
    .select('dealer_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (dbError) {
    redirect('/login?error=db_error');
  }

  if (existingDealer) {
    if (status === 'Pending') {
      redirect('/signup/pending');
    } else if (status === 'Rejected') {
      redirect('/signup/rejected');
    } else {
      redirect('/dealer');
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-zinc-950 to-slate-950 flex items-center justify-center p-4 sm:p-6 md:p-8 relative selection:bg-cyan-500 selection:text-black">
      {/* Background Decorative Rings */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Profile intake form */}
      <DealerDetailsForm />
    </div>
  );
}
