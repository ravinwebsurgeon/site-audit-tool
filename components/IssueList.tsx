'use client';

import { useState } from 'react';

interface Issue {
  id: string;
  category: string;
  severity: 'CRITICAL' | 'WARNING' | 'PASSED';
  title: string;
  description: string;
  recommendation: string;
}

const SEV = {
  CRITICAL: {
    order: 0,
    label: 'Critical',
    bg: 'rgba(239,68,68,0.1)',
    color: '#ef4444',
    border: 'rgba(239,68,68,0.25)',
    leftBar: '#ef4444',
    icon: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      </svg>
    ),
  },
  WARNING: {
    order: 1,
    label: 'Warning',
    bg: 'rgba(245,158,11,0.1)',
    color: '#f59e0b',
    border: 'rgba(245,158,11,0.25)',
    leftBar: '#f59e0b',
    icon: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  PASSED: {
    order: 2,
    label: 'Passed',
    bg: 'rgba(16,185,129,0.08)',
    color: '#10b981',
    border: 'rgba(16,185,129,0.2)',
    leftBar: '#10b981',
    icon: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
      </svg>
    ),
  },
};

const CAT_COLOR: Record<string, string> = {
  SEO: '#3b82f6',
  PERFORMANCE: '#f59e0b',
  SECURITY: '#10b981',
};

type Filter = 'ALL' | 'CRITICAL' | 'WARNING' | 'PASSED';

export default function IssueList({ issues }: { issues: Issue[] }) {
  const [filter, setFilter] = useState<Filter>('ALL');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const sorted = [...issues].sort((a, b) => SEV[a.severity].order - SEV[b.severity].order);
  const filtered = filter === 'ALL' ? sorted : sorted.filter((i) => i.severity === filter);

  const counts = {
    CRITICAL: issues.filter((i) => i.severity === 'CRITICAL').length,
    WARNING: issues.filter((i) => i.severity === 'WARNING').length,
    PASSED: issues.filter((i) => i.severity === 'PASSED').length,
  };

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const tabs: { key: Filter; label: string; count: number; activeStyle: React.CSSProperties; inactiveStyle: React.CSSProperties }[] = [
    {
      key: 'ALL',
      label: 'All',
      count: issues.length,
      activeStyle: { background: '#0f172a', color: 'white', borderColor: '#0f172a' },
      inactiveStyle: { background: 'white', color: '#475569', borderColor: '#e2e8f0' },
    },
    {
      key: 'CRITICAL',
      label: 'Critical',
      count: counts.CRITICAL,
      activeStyle: { background: '#dc2626', color: 'white', borderColor: '#dc2626' },
      inactiveStyle: { background: 'white', color: '#dc2626', borderColor: 'rgba(239,68,68,0.3)' },
    },
    {
      key: 'WARNING',
      label: 'Warning',
      count: counts.WARNING,
      activeStyle: { background: '#d97706', color: 'white', borderColor: '#d97706' },
      inactiveStyle: { background: 'white', color: '#d97706', borderColor: 'rgba(245,158,11,0.3)' },
    },
    {
      key: 'PASSED',
      label: 'Passed',
      count: counts.PASSED,
      activeStyle: { background: '#059669', color: 'white', borderColor: '#059669' },
      inactiveStyle: { background: 'white', color: '#059669', borderColor: 'rgba(16,185,129,0.3)' },
    },
  ];

  return (
    <div>
      {/* Filter tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className="inline-flex items-center gap-2 rounded-xl border px-3 sm:px-4 py-1.5 sm:py-2 text-sm font-semibold transition-all duration-150"
            style={filter === t.key ? t.activeStyle : t.inactiveStyle}
          >
            {t.label}
            <span
              className="rounded-full px-2 py-0.5 text-xs font-bold"
              style={
                filter === t.key
                  ? { background: 'rgba(255,255,255,0.2)', color: 'white' }
                  : { background: '#f1f5f9', color: '#64748b' }
              }
            >
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Issue list */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="flex flex-col items-center py-16 text-slate-400">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50">
              <svg className="h-8 w-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-base font-medium text-slate-500">No issues in this category</p>
          </div>
        )}

        {filtered.map((issue) => {
          const sev = SEV[issue.severity];
          const isOpen = expanded.has(issue.id);
          const catColor = CAT_COLOR[issue.category] ?? '#6366f1';

          return (
            <div
              key={issue.id}
              className="overflow-hidden rounded-2xl border bg-white shadow-sm transition-all duration-200 hover:shadow-md"
              style={{ borderColor: '#e2e8f0', borderLeftWidth: 4, borderLeftColor: sev.leftBar }}
            >
              <button
                onClick={() => toggle(issue.id)}
                className="flex w-full items-center gap-3 px-3 sm:px-6 py-3 sm:py-4 text-left transition-colors hover:bg-slate-50/80"
              >
                {/* Severity badge */}
                <span
                  className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border px-2 sm:px-3 py-1 sm:py-1.5 text-xs font-bold"
                  style={{ background: sev.bg, color: sev.color, borderColor: sev.border }}
                >
                  {sev.icon}
                  {sev.label}
                </span>

                {/* Category chip */}
                <span
                  className="hidden sm:block shrink-0 rounded-lg px-2.5 py-1 text-xs font-semibold uppercase tracking-wider"
                  style={{ background: `${catColor}14`, color: catColor }}
                >
                  {issue.category}
                </span>

                {/* Title */}
                <p className="flex-1 min-w-0 text-base font-semibold text-slate-800 truncate">
                  {issue.title}
                </p>

                {/* Chevron */}
                <svg
                  className={`h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Expanded content */}
              {isOpen && (
                <div className="border-t px-3 sm:px-6 pb-4 sm:pb-6 pt-4 sm:pt-5 animate-slide-down" style={{ borderColor: '#f1f5f9' }}>
                  <div className="space-y-4">
                    {/* What was found */}
                    <div>
                      <p className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400">
                        Finding
                      </p>
                      <p className="text-base leading-relaxed text-slate-600">{issue.description}</p>
                    </div>

                    {/* AI recommendation */}
                    <div
                      className="rounded-xl border p-5"
                      style={{
                        background: 'linear-gradient(135deg, rgba(99,102,241,0.05), rgba(139,92,246,0.05))',
                        borderColor: 'rgba(99,102,241,0.2)',
                      }}
                    >
                      <div className="mb-2.5 flex items-center gap-2">
                        <div
                          className="flex h-6 w-6 items-center justify-center rounded-lg"
                          style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
                        >
                          <svg className="h-3.5 w-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                        </div>
                        <p className="text-sm font-bold text-indigo-700 uppercase tracking-wider">
                          AI Recommendation
                        </p>
                      </div>
                      <p className="text-base leading-relaxed text-slate-700">{issue.recommendation}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
