'use client';

import { useState } from 'react';
import Link from 'next/link';
import ConfirmModal from '@/components/ConfirmModal';

interface SiteAuditCardProps {
  id: string;
  rootUrl: string;
  status: string;
  avgScore: number | null;
  totalPages: number;
  completedPages: number;
  failedPages: number;
  createdAt: string;
  completedAt: string | null;
  onDelete?: (id: string) => void;
}

function ScoreBadge({ score }: { score: number | null }) {
  if (score === null) {
    return (
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold"
        style={{ background: 'rgba(148,163,184,0.1)', color: '#94a3b8' }}
      >
        —
      </div>
    );
  }
  const [bg, color, glow] =
    score >= 80
      ? ['rgba(16,185,129,0.12)', '#10b981', 'rgba(16,185,129,0.2)']
      : score >= 50
      ? ['rgba(245,158,11,0.12)', '#f59e0b', 'rgba(245,158,11,0.2)']
      : ['rgba(239,68,68,0.12)', '#ef4444', 'rgba(239,68,68,0.2)'];
  return (
    <div
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg font-extrabold tabular-nums"
      style={{ background: bg, color, boxShadow: `0 0 0 1px ${glow}` }}
    >
      {score}
    </div>
  );
}

const STATUS_CONFIG: Record<string, { bg: string; color: string; dot: string; label: string }> = {
  COMPLETED:  { bg: 'rgba(16,185,129,0.1)',  color: '#10b981', dot: '#10b981', label: 'Completed'  },
  PROCESSING: { bg: 'rgba(59,130,246,0.1)',  color: '#3b82f6', dot: '#3b82f6', label: 'Processing' },
  PENDING:    { bg: 'rgba(148,163,184,0.1)', color: '#64748b', dot: '#94a3b8', label: 'Pending'    },
  FAILED:     { bg: 'rgba(239,68,68,0.1)',   color: '#ef4444', dot: '#ef4444', label: 'Failed'     },
};

function StatusPill({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.PENDING;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
      style={{ background: cfg.bg, color: cfg.color }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: cfg.dot }} />
      {cfg.label}
    </span>
  );
}

function timeAgo(date: string): string {
  const ms = Date.now() - new Date(date).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function SiteAuditCard({
  id, rootUrl, status, avgScore, totalPages, completedPages, failedPages,
  createdAt, completedAt, onDelete,
}: SiteAuditCardProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  let displayUrl = rootUrl;
  try { displayUrl = new URL(rootUrl).hostname; } catch { /* keep original */ }

  async function confirmDelete() {
    setDeleting(true);
    await onDelete!(id);
    setDeleting(false);
    setModalOpen(false);
  }

  const progressPct = totalPages > 0
    ? Math.round(((completedPages + failedPages) / totalPages) * 100)
    : 0;
  const isActive = status === 'PENDING' || status === 'PROCESSING';

  return (
    <>
      <div
        className="group relative flex items-center gap-4 rounded-xl border bg-white px-5 py-4 transition-all duration-200 hover:-translate-y-px hover:shadow-lg"
        style={{ borderColor: '#e8edf5' }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(99,102,241,0.25)'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = '#e8edf5'; }}
      >
        <Link href={`/site-audit/${id}`} className="absolute inset-0 rounded-xl" aria-label={`View site audit for ${displayUrl}`} />

        <ScoreBadge score={avgScore} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <p className="font-semibold text-slate-800 truncate text-lg">{displayUrl}</p>
            <StatusPill status={status} />
          </div>
          <p className="text-xs text-slate-400 truncate font-mono">{rootUrl}</p>

          {isActive && totalPages > 0 && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-slate-100">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${progressPct}%`, background: 'linear-gradient(90deg,#6366f1,#8b5cf6)' }}
                />
              </div>
              <span className="text-xs text-slate-400 tabular-nums shrink-0">
                {completedPages + failedPages}/{totalPages}
              </span>
            </div>
          )}

          {status === 'COMPLETED' && (
            <p className="mt-1 text-xs text-slate-400">
              {totalPages} pages · {completedPages} completed · {failedPages} failed
            </p>
          )}
        </div>

        <div className="relative z-10 flex items-center gap-3 shrink-0">
          <p className="text-sm text-slate-400 hidden sm:block whitespace-nowrap">
            {timeAgo(completedAt ?? createdAt)}
          </p>
          {onDelete && (
            <button
              onClick={(e) => { e.preventDefault(); setModalOpen(true); }}
              className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
              title="Delete report"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
          <div className="flex h-7 w-7 items-center justify-center rounded-lg">
            <svg className="h-4 w-4 text-slate-300 group-hover:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>

      <ConfirmModal
        open={modalOpen}
        title="Delete Site Audit"
        message="This site audit and all its page reports will be permanently deleted. This cannot be undone."
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setModalOpen(false)}
      />
    </>
  );
}
