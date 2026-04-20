'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import ScoreCard from '@/components/ScoreCard';
import IssueList from '@/components/IssueList';

interface AuditSection {
  id: string;
  category: string;
  score: number;
}

interface AuditIssue {
  id: string;
  category: string;
  severity: 'CRITICAL' | 'WARNING' | 'PASSED';
  title: string;
  description: string;
  recommendation: string;
}

interface AuditReport {
  id: string;
  url: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  overallScore: number | null;
  errorMessage?: string | null;
  completedAt?: string | null;
  sections: AuditSection[];
  issues: AuditIssue[];
}

// ── Score ring with gradient stroke ──────────────────────────────────────────
function ScoreRing({ score }: { score: number }) {
  const r = 60;
  const cx = 80;
  const cy = 80;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference - (score / 100) * circumference;

  const gradId = 'scoreGrad';
  const isGood = score >= 80;
  const isMed = score >= 50;

  const [from, to] = isGood
    ? ['#10b981', '#34d399']
    : isMed
    ? ['#f59e0b', '#fbbf24']
    : ['#ef4444', '#f87171'];

  const textColor = isGood ? '#059669' : isMed ? '#d97706' : '#dc2626';

  return (
    <div className="flex flex-col items-center">
      <svg width="160" height="160" viewBox="0 0 160 160">
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={from} />
            <stop offset="100%" stopColor={to} />
          </linearGradient>
        </defs>
        {/* Track */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth="10" />
        {/* Progress arc */}
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform={`rotate(-90 ${cx} ${cy})`}
          style={{
            transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)',
          }}
        />
        {/* Score text */}
        <text
          x={cx} y={cy - 6}
          textAnchor="middle"
          fill={textColor}
          fontSize="38"
          fontWeight="800"
          fontFamily="var(--font-geist-sans, sans-serif)"
        >
          {score}
        </text>
        <text
          x={cx} y={cy + 16}
          textAnchor="middle"
          fill="#94a3b8"
          fontSize="11"
          fontWeight="500"
          fontFamily="var(--font-geist-sans, sans-serif)"
        >
          /100
        </text>
      </svg>
      <p className="mt-1 text-sm font-medium text-slate-500">Overall Score</p>
    </div>
  );
}

// ── Category icon nodes ───────────────────────────────────────────────────────
const CAT_ICONS: Record<string, React.ReactNode> = {
  SEO: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  PERFORMANCE: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  SECURITY: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
};

// ── Processing loader ─────────────────────────────────────────────────────────
function ProcessingLoader({ url, status }: { url?: string; status: string }) {
  const steps = [
    'Fetching website content',
    'Running SEO analysis',
    'Checking performance',
    'Scanning security headers',
    'Generating AI recommendations',
  ];
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setStep((s) => Math.min(s + 1, steps.length - 1)), 3000);
    return () => clearInterval(id);
  }, [steps.length]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        {/* Animated icon */}
        <div className="relative mx-auto mb-8 flex h-20 w-20 items-center justify-center">
          <div className="absolute h-20 w-20 animate-ping rounded-full bg-indigo-100 opacity-60" />
          <div className="absolute h-16 w-16 animate-ping rounded-full bg-indigo-200 opacity-40" style={{ animationDelay: '0.3s' }} />
          <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-linear-to-br from-blue-600 to-indigo-600 shadow-lg shadow-indigo-200">
            <svg className="h-7 w-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
        </div>

        <h2 className="text-xl font-bold text-slate-900">
          {status === 'PENDING' ? 'Queued for analysis' : 'Analyzing your website'}
        </h2>
        {url && (
          <p className="mt-1.5 truncate text-sm font-mono text-slate-400">{url}</p>
        )}

        {/* Step list */}
        <div className="mt-8 space-y-3 text-left">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-3">
              <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-500 ${
                i < step
                  ? 'border-indigo-500 bg-indigo-500'
                  : i === step
                  ? 'border-indigo-400 bg-indigo-50'
                  : 'border-slate-200 bg-white'
              }`}>
                {i < step ? (
                  <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : i === step ? (
                  <div className="h-2 w-2 animate-pulse rounded-full bg-indigo-500" />
                ) : null}
              </div>
              <span className={`text-sm transition-colors duration-300 ${
                i < step ? 'text-slate-400 line-through' : i === step ? 'font-medium text-slate-900' : 'text-slate-300'
              }`}>
                {s}
              </span>
            </div>
          ))}
        </div>

        <p className="mt-8 text-xs text-slate-400">This usually takes 10–20 seconds</p>
      </div>
    </div>
  );
}

// ── Error state ───────────────────────────────────────────────────────────────
function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50">
          <svg className="h-8 w-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-slate-900">Audit failed</h2>
        <p className="mt-2 text-sm text-slate-500">{message}</p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:from-blue-700 hover:to-indigo-700 transition-all"
        >
          Try again
        </Link>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AuditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [report, setReport] = useState<AuditReport | null>(null);
  const [status, setStatus] = useState<string>('PENDING');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/audits/${id}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          setReport(json.data);
          setStatus(json.data.status);
        } else {
          setError(json.message ?? 'Audit not found');
        }
      })
      .catch(() => setError('Failed to load audit'));
  }, [id]);

  useEffect(() => {
    if (status === 'COMPLETED' || status === 'FAILED' || error) return;

    const es = new EventSource(`/api/audits/${id}/status`);

    es.onmessage = (e) => {
      const data = JSON.parse(e.data) as { status?: string; error?: string };

      if (data.error) { setError(data.error); es.close(); return; }

      if (data.status) {
        setStatus(data.status);
        if (data.status === 'COMPLETED') {
          es.close();
          fetch(`/api/audits/${id}`)
            .then((r) => r.json())
            .then((json) => { if (json.success) setReport(json.data); });
        }
        if (data.status === 'FAILED') {
          es.close();
          setError('Audit processing failed. Please try again.');
        }
      }
    };

    es.onerror = () => es.close();
    return () => es.close();
  }, [id, status, error]);

  if (error) return <ErrorState message={error} />;
  if (status === 'PENDING' || status === 'PROCESSING') {
    return <ProcessingLoader url={report?.url} status={status} />;
  }
  if (!report) return null;

  const sectionMap = Object.fromEntries(report.sections.map((s) => [s.category, s.score]));
  const criticalCount = report.issues.filter((i) => i.severity === 'CRITICAL').length;
  const warningCount = report.issues.filter((i) => i.severity === 'WARNING').length;
  const passedCount = report.issues.filter((i) => i.severity === 'PASSED').length;

  const completedAt = report.completedAt
    ? (() => {
        const mins = Math.round(
          (new Date().getTime() - new Date(report.completedAt!).getTime()) / 60000
        );
        return mins <= 1 ? 'just now' : `${mins} minutes ago`;
      })()
    : null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 animate-fade-in">

      {/* ── Breadcrumb ── */}
      <div className="mb-6 flex items-center gap-2 text-sm">
        <Link href="/" className="flex items-center gap-1 text-slate-400 hover:text-slate-700 transition-colors">
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          New Audit
        </Link>
        <span className="text-slate-200">/</span>
        <span className="max-w-xs truncate font-mono text-xs text-slate-500">{report.url}</span>
        {completedAt && (
          <>
            <span className="text-slate-200">/</span>
            <span className="text-slate-400">{completedAt}</span>
          </>
        )}
      </div>

      {/* ── Score overview card ── */}
      <div className="mb-6 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        {/* Card header */}
        <div className="border-b border-slate-50 bg-slate-50/50 px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-bold text-slate-900">Audit Report</h1>
            <p className="mt-0.5 truncate text-sm text-slate-400 font-mono">{report.url}</p>
          </div>
          {/* Summary pills */}
          <div className="hidden sm:flex items-center gap-2">
            {criticalCount > 0 && (
              <span className="rounded-full bg-red-50 border border-red-200 px-3 py-1 text-xs font-semibold text-red-700">
                {criticalCount} Critical
              </span>
            )}
            {warningCount > 0 && (
              <span className="rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-semibold text-amber-700">
                {warningCount} Warnings
              </span>
            )}
            {passedCount > 0 && (
              <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-700">
                {passedCount} Passed
              </span>
            )}
          </div>
        </div>

        {/* Score layout */}
        <div className="p-6 flex flex-col lg:flex-row items-center gap-8">
          {report.overallScore !== null && (
            <div className="shrink-0">
              <ScoreRing score={report.overallScore} />
            </div>
          )}

          <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-3 gap-4">
            {(['SEO', 'PERFORMANCE', 'SECURITY'] as const).map((cat) => (
              <ScoreCard
                key={cat}
                category={cat}
                icon={CAT_ICONS[cat]}
                score={sectionMap[cat] ?? 0}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Issues card ── */}
      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="border-b border-slate-50 bg-slate-50/50 px-6 py-4">
          <h2 className="font-bold text-slate-900">
            Findings & Recommendations
          </h2>
          <p className="mt-0.5 text-sm text-slate-400">
            {report.issues.length} items · prioritized by severity
          </p>
        </div>
        <div className="p-6">
          <IssueList issues={report.issues} />
        </div>
      </div>

      {/* ── Re-audit CTA ── */}
      <div className="mt-6 flex justify-center">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-600 shadow-sm hover:border-slate-300 hover:bg-slate-50 transition-all"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Audit another site
        </Link>
      </div>
    </div>
  );
}
