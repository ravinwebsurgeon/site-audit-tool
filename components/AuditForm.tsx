'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useToast } from '@/components/Toast';

const PRIVATE_IP_RE = /^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|127\.|0\.|169\.254\.|::1|localhost)/i;

function validateUrl(raw: string): { normalized: string; error: string | null } {
  const trimmed = raw.trim();
  if (!trimmed) return { normalized: '', error: 'Please enter a URL.' };

  let normalized = trimmed;
  if (!/^https?:\/\//i.test(normalized)) {
    normalized = `https://${normalized}`;
  }

  let parsed: URL;
  try {
    parsed = new URL(normalized);
  } catch {
    return { normalized, error: 'Invalid URL — please enter a valid website address.' };
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    return { normalized, error: 'Only HTTP and HTTPS URLs are supported.' };
  }

  const { hostname } = parsed;

  if (PRIVATE_IP_RE.test(hostname)) {
    return { normalized, error: 'Private, local, or loopback addresses cannot be audited.' };
  }

  // Must have at least one dot and a non-empty TLD
  const parts = hostname.split('.');
  if (parts.length < 2 || parts[parts.length - 1].length < 2) {
    return { normalized, error: 'Please enter a valid public domain (e.g. example.com).' };
  }

  // Reject raw IP addresses
  const ipv4Re = /^\d{1,3}(\.\d{1,3}){3}$/;
  if (ipv4Re.test(hostname)) {
    return { normalized, error: 'IP addresses are not supported — please enter a domain name.' };
  }

  // Disallow paths that are just query strings or fragments with no real domain intent
  if (hostname.length > 253) {
    return { normalized, error: 'Hostname is too long.' };
  }

  return { normalized, error: null };
}

export default function AuditForm() {
  const router = useRouter();
  const { data: session } = useSession();
  const toast = useToast();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const [notFoundUrl, setNotFoundUrl] = useState<string | null>(null);

  const inlineError = touched && url.trim() ? validateUrl(url).error : null;
  const displayError = inlineError ?? error;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setTouched(true);

    const { normalized, error: validationError } = validateUrl(url);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!session) {
      router.push(`/auth/signin?message=${encodeURIComponent('Sign in to unlock full access to your dashboard')}`);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/audits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: normalized }),
      });

      const json = await res.json();

      if (res.status === 422 && json.code === 'URL_NOT_REACHABLE') {
        setNotFoundUrl(normalized);
        return;
      }

      if (json.code === 'MISSING_ENV_KEY') {
        toast.error('Service not configured: ' + (json.message ?? 'Queue service (QStash/Redis) is missing. Check your environment variables.'));
        return;
      }

      if (res.status === 429) {
        const resetHeader = res.headers.get('X-RateLimit-Reset');
        const resetTime   = resetHeader ? new Date(parseInt(resetHeader, 10) * 1000) : null;
        const resetMsg    = resetTime
          ? ` Your limit resets at ${resetTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`
          : '';
        setError(`Daily audit limit reached.${resetMsg}`);
        return;
      }

      if (!res.ok || !json.success) {
        setError(json.errors?.[0]?.message ?? json.message ?? 'Failed to start audit');
        return;
      }

      router.push(`/audit/${json.data.id}`);
    } catch {
      setError('Network error — please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (notFoundUrl) {
    return (
      <div className="w-full">
        <div
          className="rounded-2xl border p-8 text-center"
          style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }}
        >
          {/* Icon */}
          <div
            className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl"
            style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)' }}
          >
            <svg className="h-10 w-10" fill="none" stroke="#f87171" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M12 9v2m0 4h.01M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
          </div>

          <h2 className="mb-2 text-2xl font-bold" style={{ color: 'white' }}>
            Website Not Found
          </h2>
          <p className="mb-1 text-sm font-mono truncate" style={{ color: 'rgba(148,163,184,0.8)' }}>
            {notFoundUrl}
          </p>
          <p className="mb-8 text-base" style={{ color: 'rgba(148,163,184,0.9)' }}>
            We couldn&apos;t reach this website. The domain may not exist, the server may be down, or access may be blocked.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => { setNotFoundUrl(null); setUrl(''); setTouched(false); }}
              className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-base font-semibold text-white shadow-lg transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Try a different URL
            </button>
            <button
              onClick={() => { setNotFoundUrl(null); setUrl(notFoundUrl); setTouched(false); }}
              className="inline-flex items-center gap-2 rounded-xl border px-6 py-3 text-base font-semibold transition-all hover:opacity-80"
              style={{ borderColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.7)' }}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Edit URL
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div
        className="flex items-center gap-2 rounded-2xl p-2 transition-all duration-200"
        style={{
          background: 'rgba(255,255,255,0.07)',
          border: '1.5px solid rgba(255,255,255,0.12)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.08)',
        }}
      >
        {/* Globe icon */}
        <span className="pl-3 shrink-0" style={{ color: 'rgba(148,163,184,0.7)' }}>
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
            />
          </svg>
        </span>

        <input
          type="text"
          value={url}
          onChange={(e) => { setUrl(e.target.value); setError(null); }}
          onBlur={() => setTouched(true)}
          placeholder="Enter website URL — e.g. example.com"
          className="min-w-0 flex-1 bg-transparent py-3.5 pr-2 text-base sm:text-lg font-medium outline-none placeholder:font-normal placeholder:text-slate-500"
          style={{ color: 'white', caretColor: '#818cf8' }}
        />

        <button
          type="submit"
          disabled={loading || !url.trim() || !!inlineError}
          className="shrink-0 inline-flex items-center gap-2 rounded-xl px-5 sm:px-7 py-3.5 text-sm sm:text-base font-semibold text-white shadow-lg transition-all duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', minWidth: 120 }}
        >
          {loading ? (
            <>
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <span className="hidden sm:inline">Analyzing…</span>
            </>
          ) : (
            <>
              <span>Run Audit</span>
              <svg className="h-4 w-4 hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5-5 5M6 12h12" />
              </svg>
            </>
          )}
        </button>
      </div>

      {displayError && (
        <div
          className="mt-3.5 flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm"
          style={{ background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.25)', color: '#fca5a5' }}
        >
          <svg className="mt-0.5 h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {displayError}
        </div>
      )}
    </form>
  );
}
