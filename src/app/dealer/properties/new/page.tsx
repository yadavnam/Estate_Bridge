import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import NewPropertyForm from './new-property-form';

export default async function NewPropertyPage() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user || user.app_metadata?.role !== 'DEALER') {
    redirect('/login');
  }

  const status = user.app_metadata?.status;
  if (status !== 'Approved') {
    redirect('/login?error=not_approved');
  }

  return (
    <div className="max-w-4xl mx-auto">
      <NewPropertyForm />
    </div>
  );
}
