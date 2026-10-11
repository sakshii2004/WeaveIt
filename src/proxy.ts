import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const publicPaths = [
  '/login',
  '/signup',
  '/verify-email',
  '/forgot-password',
  '/reset-password',
  '/api/auth',
  '/api/health',
  '/styleguide',
];

/**
 * Next.js 16 Proxy for optimistic route protection and redirects
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Static assets and internal routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.match(/\.(png|jpg|jpeg|svg|webp|ico)$/)
  ) {
    return NextResponse.next();
  }

  // Check for NextAuth v5 session token cookies
  const sessionToken =
    request.cookies.get('authjs.session-token')?.value ||
    request.cookies.get('__Secure-authjs.session-token')?.value ||
    request.cookies.get('next-auth.session-token')?.value ||
    request.cookies.get('__Secure-next-auth.session-token')?.value;

  const isPublicPath = publicPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );

  // If user is already authenticated and visits login/signup, redirect to dashboard
  if (sessionToken && (pathname === '/login' || pathname === '/signup')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Root path: redirect to dashboard if authenticated, otherwise login
  if (pathname === '/') {
    if (sessionToken) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If route is not public and user has no session, redirect to login with callbackUrl
  if (!isPublicPath && !sessionToken) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api/health|_next/static|_next/image|favicon.ico).*)'],
};
