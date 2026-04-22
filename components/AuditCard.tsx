'use client';

import { useState } from 'react';
import Link from 'next/link';
import ConfirmModal from '@/components/ConfirmModal';

interface AuditCardProps {
  id: string;
  url: string;
  overallScore: number | null;
  status: string;
  createdAt: string | Date;
  completedAt: string | Date | null;
  onDelete?: (id: string) => void;
}

function ScoreBadge({ score }: { score: number | null }) {
  if (score === null) return <span className="text-slate-400 text-sm">—</span>;
  const color =
    score >= 80
      ? 'bg-green-100 text-green-700'
      : score >= 50
      ? 'bg-amber-100 text-amber-700'
      : 'bg-red-100 text-red-700';
  return (
    <span className={`inline-flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold ${color}`}>
      {score}
    </span>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    COMPLETED: 'bg-green-100 text-green-700',
    PROCESSING: 'bg-blue-100 text-blue-700',
    PENDING: 'bg-slate-100 text-slate-600',
    FAILED: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${map[status] ?? 'bg-slate-100 text-slate-600'}`}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

function timeAgo(date: string | Date): string {
  const ms = Date.now() - new Date(date).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function AuditCard({ id, url, overallScore, status, createdAt, completedAt, onDelete }: AuditCardProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  let displayUrl = url;
  try { displayUrl = new URL(url).hostname; } catch { /* keep original */ }

  async function confirmDelete() {
    setDeleting(true);
    await onDelete!(id);
    setDeleting(false);
    setModalOpen(false);
  }

  return (
    <>
      <div className="group relative flex items-center gap-4 rounded-xl border border-slate-200 bg-white px-5 py-4 hover:border-blue-300 hover:shadow-md transition-all duration-200">
        <Link href={`/audit/${id}`} className="absolute inset-0 rounded-xl" aria-label={`View audit for ${displayUrl}`} />

        <ScoreBadge score={overallScore} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-semibold text-slate-900 truncate text-sm">{displayUrl}</p>
            <StatusPill status={status} />
          </div>
          <p className="text-xs text-slate-400 truncate">{url}</p>
        </div>

        <div className="relative z-10 flex items-center gap-3 shrink-0">
          <p className="text-xs text-slate-400">{timeAgo(completedAt ?? createdAt)}</p>
          {onDelete && (
            <button
              onClick={(e) => { e.preventDefault(); setModalOpen(true); }}
              className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
              title="Delete report"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
          <svg className="h-4 w-4 text-slate-300 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>

      <ConfirmModal
        open={modalOpen}
        title="Delete Report"
        message="This audit report will be permanently deleted. This cannot be undone."
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setModalOpen(false)}
      />
    </>
  );
}
