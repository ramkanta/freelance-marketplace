import { NextResponse, NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const token = request.cookies.get('accessToken')?.value;
  const { pathname } = request.nextUrl;

  // List of protected routes that require authentication.
  // H10: /admin/migrations renders raw migration SQL and exposes DB-mutating
  // controls — it must never be left unguarded, even for "development".
  const protectedRoutes = [
    '/admin/dashboard',
    '/admin/migrations',
    '/admin/users',
    '/customer/dashboard',
    '/customer/profile',
    '/freelancer/dashboard',
    '/freelancer/onboard',
    '/freelancer/profile',
    '/support/dashboard',
  ];

  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  if (isProtectedRoute && !token) {
    // Redirect to login page if trying to access a protected route without a token
    const loginUrl = new URL('/login', request.url);
    // Optional: add redirect query parameter to send them back after login
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
