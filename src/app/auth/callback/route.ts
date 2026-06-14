import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/';

  if (code) {
    const response = NextResponse.redirect(new URL(next, request.url));
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error && data.user) {
      const role = data.user.app_metadata?.role || 'CUSTOMER';
      const status = data.user.app_metadata?.status || 'Active';

      // Blocked/Suspended eviction
      if (status === 'Blocked' || status === 'Suspended') {
        await supabase.auth.signOut();
        return NextResponse.redirect(new URL('/login?error=unauthorized_status', request.url));
      }

      // Route based on role
      if (role === 'ADMIN') {
        return NextResponse.redirect(new URL('/admin', request.url));
      } else if (role === 'DEALER') {
        if (status === 'Pending') {
          return NextResponse.redirect(new URL('/signup/pending', request.url));
        } else if (status === 'Rejected') {
          return NextResponse.redirect(new URL('/signup/rejected', request.url));
        }
        return NextResponse.redirect(new URL('/dealer', request.url));
      } else if (role === 'EMPLOYEE') {
        return NextResponse.redirect(new URL('/employee', request.url));
      } else {
        return NextResponse.redirect(new URL('/customer', request.url));
      }
    }
  }

  // Return the user to login with error if auth failed
  return NextResponse.redirect(new URL('/login?error=auth_failed', request.url));
}
