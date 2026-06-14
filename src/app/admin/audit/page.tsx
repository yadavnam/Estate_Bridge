import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import AuditConsoleClient from './audit-console-client';

export default async function AdminAuditPage() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  const adminSupabase = createAdminClient();

  // Fetch audit logs
  const { data: logs, error } = await adminSupabase
    .from('audit_logs')
    .select(`
      log_id,
      user_id,
      action,
      entity_type,
      entity_id,
      old_value,
      new_value,
      created_at,
      users:user_id (
        email
      )
    `)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    return (
      <div className="p-8 text-red-500 font-bold bg-red-950/20 border border-red-900 rounded-2xl">
        Failed to fetch audit logs: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold tracking-tight">Security Audit Log Console</h1>
        <p className="text-sm text-zinc-400">
          Inspect platform transactions, track administrative trust rating manual overrides, and review deal verification attachments.
        </p>
      </div>

      <AuditConsoleClient initialLogs={logs || []} />
    </div>
  );
}
