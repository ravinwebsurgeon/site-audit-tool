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
    color: '#dc2626',
    border: 'rgba(239,68,68,0.2)',
    leftBar: '#ef4444',
    tabBg: 'rgba(239,68,68,0.1)',
    tabActiveBg: '#dc2626',
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
    bg: 'rgba(245,158,11,0.1)',
    color: '#d97706',
    border: 'rgba(245,158,11,0.2)',
    leftBar: '#f59e0b',
    tabBg: 'rgba(245,158,11,0.1)',
    tabActiveBg: '#d97706',
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
    bg: 'rgba(16,185,129,0.08)',
    color: '#059669',
    border: 'rgba(16,185,129,0.2)',
    leftBar: '#10b981',
    tabBg: 'rgba(16,185,129,0.1)',
    tabActiveBg: '#059669',
    icon: (
      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
      </svg>
    ),
  },
};

const CAT_CONFIG: Record<string, { color: string; bg: string }> = {
  SEO:         { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  PERFORMANCE: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  SECURITY:    { color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
};

type Filter = 'ALL' | 'CRITICAL' | 'WARNING' | 'PASSED';

export default function IssueList({ issues }: { issues: Issue[] }) {
  const [filter, setFilter] = useState<Filter>('ALL');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const sorted = [...issues].sort((a, b) => SEV[a.severity].order - SEV[b.severity].order);
  const filtered = filter === 'ALL' ? sorted : sorted.filter((i) => i.severity === filter);

  const counts = {
    CRITICAL: issues.filter((i) => i.severity === 'CRITICAL').length,
    WARNING:  issues.filter((i) => i.severity === 'WARNING').length,
    PASSED:   issues.filter((i) => i.severity === 'PASSED').length,
  };

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <div>
      {/* ── Filter tabs ── */}
      <div className="mb-6 flex flex-wrap gap-2">
        {/* All tab */}
        <button
          onClick={() => setFilter('ALL')}
          className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-all duration-150"
          style={
            filter === 'ALL'
              ? { background: '#0f172a', color: 'white', borderColor: '#0f172a' }
              : { background: 'white', color: '#475569', borderColor: '#e2e8f0' }
          }
        >
          All
          <span
            className="rounded-md px-1.5 py-0.5 text-xs font-bold"
            style={filter === 'ALL' ? { background: 'rgba(255,255,255,0.15)', color: 'white' } : { background: '#f1f5f9', color: '#64748b' }}
          >
            {issues.length}
          </span>
        </button>

        {(['CRITICAL', 'WARNING', 'PASSED'] as const).map((key) => {
          const sev = SEV[key];
          const active = filter === key;
          return (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-all duration-150"
              style={
                active
                  ? { background: sev.tabActiveBg, color: 'white', borderColor: sev.tabActiveBg }
                  : { background: 'white', color: sev.color, borderColor: sev.border }
              }
            >
              <span style={{ color: active ? 'white' : sev.color }}>{sev.icon}</span>
              {sev.label}
              <span
                className="rounded-md px-1.5 py-0.5 text-xs font-bold"
                style={active ? { background: 'rgba(255,255,255,0.2)', color: 'white' } : { background: sev.bg, color: sev.color }}
              >
                {counts[key]}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Issue list ── */}
      <div className="space-y-2.5">
        {filtered.length === 0 && (
          <div className="flex flex-col items-center py-16 text-center">
            <div
              className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
              style={{ background: 'rgba(148,163,184,0.08)', border: '1px solid rgba(148,163,184,0.15)' }}
            >
              <svg className="h-8 w-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-sm font-medium text-slate-500">No issues in this category</p>
            <p className="text-xs text-slate-400 mt-1">All clear!</p>
          </div>
        )}

        {filtered.map((issue) => {
          const sev = SEV[issue.severity];
          const isOpen = expanded.has(issue.id);
          const cat = CAT_CONFIG[issue.category] ?? { color: '#6366f1', bg: 'rgba(99,102,241,0.1)' };

          return (
            <div
              key={issue.id}
              className="overflow-hidden rounded-xl border bg-white transition-all duration-200 hover:shadow-sm"
              style={{
                borderColor: isOpen ? sev.border : '#e8edf5',
                borderLeftWidth: 3,
                borderLeftColor: sev.leftBar,
              }}
            >
              {/* Header */}
              <button
                onClick={() => toggle(issue.id)}
                className="flex w-full items-center gap-3 px-4 sm:px-5 py-3.5 text-left transition-colors hover:bg-slate-50/80"
              >
                {/* Severity badge */}
                <span
                  className="shrink-0 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold"
                  style={{ background: sev.bg, color: sev.color }}
                >
                  {sev.icon}
                  <span className="hidden xs:inline">{sev.label}</span>
                </span>

                {/* Category chip */}
                <span
                  className="hidden sm:block shrink-0 rounded-lg px-2.5 py-1 text-xs font-semibold uppercase tracking-wider"
                  style={{ background: cat.bg, color: cat.color }}
                >
                  {issue.category}
                </span>

                {/* Title */}
                <p className="flex-1 min-w-0 text-sm font-semibold text-slate-800 truncate">
                  {issue.title}
                </p>

                {/* Chevron */}
                <div
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-all duration-200"
                  style={{
                    background: isOpen ? 'rgba(99,102,241,0.1)' : 'transparent',
                    color: isOpen ? '#6366f1' : '#cbd5e1',
                  }}
                >
                  <svg
                    className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {/* Expanded content */}
              {isOpen && (
                <div
                  className="border-t px-4 sm:px-6 pb-5 pt-5 animate-slide-down"
                  style={{ borderColor: '#f1f5f9' }}
                >
                  <div className="space-y-4">
                    {/* Finding */}
                    <div>
                      <p className="mb-2 text-xs font-bold uppercase tracking-widest" style={{ color: '#94a3b8' }}>
                        Finding
                      </p>
                      <p className="text-sm leading-relaxed text-slate-600">{issue.description}</p>
                    </div>

                    {/* AI recommendation */}
                    <div
                      className="rounded-xl border p-4"
                      style={{
                        background: 'linear-gradient(135deg, rgba(99,102,241,0.04), rgba(139,92,246,0.04))',
                        borderColor: 'rgba(99,102,241,0.18)',
                      }}
                    >
                      <div className="mb-3 flex items-center gap-2">
                        <div
                          className="flex h-6 w-6 items-center justify-center rounded-lg shadow-sm"
                          style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
                        >
                          <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                        </div>
                        <p className="text-xs font-bold text-indigo-700 uppercase tracking-widest">
                          AI Recommendation
                        </p>
                      </div>
                      <p className="text-sm leading-relaxed text-slate-700">{issue.recommendation}</p>
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
