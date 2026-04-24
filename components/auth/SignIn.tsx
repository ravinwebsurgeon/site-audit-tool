'use client';

import { signIn, getProviders } from 'next-auth/react';
import { useEffect, useState, FormEvent, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12" />
    </svg>
  );
}

const LEFT_FEATURES = [
  {
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
    color: '#3b82f6',
    bg: 'rgba(59,130,246,0.15)',
    title: 'Deep SEO Analysis',
    desc: '25+ checks including schema, canonical, OG tags',
  },
  {
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.15)',
    title: 'Performance Audit',
    desc: 'Core metrics, lazy loading, compression checks',
  },
  {
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    color: '#10b981',
    bg: 'rgba(16,185,129,0.15)',
    title: 'Security Scanning',
    desc: 'Headers, HSTS, CSP, mixed content detection',
  },
  {
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    color: '#8b5cf6',
    bg: 'rgba(139,92,246,0.15)',
    title: 'AI Recommendations',
    desc: 'Claude-powered, prioritized action plan',
  },
];

function SignInForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') ?? '/dashboard';
  const errorParam = searchParams.get('error');
  const messageParam = searchParams.get('message');

  const [availableProviders, setAvailableProviders] = useState<Record<string, { id: string; name: string }> | null>(null);
  const [email, setEmail] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => { getProviders().then(setAvailableProviders); }, []);

  const errorMessages: Record<string, string> = {
    OAuthCallback:      'OAuth sign-in failed. Please try again.',
    OAuthCreateAccount: 'Could not create account. Email may already be linked to another provider.',
    EmailCreateAccount: 'Could not create account. Please try a different email.',
    Callback:           'Something went wrong during sign-in.',
    Default:            'Sign-in failed. Please try again.',
  };
  const errorMsg = errorParam ? (errorMessages[errorParam] ?? errorMessages.Default) : null;

  async function handleOAuth(providerId: string) {
    setOauthLoading(providerId);
    await signIn(providerId, { callbackUrl });
  }

  async function handleEmail(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setEmailLoading(true);
    const result = await signIn('email', { email: email.trim(), callbackUrl, redirect: false });
    setEmailLoading(false);
    if (result?.ok) setEmailSent(true);
  }

  const hasGoogle = availableProviders?.google;
  const hasGitHub = availableProviders?.github;
  const hasEmail  = availableProviders?.email;

  if (emailSent) {
    return (
      <div className="text-center">
        <div
          className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl"
          style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)' }}
        >
          <svg className="h-8 w-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">Check your inbox</h3>
        <p className="text-slate-500 text-sm mb-1">We sent a magic link to</p>
        <p className="font-semibold text-slate-800 mb-6">{email}</p>
        <p className="text-xs text-slate-400">
          Didn&apos;t receive it?{' '}
          <button onClick={() => setEmailSent(false)} className="text-indigo-600 underline hover:text-indigo-700">Try again</button>
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-7">
        <h2 className="text-2xl font-bold text-slate-900">Welcome back</h2>
        <p className="mt-1 text-sm text-slate-500">Sign in to access your audit history and reports</p>
      </div>

      {messageParam && (
        <div
          className="mb-5 flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm text-indigo-700"
          style={{ background: 'rgba(99,102,241,0.08)', borderColor: 'rgba(99,102,241,0.25)' }}
        >
          <svg className="mt-0.5 h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {messageParam}
        </div>
      )}

      {errorMsg && (
        <div
          className="mb-5 flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm text-red-700"
          style={{ background: 'rgba(239,68,68,0.06)', borderColor: 'rgba(239,68,68,0.2)' }}
        >
          <svg className="mt-0.5 h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {errorMsg}
        </div>
      )}

      {(hasGoogle || hasGitHub) && (
        <div className="space-y-2.5 mb-6">
          {hasGoogle && (
            <button
              onClick={() => handleOAuth('google')}
              disabled={!!oauthLoading}
              className="flex w-full items-center justify-center gap-3 rounded-xl border px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ borderColor: '#e2e8f0', background: 'white' }}
            >
              {oauthLoading === 'google' ? (
                <svg className="h-5 w-5 animate-spin text-slate-400" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              ) : <GoogleIcon />}
              Continue with Google
            </button>
          )}
          {hasGitHub && (
            <button
              onClick={() => handleOAuth('github')}
              disabled={!!oauthLoading}
              className="flex w-full items-center justify-center gap-3 rounded-xl border px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ borderColor: '#e2e8f0', background: 'white' }}
            >
              {oauthLoading === 'github' ? (
                <svg className="h-5 w-5 animate-spin text-slate-400" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              ) : <GitHubIcon />}
              Continue with GitHub
            </button>
          )}
        </div>
      )}

      {(hasGoogle || hasGitHub) && hasEmail && (
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-100" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-white px-4 text-xs font-medium text-slate-400">or continue with email</span>
          </div>
        </div>
      )}

      {hasEmail && (
        <form onSubmit={handleEmail} className="space-y-2.5">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            required
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-indigo-400 focus:ring-2 transition-all"
            style={{ '--tw-ring-color': 'rgba(99,102,241,0.15)' } as React.CSSProperties}
          />
          <button
            type="submit"
            disabled={emailLoading || !email.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
          >
            {emailLoading ? (
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            )}
            {emailLoading ? 'Sending link…' : 'Send magic link'}
          </button>
        </form>
      )}

      {!hasGoogle && !hasGitHub && !hasEmail && (
        <div
          className="rounded-xl border p-4 text-center text-sm text-slate-500"
          style={{ background: '#f8fafc', borderColor: '#e2e8f0' }}
        >
          No auth providers configured. Add OAuth credentials to{' '}
          <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded font-mono">.env</code>
        </div>
      )}

      <p className="mt-6 text-center text-xs text-slate-400">
        By signing in you agree to our{' '}
        <a href="#" className="underline hover:text-slate-600">Terms</a>
        {' '}and{' '}
        <a href="#" className="underline hover:text-slate-600">Privacy Policy</a>.
      </p>
    </div>
  );
}

export default function SignInPage() {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left panel */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between px-12 py-4 text-white relative overflow-y-auto shrink-0"
        style={{ background: 'linear-gradient(145deg, #0b1120 0%, #0f172a 50%, #1a1040 100%)' }}
      >
        {/* Glows */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 60% 50% at 30% 20%, rgba(99,102,241,0.25) 0%, transparent 70%)' }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 40% 40% at 80% 80%, rgba(139,92,246,0.15) 0%, transparent 70%)' }}
        />
        <div className="absolute inset-0 pointer-events-none dot-grid-white opacity-15" />

        <div className="relative">
          <Link href="/" className="flex items-center gap-2.5 mb-14">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl shadow-lg"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
            >
              <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="font-bold text-lg text-white">SiteAudit</span>
          </Link>

          <h1 className="text-4xl font-extrabold leading-tight mb-4 tracking-tight">
            Audit your website.{' '}
            <span
              style={{ background: 'linear-gradient(135deg, #818cf8, #c4b5fd)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}
            >
              Outrank everyone.
            </span>
          </h1>
          <p className="text-slate-400 text-base leading-relaxed max-w-sm mb-12">
            AI-powered audits that pinpoint exactly what&apos;s holding your site back — and tell you how to fix it fast.
          </p>

          <div className="space-y-4">
            {LEFT_FEATURES.map((f) => (
              <div key={f.title} className="flex items-center gap-4">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: f.bg, color: f.color }}
                >
                  {f.icon}
                </div>
                <div>
                  <p className="font-semibold text-white text-sm">{f.title}</p>
                  <p className="text-slate-500 text-xs">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Social proof */}
        <div className="relative flex items-center gap-4">
          <div className="flex -space-x-2">
            {['#3b82f6', '#8b5cf6', '#ec4899', '#10b981'].map((c, i) => (
              <div
                key={i}
                className="h-8 w-8 rounded-full"
                style={{ background: c, outline: '2px solid #0f172a' }}
              />
            ))}
          </div>
          <p className="text-sm text-slate-400">
            Trusted by <span className="text-white font-semibold">1,200+</span> developers &amp; agencies
          </p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex w-full lg:w-1/2 items-center justify-center px-6 py-8 overflow-y-auto">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <Link href="/" className="flex items-center gap-2.5 mb-10 lg:hidden">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-xl"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
            >
              <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="font-bold text-slate-900">SiteAudit</span>
          </Link>

          <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-slate-300" />}>
            <SignInForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
