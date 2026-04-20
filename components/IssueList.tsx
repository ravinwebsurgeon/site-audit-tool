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

interface IssueListProps {
  issues: Issue[];
}

const SEV = {
  CRITICAL: {
    order: 0,
    label: 'Critical',
    dot: 'bg-red-500',
    badge: 'bg-red-50 text-red-700 border-red-200',
    bar: 'bg-red-500',
    icon: (
      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
          d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      </svg>
    ),
  },
  WARNING: {
    order: 1,
    label: 'Warning',
    dot: 'bg-amber-500',
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    bar: 'bg-amber-500',
    icon: (
      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  PASSED: {
    order: 2,
    label: 'Passed',
    dot: 'bg-emerald-500',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    bar: 'bg-emerald-500',
    icon: (
      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
          d="M5 13l4 4L19 7" />
      </svg>
    ),
  },
};

const CAT_ICON: Record<string, React.ReactNode> = {
  SEO: (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  PERFORMANCE: (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  SECURITY: (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
};

type Filter = 'ALL' | 'CRITICAL' | 'WARNING' | 'PASSED';

export default function IssueList({ issues }: IssueListProps) {
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

  const tabs: { key: Filter; label: string; count?: number; active: string; inactive: string }[] = [
    {
      key: 'ALL',
      label: 'All',
      count: issues.length,
      active: 'bg-slate-900 text-white border-slate-900',
      inactive: 'bg-white text-slate-600 border-slate-200 hover:border-slate-400',
    },
    {
      key: 'CRITICAL',
      label: 'Critical',
      count: counts.CRITICAL,
      active: 'bg-red-600 text-white border-red-600',
      inactive: 'bg-white text-red-600 border-red-200 hover:border-red-400',
    },
    {
      key: 'WARNING',
      label: 'Warning',
      count: counts.WARNING,
      active: 'bg-amber-500 text-white border-amber-500',
      inactive: 'bg-white text-amber-600 border-amber-200 hover:border-amber-400',
    },
    {
      key: 'PASSED',
      label: 'Passed',
      count: counts.PASSED,
      active: 'bg-emerald-600 text-white border-emerald-600',
      inactive: 'bg-white text-emerald-600 border-emerald-200 hover:border-emerald-400',
    },
  ];

  return (
    <div>
      {/* Filter tabs */}
      <div className="mb-5 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-1.5 text-sm font-medium transition-all duration-150 ${
              filter === t.key ? t.active : t.inactive
            }`}
          >
            {t.label}
            <span
              className={`rounded-full px-1.5 py-0.5 text-xs font-semibold ${
                filter === t.key ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
              }`}
            >
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Issue cards */}
      <div className="space-y-2.5">
        {filtered.length === 0 && (
          <div className="flex flex-col items-center py-12 text-slate-400">
            <svg className="mb-3 h-10 w-10 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-sm">No issues in this category</p>
          </div>
        )}

        {filtered.map((issue) => {
          const sev = SEV[issue.severity];
          const isOpen = expanded.has(issue.id);

          return (
            <div
              key={issue.id}
              className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm transition-shadow hover:shadow-md"
            >
              {/* Row */}
              <button
                onClick={() => toggle(issue.id)}
                className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-slate-50/80"
              >
                {/* Category icon */}
                <span className="shrink-0 flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                  {CAT_ICON[issue.category] ?? (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  )}
                </span>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${sev.badge}`}
                    >
                      {sev.icon}
                      {sev.label}
                    </span>
                    <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      {issue.category}
                    </span>
                  </div>
                  <p className="mt-1 truncate font-medium text-slate-900">{issue.title}</p>
                </div>

                {/* Chevron */}
                <svg
                  className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Expanded content */}
              {isOpen && (
                <div className="border-t border-slate-100 px-5 pb-5 pt-4 animate-fade-in">
                  <div className="space-y-4">
                    <div>
                      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Issue
                      </p>
                      <p className="text-sm leading-relaxed text-slate-600">{issue.description}</p>
                    </div>
                    <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-4">
                      <div className="mb-1.5 flex items-center gap-1.5">
                        <svg className="h-3.5 w-3.5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
                          Recommendation
                        </p>
                      </div>
                      <p className="text-sm leading-relaxed text-indigo-900">{issue.recommendation}</p>
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
