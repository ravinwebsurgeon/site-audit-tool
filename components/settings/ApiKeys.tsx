'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import ConfirmModal from '@/components/ConfirmModal';
import { ApiKeyCardSkeleton } from '@/components/Skeleton';
import { useToast } from '@/components/Toast';

interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  isActive: boolean;
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

function timeAgo(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const h = Math.floor(ms / 3600000);
  if (h < 1) return 'just now';
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function ApiKeysPage() {
  const toast = useToast();
  const { data: session, status: sessionStatus } = useSession();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<string | null>(null);
  const [revoking, setRevoking] = useState(false);

  const tier = session?.user?.subscriptionTier ?? 'FREE';
  const canCreate = tier !== 'FREE';

  useEffect(() => {
    if (sessionStatus !== 'authenticated') return;
    fetch('/api/keys')
      .then((r) => r.json())
      .then((d) => { if (d.success) setKeys(d.data); })
      .finally(() => setLoading(false));
  }, [sessionStatus]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (data.success) {
        setNewKey(data.data.rawKey);
        setKeys((prev) => [data.data, ...prev]);
        setName('');
        toast.success('API key created successfully');
      } else {
        toast.error(data.message ?? 'Failed to create key');
      }
    } catch {
      toast.error('Network error — please try again.');
    } finally {
      setCreating(false);
    }
  }

  async function handleRevoke(id: string) {
    setRevoking(true);
    const res = await fetch(`/api/keys?id=${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      setKeys((prev) => prev.map((k) => k.id === id ? { ...k, isActive: false } : k));
      toast.success('API key revoked');
    } else {
      toast.error('Failed to revoke key — please try again.');
    }
    setRevoking(false);
    setRevokeTarget(null);
  }

  async function copyKey() {
    if (!newKey) return;
    await navigator.clipboard.writeText(newKey);
    toast.success('Copied to clipboard!');
  }

  if (sessionStatus === 'unauthenticated') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600 mb-4">Sign in to manage API keys.</p>
          <Link href="/auth/signin" className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">Sign in</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">API Keys</h1>
          <p className="text-sm text-slate-500 mt-0.5">Use API keys to access audit data programmatically</p>
        </div>
        <Link href="/dashboard" className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Dashboard
        </Link>
      </div>

      {/* Upgrade gate */}
      {!canCreate && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-amber-900">Pro feature</p>
            <p className="text-xs text-amber-700 mt-0.5">API key access requires a Pro or Enterprise subscription.</p>
          </div>
          <button className="shrink-0 rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 transition-colors">
            Upgrade →
          </button>
        </div>
      )}

      {/* New key revealed */}
      {newKey && (
        <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <p className="text-sm font-semibold text-emerald-800 mb-2">Key created — copy it now, it won&apos;t be shown again</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded-lg bg-white border border-emerald-200 px-3 py-2 text-xs font-mono text-slate-800 truncate">
              {newKey}
            </code>
            <button
              onClick={copyKey}
              className="shrink-0 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors"
            >
              Copy
            </button>
          </div>
          <button onClick={() => setNewKey(null)} className="mt-2 text-xs text-emerald-600 hover:underline">Dismiss</button>
        </div>
      )}

      {/* Create form */}
      {canCreate && (
        <form onSubmit={handleCreate} className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Create API Key</h2>
          <div className="flex gap-3">
            <input
              placeholder="Key name (e.g. Production App)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
            <button
              type="submit"
              disabled={creating || !name}
              className="shrink-0 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 transition-colors"
            >
              {creating ? 'Creating…' : 'Create'}
            </button>
          </div>
        </form>
      )}

      {/* API usage example */}
      <div className="mb-6 rounded-xl border border-slate-100 bg-slate-50 p-4">
        <p className="text-xs font-semibold text-slate-500 mb-2">Usage example</p>
        <code className="text-xs text-slate-700 font-mono leading-relaxed whitespace-pre-wrap">
          {`curl https://your-domain.com/api/v1/audits \\\n  -H "Authorization: Bearer sk_..."`}
        </code>
      </div>

      {/* Key list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => <ApiKeyCardSkeleton key={i} />)}
        </div>
      ) : keys.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 p-12 text-center">
          <p className="text-sm text-slate-400">No API keys yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {keys.map((k) => (
            <div
              key={k.id}
              className={`flex items-center gap-4 rounded-xl border bg-white px-5 py-4 ${k.isActive ? 'border-slate-200' : 'border-slate-100 opacity-50'}`}
            >
              <div className={`h-2.5 w-2.5 shrink-0 rounded-full ${k.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900">{k.name}</p>
                <p className="text-xs font-mono text-slate-400">{k.prefix}••••••••</p>
                <div className="flex gap-3 mt-0.5 text-xs text-slate-400">
                  <span>Created {timeAgo(k.createdAt)}</span>
                  {k.lastUsedAt && <span>Used {timeAgo(k.lastUsedAt)}</span>}
                  {!k.isActive && <span className="text-red-400 font-medium">Revoked</span>}
                </div>
              </div>
              {k.isActive && (
                <button
                  onClick={() => setRevokeTarget(k.id)}
                  className="shrink-0 text-xs font-medium text-red-500 hover:bg-red-50 rounded-lg px-3 py-1.5 transition-colors"
                >
                  Revoke
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        open={revokeTarget !== null}
        title="Revoke API Key"
        message="This API key will be permanently revoked and can no longer be used."
        confirmLabel="Revoke"
        loading={revoking}
        onConfirm={() => revokeTarget && handleRevoke(revokeTarget)}
        onCancel={() => setRevokeTarget(null)}
      />
    </div>
  );
}
