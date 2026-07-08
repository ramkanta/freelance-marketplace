import { NextResponse, NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const token = request.cookies.get('accessToken')?.value;
  const { pathname } = request.nextUrl;

  // List of protected routes that require authentication
  // Note: We explicitly leave '/admin/migrations' UNPROTECTED for development, as requested.
  const protectedRoutes = [
    '/admin/dashboard',
    '/customer/dashboard', 
    '/freelancer/dashboard', 
    '/freelancer/onboard', 
    '/profile',
    '/support/dashboard'
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
