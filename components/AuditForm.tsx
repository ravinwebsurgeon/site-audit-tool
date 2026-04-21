'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export default function AuditForm() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    let normalized = url.trim();
    if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
      normalized = `https://${normalized}`;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/audits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: normalized }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setError(json.errors?.[0]?.message ?? json.message ?? 'Failed to start audit');
        return;
      }

      router.push(`/audit/${json.data.id}`);
    } catch {
      setError('Network error — please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div
        className="group flex items-center gap-2 rounded-2xl p-2 transition-all duration-200"
        style={{
          background: 'rgba(255,255,255,0.08)',
          border: '1.5px solid 0b1120',
          boxShadow: '0 0 0 0px rgba(99,102,241,0)',
        }}
        onFocus={() => {}}
      >
        {/* Globe icon */}
        <span className="pl-2 shrink-0" style={{ color: 'rgba(148,163,184,0.8)' }}>
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
            />
          </svg>
        </span>

        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter website URL — e.g. example.com"
          required
          className="min-w-0 flex-1 bg-transparent py-3.5 pr-2 text-lg font-medium outline-none placeholder:font-normal"
          style={{ color: 'white', caretColor: '#6366f1' }}
        />

        <button
          type="submit"
          disabled={loading || !url.trim()}
          className="shrink-0 inline-flex items-center gap-2 rounded-xl px-6 py-3.5 text-base font-semibold text-white shadow-lg transition-all duration-200 hover:opacity-90 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-40"
          style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', minWidth: 140 }}
        >
          {loading ? (
            <>
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Analyzing…
            </>
          ) : (
            <>
              Run Audit
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5-5 5M6 12h12" />
              </svg>
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="mt-4 flex items-start gap-3 rounded-xl border px-4 py-3.5 text-sm"
          style={{ background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)', color: '#fca5a5' }}>
          <svg className="mt-0.5 h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}
    </form>
  );
}
