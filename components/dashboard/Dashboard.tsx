'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useToast } from '@/components/Toast';
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
  FREE:       { label: 'Free',       audits: 5,        upgrade: true },
  PRO:        { label: 'Pro',        audits: 100,       upgrade: false },
  ENTERPRISE: { label: 'Enterprise', audits: Infinity,  upgrade: false },
};

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  valueColor: string;
  trend?: string;
}

function StatCard({ label, value, icon, iconBg, iconColor, valueColor, trend }: StatCardProps) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl border bg-white px-5 py-5 transition-all duration-200 hover:shadow-md hover:-translate-y-px"
      style={{ borderColor: '#e8edf5' }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{label}</p>
          <p className={`text-3xl font-extrabold tabular-nums ${valueColor}`}>{value}</p>
          {trend && <p className="mt-1 text-xs text-slate-400">{trend}</p>}
        </div>
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
          style={{ background: iconBg, color: iconColor }}
        >
          {icon}
        </div>
      </div>
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

  const toast = useToast();
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

  async function handleDelete(id: string) {
    const res = await fetch(`/api/audits/${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (json.success) {
      setAudits((prev) => prev.filter((a) => a.id !== id));
      setPagination((prev) => ({ ...prev, total: prev.total - 1 }));
      toast.success('Audit deleted successfully');
    } else {
      toast.error(json.message ?? 'Failed to delete audit');
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
  const userName = session?.user?.name?.split(' ')[0] ?? '';

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">

      {/* ── Page header ── */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            {isAuthenticated
              ? userName ? `Welcome back, ${userName}` : 'My Audits'
              : 'Recent Audits'}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {isAuthenticated
              ? 'Track your audit history and website health over time'
              : 'Browse recent public audits — sign in to track your own'}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          {/* {isAuthenticated && (
            <Link
              href="/schedules"
              className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:border-indigo-200 hover:text-indigo-700 transition-all shadow-sm"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Schedules
            </Link>
          )} */}
          <Link
            href="/"
            className="inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:opacity-90 hover:shadow-md"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Audit
          </Link>
        </div>
      </div>

      {/* ── Subscription upgrade banner ── */}
      {isAuthenticated && tierInfo.upgrade && (
        <div
          className="mb-7 relative overflow-hidden flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border px-5 py-4"
          style={{
            background: 'linear-gradient(135deg, rgba(99,102,241,0.06), rgba(139,92,246,0.06))',
            borderColor: 'rgba(99,102,241,0.2)',
          }}
        >
          {/* Bg glow */}
          <div
            className="absolute right-0 top-0 h-full w-1/3 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at right, rgba(99,102,241,0.15), transparent 70%)' }}
          />
          <div className="relative flex items-center gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
              style={{ background: 'rgba(99,102,241,0.12)', color: '#6366f1' }}
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-indigo-900">You&apos;re on the Free plan</p>
              <p className="text-xs text-indigo-600">{tierInfo.audits} audits/day · Upgrade for 100/day + scheduled audits + API access</p>
            </div>
          </div>
          <button
            className="relative self-end sm:self-auto shrink-0 rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
          >
            Upgrade to Pro →
          </button>
        </div>
      )}

      {/* ── Stats skeleton ── */}
      {loading && isAuthenticated && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-7">
          {Array.from({ length: 3 }).map((_, i) => <StatCardSkeleton key={i} />)}
        </div>
      )}

      {/* ── Stats ── */}
      {!loading && pagination.total > 0 && isAuthenticated && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-7">
          <StatCard
            label="Total Audits"
            value={String(pagination.total)}
            icon={
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            }
            iconBg="rgba(99,102,241,0.1)"
            iconColor="#6366f1"
            valueColor="text-slate-900"
            trend="across all websites"
          />
          <StatCard
            label="Average Score"
            value={avgScore !== null ? `${avgScore}/100` : '—'}
            icon={
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
            iconBg="rgba(59,130,246,0.1)"
            iconColor="#3b82f6"
            valueColor="text-blue-700"
            trend="from completed audits"
          />
          <StatCard
            label="Need Attention"
            value={String(criticalCount)}
            icon={
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            }
            iconBg="rgba(239,68,68,0.1)"
            iconColor="#ef4444"
            valueColor="text-red-600"
            trend="sites scoring below 50"
          />
        </div>
      )}

      {/* ── Score trend chart ── */}
      {isAuthenticated && !loading && trendData.filter((a) => a.status === 'COMPLETED').length >= 2 && (
        <div className="mb-7 rounded-2xl border bg-white p-5 shadow-sm" style={{ borderColor: '#e8edf5' }}>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-700">Score Trend</h2>
              <p className="text-sm text-slate-400 mt-0.5">Overall score over your last {trendData.filter((a) => a.status === 'COMPLETED').length} audits</p>
            </div>
            <Link
              href="/compare"
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
            >
              Compare reports →
            </Link>
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
        <div className="rounded-2xl border border-red-100 bg-red-50 p-10 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100">
            <svg className="h-6 w-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-red-600 font-medium mb-3">{error}</p>
          <button onClick={() => setRefreshKey((k) => k + 1)} className="text-sm text-red-500 hover:text-red-700 font-medium underline">Retry</button>
        </div>
      )}

      {/* ── Sign-in prompt ── */}
      {!loading && !error && audits.length === 0 && !isAuthenticated && (
        <div className="rounded-2xl border border-dashed border-slate-200 p-16 text-center bg-white">
          <div
            className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{ background: 'rgba(99,102,241,0.08)' }}
          >
            <svg className="h-8 w-8" style={{ color: '#6366f1' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">Sign in to see your audits</h3>
          <p className="text-sm text-slate-400 mb-6 max-w-xs mx-auto">Your personal audit history is linked to your account and synced across devices</p>
          <Link
            href="/auth/signin"
            className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
          >
            Sign in to continue
          </Link>
        </div>
      )}

      {/* ── Empty state (authenticated) ── */}
      {!loading && !error && audits.length === 0 && isAuthenticated && (
        <div className="rounded-2xl border border-dashed border-slate-200 p-16 text-center bg-white">
          <div
            className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{ background: 'rgba(99,102,241,0.08)' }}
          >
            <svg className="h-8 w-8" style={{ color: '#6366f1' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">No audits yet</h3>
          <p className="text-sm text-slate-400 mb-6 max-w-xs mx-auto">Run your first audit to start building a history of your website&apos;s health</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Audit a website
          </Link>
        </div>
      )}

      {/* ── Audit list ── */}
      {!loading && !error && audits.length > 0 && (
        <>
          {!isAuthenticated && (
            <div
              className="mb-4 flex items-center gap-2 rounded-xl border px-4 py-3 text-xs text-slate-500"
              style={{ background: 'rgba(99,102,241,0.04)', borderColor: 'rgba(99,102,241,0.15)' }}
            >
              <svg className="h-3.5 w-3.5 shrink-0 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Showing 20 most recent public audits.{' '}
              <Link href="/auth/signin" className="text-indigo-500 hover:underline font-medium">Sign in</Link>
              {' '}to see your personal history.
            </div>
          )}

          <div className="space-y-2.5">
            {audits.map((audit) => (
              <AuditCard key={audit.id} {...audit} onDelete={isAuthenticated ? handleDelete : undefined} />
            ))}
          </div>

          {/* Pagination */}
          {isAuthenticated && pagination.totalPages > 1 && (
            <div className="mt-8 flex flex-col items-center gap-2.5">
              <Pagination
                page={pagination.page}
                totalPages={pagination.totalPages}
                onPage={(p) => setPage(p)}
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
