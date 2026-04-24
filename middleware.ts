import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // On Vercel (production), NextAuth always sets the __Secure- prefixed cookie
  // because the deployment is served over HTTPS. NODE_ENV is the only reliable
  // signal here — NEXTAUTH_URL may be unset or could be set with http:// by
  // mistake, and using it directly can cause getToken to look for the wrong
  // cookie name, returning null for a valid session.
  const secureCookie = process.env.NODE_ENV === 'production';

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET, secureCookie });

  // Send authenticated users away from auth pages to dashboard
  if (token && pathname.startsWith('/auth/')) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // Authenticated users who haven't finished onboarding → onboarding wizard
  if (
    token &&
    !token.onboardingDone &&
    !pathname.startsWith('/onboarding') &&
    !pathname.startsWith('/auth/') &&
    !pathname.startsWith('/api/')
  ) {
    return NextResponse.redirect(new URL('/onboarding', req.url));
  }

  // Unauthenticated /audit access — redirect with context message
  if (!token && pathname.startsWith('/audit')) {
    const signInUrl = new URL('/auth/signin', req.url);
    signInUrl.searchParams.set('message', 'Please sign in to use the Audit Tool');
    signInUrl.searchParams.set('callbackUrl', req.url);
    return NextResponse.redirect(signInUrl);
  }

  // Protected routes — require a valid session
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
