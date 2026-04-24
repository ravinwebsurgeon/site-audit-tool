import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  // Redirect authenticated users away from auth pages
  if (token && pathname.startsWith('/auth/')) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // Redirect authenticated users who haven't completed onboarding
  if (
    token &&
    !token.onboardingDone &&
    !pathname.startsWith('/onboarding') &&
    !pathname.startsWith('/auth/') &&
    !pathname.startsWith('/api/')
  ) {
    return NextResponse.redirect(new URL('/onboarding', req.url));
  }

  // Unauthenticated /audit access — redirect with custom message
  if (!token && pathname.startsWith('/audit')) {
    const signInUrl = new URL('/auth/signin', req.url);
    signInUrl.searchParams.set('message', 'Please signin to use the Audit Tool for better Experience');
    signInUrl.searchParams.set('callbackUrl', req.url);
    return NextResponse.redirect(signInUrl);
  }

  // Protected paths: require authentication
  const protectedPaths = ['/dashboard', '/onboarding', '/settings'];
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));
  if (isProtected && !token) {
    const signInUrl = new URL('/auth/signin', req.url);
    signInUrl.searchParams.set('callbackUrl', req.url);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/onboarding/:path*',
    '/settings/:path*',
    '/auth/:path*',
    '/audit/:path*',
  ],
};
