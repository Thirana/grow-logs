// Route protection — redirects unauthenticated users away from dashboard routes and
// authenticated users away from auth pages. Runs on the server before React renders.
// Used by: Next.js (picked up automatically from src/middleware.ts)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest): NextResponse {
  // _gl_session is a non-HTTP-only indicator cookie set by the auth store on login.
  // The real security token (refresh_token) is HTTP-only and scoped to the API origin,
  // so it is never visible to this middleware in development or via cross-origin requests.
  const hasSession = request.cookies.has('_gl_session');
  const { pathname } = request.nextUrl;

  const isDashboardRoute =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/onboarding') ||
    pathname.startsWith('/categories') ||
    pathname.startsWith('/entries') ||
    pathname.startsWith('/today') ||
    pathname.startsWith('/settings');

  const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/register');

  if (isDashboardRoute && !hasSession) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute && hasSession) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/onboarding/:path*',
    '/categories/:path*',
    '/entries/:path*',
    '/today/:path*',
    '/settings/:path*',
    '/login',
    '/register',
  ],
};
