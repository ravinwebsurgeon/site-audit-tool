'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import AuditCard from '@/components/AuditCard';

interface AuditSummary {
  id: string;
  url: string;
  overallScore: number | null;
  status: string;
  createdAt: string;
  completedAt: string | null;
}

const TIER_INFO = {
  FREE: { label: 'Free', audits: 5, color: 'text-slate-600', bg: 'bg-slate-100', upgrade: true },
  PRO: { label: 'Pro', audits: 100, color: 'text-blue-700', bg: 'bg-blue-100', upgrade: false },
  ENTERPRISE: { label: 'Enterprise', audits: Infinity, color: 'text-violet-700', bg: 'bg-violet-100', upgrade: false },
};

export default function DashboardPage() {
  const { data: session, status: sessionStatus } = useSession();
  const [audits, setAudits] = useState<AuditSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = sessionStatus === 'authenticated';

  useEffect(() => {
    const endpoint = isAuthenticated ? '/api/audits' : '/api/audits/recent';
    fetch(endpoint)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setAudits(data.data);
        else setError(data.message ?? 'Failed to load audits');
      })
      .catch(() => setError('Network error'))
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  const completed = audits.filter((a) => a.status === 'COMPLETED');
  const avgScore =
    completed.length > 0
      ? Math.round(completed.filter((a) => a.overallScore !== null).reduce((s, a) => s + (a.overallScore ?? 0), 0) / completed.filter((a) => a.overallScore !== null).length)
      : null;
  const criticalCount = completed.filter((a) => (a.overallScore ?? 100) < 50).length;

  const tier = session?.user?.subscriptionTier ?? 'FREE';
  const tierInfo = TIER_INFO[tier as keyof typeof TIER_INFO] ?? TIER_INFO.FREE;

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">

      {/* ── Header ── */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {isAuthenticated ? `My Audits` : 'Recent Audits'}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {isAuthenticated
              ? 'Your personal audit history, linked to your account'
              : 'Browse recent public audits — sign in to track your own'}
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors shadow-sm"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Audit
        </Link>
      </div>

      {/* ── Subscription banner (FREE tier) ── */}
      {isAuthenticated && tierInfo.upgrade && (
        <div className="mb-6 flex items-center justify-between rounded-2xl bg-linear-to-r from-blue-50 to-indigo-50 border border-blue-100 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
              <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-blue-900">You&apos;re on the Free plan</p>
              <p className="text-xs text-blue-600">{tierInfo.audits} audits/day · Upgrade for 100/day + priority queue</p>
            </div>
          </div>
          <button className="shrink-0 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors">
            Upgrade →
          </button>
        </div>
      )}

      {/* ── Stats strip ── */}
      {!loading && audits.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <StatCard label="Total Audits" value={String(audits.length)} gradient="from-slate-50 to-slate-100" textColor="text-slate-900" />
          <StatCard label="Avg Score" value={avgScore !== null ? String(avgScore) : '—'} gradient="from-blue-50 to-indigo-50" textColor="text-blue-900" />
          <StatCard label="Need Attention" value={String(criticalCount)} gradient="from-red-50 to-orange-50" textColor="text-red-700" />
        </div>
      )}

      {/* ── Loading ── */}
      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-slate-100 animate-pulse" style={{ animationDelay: `${i * 80}ms` }} />
          ))}
        </div>
      )}

      {/* ── Error ── */}
      {!loading && error && (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-8 text-center">
          <p className="text-red-600 font-medium mb-3">{error}</p>
          <button onClick={() => window.location.reload()} className="text-sm text-red-500 underline">
            Retry
          </button>
        </div>
      )}

      {/* ── Sign in prompt (unauthenticated + no audits) ── */}
      {!loading && !error && audits.length === 0 && !isAuthenticated && (
        <div className="rounded-2xl border border-dashed border-slate-200 p-16 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
            <svg className="h-7 w-7 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-800 mb-1">Sign in to see your audits</h3>
          <p className="text-sm text-slate-400 mb-6">Your audit history is linked to your account</p>
          <Link
            href="/auth/signin"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            Sign in
          </Link>
        </div>
      )}

      {/* ── Empty state (authenticated) ── */}
      {!loading && !error && audits.length === 0 && isAuthenticated && (
        <div className="rounded-2xl border border-dashed border-slate-200 p-16 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50">
            <svg className="h-7 w-7 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-800 mb-1">No audits yet</h3>
          <p className="text-sm text-slate-400 mb-6">Run your first audit to start building history</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            Audit a website
          </Link>
        </div>
      )}

      {/* ── Audit list ── */}
      {!loading && !error && audits.length > 0 && (
        <>
          {!isAuthenticated && (
            <p className="text-xs text-slate-400 mb-3 flex items-center gap-1.5">
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Showing 20 most recent public audits.{' '}
              <Link href="/auth/signin" className="text-blue-500 hover:underline">Sign in</Link>
              {' '}to see your personal history.
            </p>
          )}
          <div className="space-y-3">
            {audits.map((audit) => (
              <AuditCard key={audit.id} {...audit} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  gradient,
  textColor,
}: {
  label: string;
  value: string;
  gradient: string;
  textColor: string;
}) {
  return (
    <div className={`rounded-xl border border-slate-100 bg-linear-to-br ${gradient} px-4 py-4`}>
      <div className={`text-2xl font-bold ${textColor} mb-0.5`}>{value}</div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  );
}
