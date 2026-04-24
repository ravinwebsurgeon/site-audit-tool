import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // Unauthenticated /audit access — redirect with custom message
    if (!token && pathname.startsWith('/audit')) {
      const signInUrl = new URL('/auth/signin', req.url);
      signInUrl.searchParams.set('message', 'Please signin to use the Audit Tool for better Experience');
      signInUrl.searchParams.set('callbackUrl', req.url);
      return NextResponse.redirect(signInUrl);
    }

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

        // /audit: always return true so the middleware fn above handles the redirect with custom message
        if (pathname.startsWith('/audit')) return true;

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
    '/audit/:path*',
  ],
};
