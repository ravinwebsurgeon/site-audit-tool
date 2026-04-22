'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import AuditCard from '@/components/AuditCard';
import Pagination from '@/components/Pagination';
import ScoreTrendChart from '@/components/ScoreTrendChart';
import { AuditCardSkeleton, StatCardSkeleton } from '@/components/Skeleton';

interface AuditSummary {
  id: string;
  url: string;
  overallScore: number | null;
  status: string;
  createdAt: string;
  completedAt: string | null;
}

interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

const TIER_INFO = {
  FREE: { label: 'Free', audits: 5, color: 'text-slate-600', bg: 'bg-slate-100', upgrade: true },
  PRO: { label: 'Pro', audits: 100, color: 'text-blue-700', bg: 'bg-blue-100', upgrade: false },
  ENTERPRISE: { label: 'Enterprise', audits: Infinity, color: 'text-violet-700', bg: 'bg-violet-100', upgrade: false },
};

function StatCard({ label, value, gradient, textColor }: {
  label: string; value: string; gradient: string; textColor: string;
}) {
  return (
    <div className={`rounded-xl border border-slate-100 bg-gradient-to-br ${gradient} px-4 py-4`}>
      <div className={`text-2xl font-bold ${textColor} mb-0.5`}>{value}</div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  );
}

export default function DashboardPage() {
  const { data: session, status: sessionStatus } = useSession();
  const [audits, setAudits] = useState<AuditSummary[]>([]);
  const [trendData, setTrendData] = useState<AuditSummary[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({ page: 1, pageSize: 10, total: 0, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = sessionStatus === 'authenticated';

  useEffect(() => {
    if (sessionStatus === 'loading') return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        if (isAuthenticated) {
          const [pageRes, trendRes] = await Promise.all([
            fetch(`/api/audits?page=${page}&pageSize=10`),
            fetch(`/api/audits?page=1&pageSize=20`),
          ]);
          const pageData = await pageRes.json();
          const trendResult = await trendRes.json();
          if (!cancelled) {
            if (pageData.success) {
              setAudits(pageData.data);
              setPagination(pageData.pagination);
            } else {
              setError(pageData.message ?? 'Failed to load audits');
            }
            if (trendResult.success) setTrendData(trendResult.data);
          }
        } else {
          const res = await fetch('/api/audits/recent');
          const data = await res.json();
          if (!cancelled) {
            if (data.success) setAudits(data.data);
            else setError(data.message ?? 'Failed to load audits');
          }
        }
      } catch {
        if (!cancelled) setError('Network error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [sessionStatus, isAuthenticated, page, refreshKey]);

  const handlePage = (p: number) => setPage(p);

  async function handleDelete(id: string) {
    const res = await fetch(`/api/audits/${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (json.success) {
      setAudits((prev) => prev.filter((a) => a.id !== id));
      setPagination((prev) => ({ ...prev, total: prev.total - 1 }));
    } else {
      alert(json.message ?? 'Failed to delete audit');
    }
  }

  const completed = audits.filter((a) => a.status === 'COMPLETED');
  const avgScore =
    completed.length > 0
      ? Math.round(
          completed
            .filter((a) => a.overallScore !== null)
            .reduce((s, a) => s + (a.overallScore ?? 0), 0) /
            completed.filter((a) => a.overallScore !== null).length
        )
      : null;
  const criticalCount = completed.filter((a) => (a.overallScore ?? 100) < 50).length;

  const tier = session?.user?.subscriptionTier ?? 'FREE';
  const tierInfo = TIER_INFO[tier as keyof typeof TIER_INFO] ?? TIER_INFO.FREE;

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">

      {/* ── Header ── */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {isAuthenticated ? 'My Audits' : 'Recent Audits'}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {isAuthenticated
              ? 'Your personal audit history, linked to your account'
              : 'Browse recent public audits — sign in to track your own'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isAuthenticated && (
            <Link
              href="/schedules"
              className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-blue-300 hover:text-blue-700 transition-colors shadow-sm"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Schedules
            </Link>
          )}
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
      </div>

      {/* ── Subscription banner (FREE tier) ── */}
      {isAuthenticated && tierInfo.upgrade && (
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl bg-linear-to-r from-blue-50 to-indigo-50 border border-blue-100 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100">
              <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-blue-900">You&apos;re on the Free plan</p>
              <p className="text-xs text-blue-600">{tierInfo.audits} audits/day · Upgrade for 100/day + scheduled audits + API access</p>
            </div>
          </div>
          <button className="self-end sm:self-auto shrink-0 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors">
            Upgrade →
          </button>
        </div>
      )}

      {/* ── Stats strip skeleton ── */}
      {loading && isAuthenticated && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          {Array.from({ length: 3 }).map((_, i) => <StatCardSkeleton key={i} />)}
        </div>
      )}

      {/* ── Stats strip ── */}
      {!loading && pagination.total > 0 && isAuthenticated && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <StatCard label="Total Audits" value={String(pagination.total)} gradient="from-slate-50 to-slate-100" textColor="text-slate-900" />
          <StatCard label="Avg Score" value={avgScore !== null ? String(avgScore) : '—'} gradient="from-blue-50 to-indigo-50" textColor="text-blue-900" />
          <StatCard label="Need Attention" value={String(criticalCount)} gradient="from-red-50 to-orange-50" textColor="text-red-700" />
        </div>
      )}

      {/* ── Score trend chart ── */}
      {isAuthenticated && !loading && trendData.filter((a) => a.status === 'COMPLETED').length >= 2 && (
        <div className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">Score Trend</h2>
            <Link href="/compare" className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">Compare reports →</Link>
          </div>
          <ScoreTrendChart data={trendData.filter((a) => a.status === 'COMPLETED')} />
        </div>
      )}

      {/* ── Loading ── */}
      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <AuditCardSkeleton key={i} />)}
        </div>
      )}

      {/* ── Error ── */}
      {!loading && error && (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-8 text-center">
          <p className="text-red-600 font-medium mb-3">{error}</p>
          <button onClick={() => setRefreshKey((k) => k + 1)} className="text-sm text-red-500 underline">Retry</button>
        </div>
      )}

      {/* ── Sign-in prompt ── */}
      {!loading && !error && audits.length === 0 && !isAuthenticated && (
        <div className="rounded-2xl border border-dashed border-slate-200 p-16 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
            <svg className="h-7 w-7 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-800 mb-1">Sign in to see your audits</h3>
          <p className="text-sm text-slate-400 mb-6">Your audit history is linked to your account</p>
          <Link href="/auth/signin" className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors">
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
          <Link href="/" className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors">
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
              <AuditCard key={audit.id} {...audit} onDelete={isAuthenticated ? handleDelete : undefined} />
            ))}
          </div>

          {/* ── Pagination ── */}
          {isAuthenticated && pagination.totalPages > 1 && (
            <div className="mt-6 flex flex-col items-center gap-2">
              <Pagination
                page={pagination.page}
                totalPages={pagination.totalPages}
                onPage={handlePage}
              />
              <p className="text-xs text-slate-400">
                Showing {(pagination.page - 1) * pagination.pageSize + 1}–{Math.min(pagination.page * pagination.pageSize, pagination.total)} of {pagination.total} audits
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
