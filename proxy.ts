import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // Redirect authenticated users away from auth pages
    if (token && pathname.startsWith('/auth/')) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    // Redirect authenticated users who haven't done onboarding (except to onboarding itself)
    if (token && !token.onboardingDone && !pathname.startsWith('/onboarding') && !pathname.startsWith('/auth/') && !pathname.startsWith('/api/')) {
      return NextResponse.redirect(new URL('/onboarding', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      // Return true = allow request (will run middleware fn above)
      // Return false = redirect to signIn page
      authorized({ token, req }) {
        const { pathname } = req.nextUrl;

        // These paths require authentication
        const protectedPaths = ['/dashboard', '/onboarding', '/settings'];
        const isProtected = protectedPaths.some((p) => pathname.startsWith(p));

        if (isProtected) return !!token;

        // Everything else is public
        return true;
      },
    },
  }
);

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/onboarding/:path*',
    '/settings/:path*',
    '/auth/:path*',
  ],
};
