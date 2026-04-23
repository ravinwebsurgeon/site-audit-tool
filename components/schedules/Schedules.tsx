'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import ConfirmModal from '@/components/ConfirmModal';
import { ScheduleCardSkeleton } from '@/components/Skeleton';

interface Schedule {
  id: string;
  url: string;
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  isActive: boolean;
  nextRunAt: string;
  lastRunAt: string | null;
  lastReportId: string | null;
  createdAt: string;
}

const FREQ_LABELS = { DAILY: 'Daily', WEEKLY: 'Weekly', MONTHLY: 'Monthly' };
const FREQ_COLORS = {
  DAILY: 'bg-violet-100 text-violet-700',
  WEEKLY: 'bg-blue-100 text-blue-700',
  MONTHLY: 'bg-emerald-100 text-emerald-700',
};

function timeUntil(iso: string) {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms < 0) return 'due now';
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (h === 0) return `in ${m}m`;
  if (h < 24) return m > 0 ? `in ${h}h ${m}m` : `in ${h}h`;
  return `in ${Math.floor(h / 24)}d`;
}

// function timeAgo(iso: string) {
//   const ms = Date.now() - new Date(iso).getTime();
//   const h = Math.floor(ms / 3600000);
//   if (h < 1) return 'just nows';
//   if (h < 24) return `${h}h ago`;
//   return `${Math.floor(h / 24)}d ago`;
// }

function timeAgo(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();

  const minutes = Math.floor(ms / 60000);
  const hours = Math.floor(ms / 3600000);
  const days = Math.floor(ms / 86400000);

  if (minutes < 1) return 'just now';

  if (minutes < 60) {
    return `${minutes} min${minutes === 1 ? '' : 's'} ago`;
  }

  if (hours < 24) {
    return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  }

  return `${days} day${days === 1 ? '' : 's'} ago`;
}

export default function SchedulesPage() {
  const { status: sessionStatus } = useSession();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ url: '', frequency: 'WEEKLY' as Schedule['frequency'] });
  const [formError, setFormError] = useState<string | null>(null);
  const [notifyOnComplete, setNotifyOnComplete] = useState(false);
  const [notifyLoading, setNotifyLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [runningNow, setRunningNow] = useState<string | null>(null);

  useEffect(() => {
    if (sessionStatus !== 'authenticated') return;
    fetch('/api/schedules')
      .then((r) => r.json())
      .then((d) => { if (d.success) setSchedules(d.data); })
      .finally(() => setLoading(false));
    fetch('/api/user')
      .then((r) => r.json())
      .then((d) => { if (d.success) setNotifyOnComplete(d.data.notifyOnComplete ?? false); });
  }, [sessionStatus]);

  async function toggleNotify() {
    setNotifyLoading(true);
    const next = !notifyOnComplete;
    try {
      const res = await fetch('/api/user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notifyOnComplete: next }),
      });
      const data = await res.json();
      if (data.success) setNotifyOnComplete(next);
    } finally {
      setNotifyLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setCreating(true);

    const normalized = form.url.trim().match(/^https?:\/\//) ? form.url.trim() : `https://${form.url.trim()}`;

    try {
      const res = await fetch('/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: normalized, frequency: form.frequency }),
      });
      const data = await res.json();
      if (data.success) {
        setSchedules((prev) => [data.data, ...prev]);
        setForm({ url: '', frequency: 'WEEKLY' });
      } else {
        setFormError(data.message ?? 'Failed to create schedule');
      }
    } catch {
      setFormError('Network error');
    } finally {
      setCreating(false);
    }
  }

  async function toggleActive(id: string, current: boolean) {
    const res = await fetch(`/api/schedules/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !current }),
    });
    if ((await res.json()).success) {
      setSchedules((prev) => prev.map((s) => s.id === id ? { ...s, isActive: !current } : s));
    }
  }

  async function handleRunNow(id: string) {
    setRunningNow(id);
    try {
      const res = await fetch(`/api/schedules/${id}/run`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setSchedules((prev) =>
          prev.map((s) => s.id === id ? { ...s, ...data.data.schedule } : s)
        );
      }
    } finally {
      setRunningNow(null);
    }
  }

  async function handleDelete(id: string) {
    setDeleting(true);
    const res = await fetch(`/api/schedules/${id}`, { method: 'DELETE' });
    if ((await res.json()).success) {
      setSchedules((prev) => prev.filter((s) => s.id !== id));
    }
    setDeleting(false);
    setDeleteTarget(null);
  }

  if (sessionStatus === 'unauthenticated') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600 mb-4">Sign in to manage scheduled audits.</p>
          <Link href="/auth/signin" className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Scheduled Audits</h1>
          <p className="text-sm text-slate-500 mt-0.5">Automatically re-audit sites on a recurring schedule</p>
        </div>
        <Link href="/dashboard" className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Dashboard
        </Link>
      </div>

      {/* Notify on complete toggle */}
      <div className="mb-6 flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <div>
          <p className="text-sm font-semibold text-slate-800">OnComplete Email notifications</p>
          <p className="text-xs text-slate-400 mt-0.5">Get an email when a scheduled audit completes</p>
        </div>
        <button
          type="button"
          onClick={toggleNotify}
          disabled={notifyLoading}
          aria-pressed={notifyOnComplete}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none disabled:opacity-50 ${
            notifyOnComplete ? 'bg-blue-600' : 'bg-slate-200'
          }`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform duration-200 ${
              notifyOnComplete ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Create form */}
      <form onSubmit={handleCreate} className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">New Schedule</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="example.com or https://example.com"
            value={form.url}
            onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
            required
            className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
          <select
            value={form.frequency}
            onChange={(e) => setForm((f) => ({ ...f, frequency: e.target.value as Schedule['frequency'] }))}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white"
          >
            <option value="DAILY">Daily</option>
            <option value="WEEKLY">Weekly</option>
            <option value="MONTHLY">Monthly</option>
          </select>
          <button
            type="submit"
            disabled={creating}
            className="shrink-0 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 transition-colors"
          >
            {creating ? 'Scheduling…' : 'Schedule'}
          </button>
        </div>
        {formError && <p className="mt-2 text-xs text-red-500">{formError}</p>}
      </form>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <ScheduleCardSkeleton key={i} />)}
        </div>
      ) : schedules.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 p-12 text-center">
          <svg className="mx-auto h-10 w-10 text-slate-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-slate-400">No schedules yet. Create one above to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {schedules.map((s) => {
            let displayUrl = s.url;
            try { displayUrl = new URL(s.url).hostname; } catch { /* keep original */ }

            return (
              <div
                key={s.id}
                className={`flex items-center gap-4 rounded-xl border bg-white px-5 py-4 transition-all ${s.isActive ? 'border-slate-200' : 'border-slate-100 opacity-60'}`}
              >
                <div className={`h-2.5 w-2.5 shrink-0 rounded-full ${s.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-semibold text-slate-900 text-sm truncate">{displayUrl}</p>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${FREQ_COLORS[s.frequency]}`}>
                      {FREQ_LABELS[s.frequency]}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 truncate">{s.url}</p>
                  <div className="mt-1 flex items-center gap-3 text-xs text-slate-400">
                    <span>Next run: <span className="text-slate-600 font-medium">{timeUntil(s.nextRunAt)}</span></span>
                    {s.lastRunAt && <span>Last run: {timeAgo(s.lastRunAt)}</span>}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {s.lastReportId && (
                    <Link
                      href={`/audit/${s.lastReportId}`}
                      className="text-xs text-blue-500 hover:underline"
                    >
                      Last report
                    </Link>
                  )}
                  {s.isActive && new Date(s.nextRunAt) <= new Date() && (
                    <button
                      onClick={() => handleRunNow(s.id)}
                      disabled={runningNow === s.id}
                      className="rounded-lg px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-50 transition-colors"
                    >
                      {runningNow === s.id ? 'Running…' : 'Run Now'}
                    </button>
                  )}
                  <button
                    onClick={() => toggleActive(s.id, s.isActive)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                      s.isActive
                        ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    }`}
                  >
                    {s.isActive ? 'Pause' : 'Resume'}
                  </button>
                  <button
                    onClick={() => setDeleteTarget(s.id)}
                    className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmModal
        open={deleteTarget !== null}
        title="Delete Schedule"
        message="This schedule will be permanently deleted and no further audits will run."
        loading={deleting}
        onConfirm={() => deleteTarget && handleDelete(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
