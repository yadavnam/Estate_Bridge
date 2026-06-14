import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  const results: Record<string, any> = {};

  // 1. Check env vars
  results.env = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ SET' : '❌ MISSING',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY
      ? `✅ SET (starts with: ${process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 10)}...)`
      : '❌ MISSING',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ SET' : '❌ MISSING',
  };

  // 2. Test admin client creation
  try {
    const adminSupabase = createAdminClient();
    results.adminClientCreation = '✅ SUCCESS';

    // 3. Test simple DB query
    try {
      const { data, error } = await adminSupabase
        .from('users')
        .select('user_id')
        .limit(1);

      if (error) {
        results.dbQuery = `❌ FAILED: ${error.message} (code: ${error.code})`;
      } else {
        results.dbQuery = `✅ SUCCESS - found ${data?.length ?? 0} row(s)`;
      }
    } catch (dbErr: any) {
      results.dbQuery = `❌ EXCEPTION: ${dbErr.message}`;
    }

    // 4. Test RPC function
    try {
      const { data, error } = await adminSupabase.rpc(
        'check_and_increment_otp_limit',
        { p_ip: '127.0.0.1', p_phone: '+910000000000' }
      );
      if (error) {
        results.rpcTest = `❌ FAILED: ${error.message} (code: ${error.code})`;
      } else {
        results.rpcTest = `✅ SUCCESS - returned: ${data}`;
      }
    } catch (rpcErr: any) {
      results.rpcTest = `❌ EXCEPTION: ${rpcErr.message}`;
    }

  } catch (clientErr: any) {
    results.adminClientCreation = `❌ FAILED: ${clientErr.message}`;
  }

  return NextResponse.json(results, { status: 200 });
}
