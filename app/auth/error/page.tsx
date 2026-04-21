'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';

const ERROR_DETAILS: Record<string, { title: string; desc: string }> = {
  Configuration: {
    title: 'Server configuration error',
    desc: 'There is a problem with the server configuration. Please contact support.',
  },
  AccessDenied: {
    title: 'Access denied',
    desc: 'You do not have permission to sign in. If you believe this is an error, contact support.',
  },
  Verification: {
    title: 'Magic link expired',
    desc: 'Your sign-in link has expired or has already been used. Please request a new one.',
  },
  OAuthCallback: {
    title: 'OAuth sign-in failed',
    desc: 'We could not complete the sign-in with your OAuth provider. Please try again.',
  },
  OAuthCreateAccount: {
    title: 'Account creation failed',
    desc: 'We could not create your account. Your email may already be linked to another provider.',
  },
  Default: {
    title: 'Sign-in error',
    desc: 'An unexpected error occurred during sign-in. Please try again.',
  },
};

function ErrorContent() {
  const searchParams = useSearchParams();
  const errorCode = searchParams.get('error') ?? 'Default';
  const { title, desc } = ERROR_DETAILS[errorCode] ?? ERROR_DETAILS.Default;

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-6">
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50">
          <svg className="h-8 w-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </div>

        <h1 className="text-xl font-bold text-slate-900 mb-2">{title}</h1>
        <p className="text-slate-500 text-sm leading-relaxed mb-2">{desc}</p>
        {errorCode !== 'Default' && (
          <p className="text-xs text-slate-400 mb-8 font-mono bg-slate-50 rounded-lg px-3 py-1.5 inline-block">
            Error: {errorCode}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
          <Link
            href="/auth/signin"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            Try again
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[calc(100vh-64px)] items-center justify-center"><div className="h-16 w-16 animate-pulse rounded-2xl bg-slate-100" /></div>}>
      <ErrorContent />
    </Suspense>
  );
}
