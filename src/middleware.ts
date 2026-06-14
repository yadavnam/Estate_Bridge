import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user, supabase } = await updateSession(request);
  const url = request.nextUrl.clone();
  const path = url.pathname;

  // Define public asset and auth routes
  const isAuthRoute = path.startsWith('/login') || path.startsWith('/signup');
  const isPublicRoute = path === '/' || path.startsWith('/_next') || path.startsWith('/favicon.ico') || path.startsWith('/api/');

  // If user is not authenticated
  if (!user) {
    // Block access to dashboard portals, redirect to login
    if (!isAuthRoute && !isPublicRoute) {
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  // User is authenticated, extract role and status from secure app_metadata
  const role = user.app_metadata?.role;
  const status = (user.app_metadata?.status as string) || 'Active';

  // If user is blocked or suspended, instantly revoke access
  if (status === 'Blocked' || status === 'Suspended') {
    // Sign out the user session immediately
    await supabase.auth.signOut();
    url.pathname = '/login';
    url.searchParams.set('error', 'unauthorized_status');
    return NextResponse.redirect(url);
  }

  // If user is a Dealer and status is Pending or Rejected, redirect to status page
  if (role === 'DEALER') {
    if (status === 'Pending') {
      if (!path.startsWith('/signup/pending')) {
        url.pathname = '/signup/pending';
        return NextResponse.redirect(url);
      }
      return supabaseResponse;
    }
    if (status === 'Rejected') {
      if (!path.startsWith('/signup/rejected')) {
        url.pathname = '/signup/rejected';
        return NextResponse.redirect(url);
      }
      return supabaseResponse;
    }
  }

  // If authenticated user visits login or signup, redirect to their dashboard
  if (isAuthRoute) {
    url.pathname = getDashboardRedirectPath(role);
    return NextResponse.redirect(url);
  }

  // Route protection gating (prevent unauthorized portal access)
  if (path.startsWith('/signup/pending') && (role !== 'DEALER' || status !== 'Pending')) {
    url.pathname = getDashboardRedirectPath(role);
    return NextResponse.redirect(url);
  }

  if (path.startsWith('/signup/rejected') && (role !== 'DEALER' || status !== 'Rejected')) {
    url.pathname = getDashboardRedirectPath(role);
    return NextResponse.redirect(url);
  }

  if (path.startsWith('/admin') && role !== 'ADMIN') {
    url.pathname = getDashboardRedirectPath(role);
    return NextResponse.redirect(url);
  }

  if (path.startsWith('/dealer') && role !== 'DEALER') {
    url.pathname = getDashboardRedirectPath(role);
    return NextResponse.redirect(url);
  }

  if (path.startsWith('/employee') && role !== 'EMPLOYEE') {
    url.pathname = getDashboardRedirectPath(role);
    return NextResponse.redirect(url);
  }

  if (path.startsWith('/customer') && role !== 'CUSTOMER') {
    url.pathname = getDashboardRedirectPath(role);
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

// Helper to determine redirect path based on user role
function getDashboardRedirectPath(role: string): string {
  switch (role) {
    case 'ADMIN':
      return '/admin';
    case 'DEALER':
      return '/dealer';
    case 'EMPLOYEE':
      return '/employee';
    case 'CUSTOMER':
      return '/customer';
    default:
      return '/login';
  }
}

// Config to specify matching routes (skip assets, api, static files)
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (static assets)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
