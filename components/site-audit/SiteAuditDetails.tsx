'use client';

import { useEffect, useState, useCallback, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface PageReport {
  id: string;
  url: string;
  status: string;
  overallScore: number | null;
  createdAt: string;
  completedAt: string | null;
}

interface SiteAudit {
  id: string;
  rootUrl: string;
  status: string;
  totalPages: number;
  completedPages: number;
  failedPages: number;
  avgScore: number | null;
  sitemapUrl: string | null;
  pagesLimit: number;
  createdAt: string;
  completedAt: string | null;
  pageReports: PageReport[];
}

function scoreColor(score: number | null): string {
  if (score === null) return 'text-slate-400';
  if (score >= 80) return 'text-emerald-400';
  if (score >= 50) return 'text-amber-400';
  return 'text-red-400';
}

function scoreBg(score: number | null): string {
  if (score === null) return 'rgba(100,116,139,0.15)';
  if (score >= 80) return 'rgba(16,185,129,0.12)';
  if (score >= 50) return 'rgba(245,158,11,0.12)';
  return 'rgba(239,68,68,0.12)';
}

function statusBadge(status: string) {
  const map: Record<string, { label: string; style: React.CSSProperties }> = {
    PENDING:    { label: 'Pending',    style: { background: 'rgba(99,102,241,0.12)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.3)' } },
    PROCESSING: { label: 'Processing', style: { background: 'rgba(245,158,11,0.12)', color: '#fcd34d', border: '1px solid rgba(245,158,11,0.3)' } },
    COMPLETED:  { label: 'Completed',  style: { background: 'rgba(16,185,129,0.12)', color: '#6ee7b7', border: '1px solid rgba(16,185,129,0.3)' } },
    FAILED:     { label: 'Failed',     style: { background: 'rgba(239,68,68,0.12)',  color: '#fca5a5', border: '1px solid rgba(239,68,68,0.3)'  } },
  };
  const cfg = map[status] ?? map.PENDING;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold" style={cfg.style}>
      {status === 'PROCESSING' && (
        <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      )}
      {cfg.label}
    </span>
  );
}

const POLL_INTERVAL = 5000;

export default function SiteAuditDetails({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [audit, setAudit] = useState<SiteAudit | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Full fetch — used on initial load and when audit finishes
  const fetchFull = useCallback(async (): Promise<SiteAudit | null> => {
    try {
      const res = await fetch(`/api/audits/site/${id}`);
      if (res.status === 401) { router.push('/auth/signin'); return null; }
      if (!res.ok) { setError('Failed to load audit'); return null; }
      const json = await res.json();
      if (json.success) { setAudit(json.data); return json.data; }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
    return null;
  }, [id, router]);

  // Lightweight poll — returns only status + counts, no pageReports
  const fetchProgress = useCallback(async (): Promise<{ status: string } | null> => {
    try {
      const res = await fetch(`/api/audits/site/${id}?summary=1`);
      if (!res.ok) return null;
      const json = await res.json();
      if (json.success) {
        setAudit(prev => prev ? { ...prev, ...json.data } : null);
        return json.data;
      }
    } catch { /* swallow poll errors */ }
    return null;
  }, [id]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    let active = true;

    const poll = async () => {
      if (!active) return;
      const data = await fetchProgress();
      if (!active) return;
      if (data?.status === 'COMPLETED' || data?.status === 'FAILED') {
        fetchFull(); // refresh once to get final pageReports
      } else if (data?.status === 'PENDING' || data?.status === 'PROCESSING') {
        timer = setTimeout(poll, POLL_INTERVAL);
      }
    };

    fetchFull().then((data) => {
      if (!active) return;
      if (data?.status === 'PENDING' || data?.status === 'PROCESSING') {
        timer = setTimeout(poll, POLL_INTERVAL);
      }
    });

    return () => {
      active = false;
      if (timer) clearTimeout(timer);
    };
  }, [fetchFull, fetchProgress]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0b1120' }}>
        <div className="flex flex-col items-center gap-4">
          <svg className="h-10 w-10 animate-spin text-indigo-400" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <p className="text-slate-400 text-sm">Loading site audit…</p>
        </div>
      </div>
    );
  }

  if (error || !audit) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0b1120' }}>
        <div className="text-center">
          <p className="text-red-400 mb-4">{error ?? 'Audit not found'}</p>
          <Link href="/dashboard" className="text-indigo-400 hover:underline text-sm">Back to dashboard</Link>
        </div>
      </div>
    );
  }

  const isActive = audit.status === 'PENDING' || audit.status === 'PROCESSING';
  const progressPct = audit.totalPages > 0
    ? Math.round(((audit.completedPages + audit.failedPages) / audit.totalPages) * 100)
    : 0;

  const sortedPages = [...audit.pageReports].sort((a, b) => {
    if (a.overallScore !== null && b.overallScore !== null) return a.overallScore - b.overallScore;
    if (a.overallScore !== null) return -1;
    if (b.overallScore !== null) return 1;
    return 0;
  });

  return (
    <div className="min-h-screen px-4 py-10 sm:px-6" style={{ background: '#0b1120' }}>
      <div className="mx-auto max-w-5xl space-y-8">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <Link href="/dashboard" className="mb-3 inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors">
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Dashboard
            </Link>
            <h1 className="text-xl font-bold text-white truncate">{audit.rootUrl}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {statusBadge(audit.status)}
              {audit.sitemapUrl && (
                <span className="text-xs text-slate-500">
                  via sitemap
                </span>
              )}
              {!audit.sitemapUrl && audit.totalPages > 0 && (
                <span className="text-xs text-slate-500">via link discovery</span>
              )}
            </div>
          </div>

          {audit.status === 'COMPLETED' && audit.avgScore !== null && (
            <div
              className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-2xl"
              style={{ background: scoreBg(audit.avgScore), border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <span className={`text-3xl font-extrabold tabular-nums ${scoreColor(audit.avgScore)}`}>
                {audit.avgScore}
              </span>
              <span className="text-xs text-slate-500 mt-0.5">avg score</span>
            </div>
          )}
        </div>

        {/* Progress section — shown while processing */}
        {isActive && (
          <div
            className="rounded-2xl border p-6"
            style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-slate-300">Auditing pages…</span>
              <span className="text-sm tabular-nums text-slate-400">
                {audit.completedPages + audit.failedPages} / {audit.totalPages || '?'}
              </span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progressPct}%`,
                  background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                }}
              />
            </div>
            {audit.totalPages > 0 && (
              <p className="mt-2 text-xs text-slate-500">
                {audit.completedPages} completed · {audit.failedPages} failed · {audit.totalPages - audit.completedPages - audit.failedPages} pending
              </p>
            )}
          </div>
        )}

        {/* Stats row */}
        {audit.totalPages > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total Pages', value: audit.totalPages.toString(), color: 'text-white' },
              { label: 'Completed',   value: audit.completedPages.toString(), color: 'text-emerald-400' },
              { label: 'Failed',      value: audit.failedPages.toString(),    color: audit.failedPages > 0 ? 'text-red-400' : 'text-slate-400' },
              { label: 'Avg Score',   value: audit.avgScore !== null ? audit.avgScore.toString() : '—', color: scoreColor(audit.avgScore) },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border p-4"
                style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' }}
              >
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{s.label}</p>
                <p className={`text-2xl font-extrabold tabular-nums ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Page list */}
        {sortedPages.length > 0 && (
          <div>
            <h2 className="mb-4 text-sm font-semibold text-slate-400 uppercase tracking-wider">
              Pages ({sortedPages.length})
            </h2>
            <div className="space-y-2">
              {sortedPages.map((page) => (
                <div
                  key={page.id}
                  className="flex items-center justify-between gap-3 rounded-xl border px-4 py-3 transition-all hover:border-indigo-500/30"
                  style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' }}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-slate-300" title={page.url}>
                      {page.url.replace(/^https?:\/\/[^/]+/, '') || '/'}
                    </p>
                    <p className="text-xs text-slate-600 truncate">{page.url}</p>
                  </div>

                  <div className="flex shrink-0 items-center gap-3">
                    {page.status === 'COMPLETED' && page.overallScore !== null ? (
                      <span
                        className={`w-10 text-center text-sm font-bold tabular-nums ${scoreColor(page.overallScore)}`}
                      >
                        {page.overallScore}
                      </span>
                    ) : (
                      <span className="w-10 text-center text-xs text-slate-600">
                        {page.status === 'PROCESSING' || page.status === 'PENDING' ? '…' : '—'}
                      </span>
                    )}

                    {page.status === 'COMPLETED' ? (
                      <Link
                        href={`/audit/${page.id}`}
                        className="rounded-lg border px-3 py-1.5 text-xs font-semibold text-slate-300 transition-all hover:border-indigo-500/50 hover:text-indigo-300"
                        style={{ borderColor: 'rgba(255,255,255,0.1)' }}
                      >
                        View
                      </Link>
                    ) : (
                      <span
                        className="rounded-lg px-3 py-1.5 text-xs font-semibold"
                        style={{
                          background: page.status === 'FAILED' ? 'rgba(239,68,68,0.1)' : 'rgba(99,102,241,0.1)',
                          color: page.status === 'FAILED' ? '#fca5a5' : '#a5b4fc',
                        }}
                      >
                        {page.status === 'FAILED' ? 'Failed' : 'Pending'}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty / failed state */}
        {audit.status === 'FAILED' && (
          <div
            className="rounded-2xl border p-8 text-center"
            style={{ background: 'rgba(239,68,68,0.06)', borderColor: 'rgba(239,68,68,0.2)' }}
          >
            <p className="text-red-400 font-semibold mb-1">Site audit failed</p>
            <p className="text-sm text-slate-500">The audit could not be completed. Please try again.</p>
            <Link
              href="/dashboard"
              className="mt-5 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
            >
              Back to dashboard
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}
