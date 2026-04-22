'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

/* ─── Types ──────────────────────────────────────────────────────────────── */

interface AuditListItem {
  id: string;
  url: string;
  status: string;
  overallScore: number | null;
  createdAt: string;
  completedAt: string | null;
}

interface AuditSection { category: string; score: number }
interface AuditIssue { id: string; category: string; severity: 'CRITICAL' | 'WARNING' | 'PASSED'; title: string }
interface Report {
  id: string; url: string; status: string;
  overallScore: number | null; completedAt: string | null;
  sections: AuditSection[]; issues: AuditIssue[];
}

/* ─── Utilities ──────────────────────────────────────────────────────────── */

function getDomain(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, ''); }
  catch { return url; }
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  if (d < 7) return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function scoreBg(s: number | null) {
  if (s === null) return 'text-slate-400';
  if (s >= 80) return 'text-emerald-600';
  if (s >= 50) return 'text-amber-500';
  return 'text-red-500';
}

function barColor(s: number | null) {
  if (s === null) return 'bg-slate-200';
  if (s >= 80) return 'bg-emerald-500';
  if (s >= 50) return 'bg-amber-400';
  return 'bg-red-400';
}

/* ─── ScoreBadge ─────────────────────────────────────────────────────────── */

function ScoreBadge({ score }: { score: number | null }) {
  if (score === null) return (
    <span className="text-xs text-slate-400 bg-slate-100 rounded-full px-2 py-0.5 font-medium">—</span>
  );
  const cls = score >= 80
    ? 'bg-emerald-100 text-emerald-700'
    : score >= 50 ? 'bg-amber-100 text-amber-700'
    : 'bg-red-100 text-red-700';
  return <span className={`text-xs font-bold rounded-full px-2.5 py-0.5 tabular-nums ${cls}`}>{score}</span>;
}

/* ─── CategoryBar ────────────────────────────────────────────────────────── */

function CategoryBar({ cat, a, b }: { cat: string; a: Report; b: Report }) {
  const sa = a.sections.find((s) => s.category === cat)?.score ?? null;
  const sb = b.sections.find((s) => s.category === cat)?.score ?? null;
  const diff = sa !== null && sb !== null ? sb - sa : null;

  return (
    <div className="py-3 border-b border-slate-100 last:border-0">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm font-medium text-slate-600 w-28 shrink-0 capitalize">
          {cat.charAt(0) + cat.slice(1).toLowerCase()}
        </span>
        <span className={`text-sm font-bold w-7 text-right shrink-0 tabular-nums ${scoreBg(sa)}`}>{sa ?? '—'}</span>
        <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
          <div
            className={`h-2 rounded-full transition-all duration-700 ease-out ${barColor(sa)}`}
            style={{ width: `${sa ?? 0}%` }}
          />
        </div>
        <div className="w-14 flex justify-center shrink-0">
          {diff !== null && (
            <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full tabular-nums ${
              diff > 0 ? 'bg-emerald-100 text-emerald-700'
              : diff < 0 ? 'bg-red-100 text-red-600'
              : 'bg-slate-100 text-slate-500'
            }`}>
              {diff > 0 ? `+${diff}` : diff === 0 ? '=' : String(diff)}
            </span>
          )}
        </div>
        <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
          <div
            className={`h-2 rounded-full transition-all duration-700 ease-out ${barColor(sb)}`}
            style={{ width: `${sb ?? 0}%` }}
          />
        </div>
        <span className={`text-sm font-bold w-7 shrink-0 tabular-nums ${scoreBg(sb)}`}>{sb ?? '—'}</span>
      </div>
    </div>
  );
}

/* ─── ReportPicker ───────────────────────────────────────────────────────── */

function ReportPicker({
  label, accent, selectedId, onSelect, audits, excludeId,
}: {
  label: string; accent: 'blue' | 'indigo';
  selectedId: string; onSelect: (id: string) => void;
  audits: AuditListItem[]; excludeId?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selected = audits.find((a) => a.id === selectedId) ?? null;
  const dot = accent === 'blue' ? 'bg-blue-500' : 'bg-indigo-500';
  const labelCls = accent === 'blue' ? 'text-blue-600' : 'text-indigo-600';
  const focusBorder = accent === 'blue' ? 'border-blue-400 ring-2 ring-blue-100' : 'border-indigo-400 ring-2 ring-indigo-100';

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 40);
  }, [open]);

  const filtered = audits.filter(
    (a) => a.id !== excludeId && (!search || a.url.toLowerCase().includes(search.toLowerCase())),
  );
  const groups: Record<string, AuditListItem[]> = {};
  for (const a of filtered) {
    const d = getDomain(a.url);
    if (!groups[d]) groups[d] = [];
    groups[d].push(a);
  }

  return (
    <div className="flex-1 min-w-0" ref={wrapRef}>
      <div className="flex items-center gap-1.5 mb-2">
        <span className={`h-2 w-2 rounded-full ${dot}`} />
        <span className={`text-xs font-bold uppercase tracking-wider ${labelCls}`}>{label}</span>
      </div>

      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full text-left rounded-2xl border-2 bg-white p-4 transition-all hover:shadow-sm group ${
          open ? (accent === 'blue' ? 'border-blue-400' : 'border-indigo-400') : 'border-slate-200 hover:border-slate-300'
        }`}
      >
        {selected ? (
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-800 truncate">{getDomain(selected.url)}</p>
              <p className="text-xs text-slate-400 truncate mt-0.5">{selected.url}</p>
              <p className="text-xs text-slate-400 mt-1">{timeAgo(selected.createdAt)}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <ScoreBadge score={selected.overallScore} />
              <svg className={`h-4 w-4 text-slate-300 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Select a report…</span>
            <svg className={`h-4 w-4 text-slate-300 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        )}
      </button>

      {open && (
        <div className="absolute z-40 left-0 right-0 mt-2 bg-white rounded-2xl border border-slate-200 shadow-2xl shadow-slate-200/60 overflow-hidden">
          <div className="p-3 border-b border-slate-100">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={searchRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by URL…"
                className={`w-full pl-8 pr-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none ${focusBorder}`}
              />
            </div>
          </div>

          <div className="max-h-72 overflow-y-auto overscroll-contain">
            {Object.keys(groups).length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">No reports found</p>
            ) : (
              Object.entries(groups).map(([domain, items]) => (
                <div key={domain}>
                  <div className="sticky top-0 z-10 flex items-center gap-2 bg-slate-50/90 backdrop-blur-sm px-4 py-2 border-b border-slate-100">
                    <svg className="h-3.5 w-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" />
                    </svg>
                    <span className="text-xs font-semibold text-slate-600">{domain}</span>
                    <span className="text-xs text-slate-400">· {items.length} {items.length === 1 ? 'run' : 'runs'}</span>
                  </div>

                  {items.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => { onSelect(item.id); setOpen(false); setSearch(''); }}
                      className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors border-b border-slate-50 last:border-0 ${
                        item.id === selectedId ? 'bg-blue-50' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-700">{getDomain(item.url)}</p>
                        <p className="text-xs text-slate-400 mt-0.5 truncate max-w-55">{item.url}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{timeAgo(item.createdAt)}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <ScoreBadge score={item.overallScore} />
                        {item.id === selectedId && (
                          <svg className="h-4 w-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── CompareContent ─────────────────────────────────────────────────────── */

function CompareContent() {
  const params = useSearchParams();
  const router = useRouter();

  const [auditList, setAuditList] = useState<AuditListItem[]>([]);
  const [listLoading, setListLoading] = useState(true);

  const [selectedIdA, setSelectedIdA] = useState(params.get('a') ?? '');
  const [selectedIdB, setSelectedIdB] = useState(params.get('b') ?? '');

  const [reportA, setReportA] = useState<Report | null>(null);
  const [reportB, setReportB] = useState<Report | null>(null);
  const [comparing, setComparing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/audits?pageSize=50')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setAuditList((d.data as AuditListItem[]).filter((a) => a.status === 'COMPLETED'));
        }
      })
      .catch(() => {})
      .finally(() => setListLoading(false));
  }, []);

  useEffect(() => {
    const idA = params.get('a');
    const idB = params.get('b');
    if (idA && idB) void doCompare(idA, idB);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function doCompare(idA: string, idB: string) {
    if (!idA || !idB) return;
    setComparing(true);
    setError(null);
    setReportA(null);
    setReportB(null);
    try {
      const [ra, rb] = await Promise.all([
        fetch(`/api/audits/${idA}`).then((r) => r.json()),
        fetch(`/api/audits/${idB}`).then((r) => r.json()),
      ]);
      if (!ra.success) throw new Error(ra.message ?? 'Report A not found');
      if (!rb.success) throw new Error(rb.message ?? 'Report B not found');
      setReportA(ra.data);
      setReportB(rb.data);
      router.replace(`/compare?a=${idA}&b=${idB}`, { scroll: false });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load reports');
    } finally {
      setComparing(false);
    }
  }

  function handleSwap() {
    const tmpId = selectedIdA;
    setSelectedIdA(selectedIdB);
    setSelectedIdB(tmpId);
    if (reportA && reportB) {
      setReportA(reportB);
      setReportB(reportA);
    }
  }

  const categories = ['SEO', 'PERFORMANCE', 'SECURITY', 'ACCESSIBILITY'];

  const winner =
    reportA?.overallScore != null && reportB?.overallScore != null
      ? reportA.overallScore > reportB.overallScore ? 'a'
        : reportA.overallScore < reportB.overallScore ? 'b'
        : 'tie'
      : null;

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Compare Reports</h1>
          <p className="text-sm text-slate-500 mt-0.5">Side-by-side audit score comparison</p>
        </div>
        <Link href="/dashboard" className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Dashboard
        </Link>
      </div>

      <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {listLoading ? (
          <div className="flex items-center justify-center h-28">
            <div className="h-5 w-5 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
          </div>
        ) : auditList.length < 2 ? (
          <div className="text-center py-8">
            <svg className="h-10 w-10 text-slate-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-sm font-medium text-slate-600">You need at least 2 completed audits to compare</p>
            <Link href="/dashboard" className="mt-3 inline-block text-sm text-blue-600 hover:underline font-medium">
              Run some audits first →
            </Link>
          </div>
        ) : (
          <>
            <div className="relative flex flex-col sm:flex-row items-stretch gap-4">
              <ReportPicker
                label="Report A"
                accent="blue"
                selectedId={selectedIdA}
                onSelect={setSelectedIdA}
                audits={auditList}
                excludeId={selectedIdB}
              />

              <div className="flex items-center justify-center sm:pt-8 shrink-0">
                <button
                  type="button"
                  onClick={handleSwap}
                  disabled={!selectedIdA || !selectedIdB}
                  title="Swap A and B"
                  className="h-8 w-8 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-400 hover:text-slate-700 hover:border-slate-300 hover:shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </button>
              </div>

              <ReportPicker
                label="Report B"
                accent="indigo"
                selectedId={selectedIdB}
                onSelect={setSelectedIdB}
                audits={auditList}
                excludeId={selectedIdA}
              />
            </div>

            {error && (
              <p className="mt-3 text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => doCompare(selectedIdA, selectedIdB)}
                disabled={!selectedIdA || !selectedIdB || comparing}
                className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {comparing && (
                  <div className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                )}
                {comparing ? 'Loading…' : 'Compare →'}
              </button>
            </div>
          </>
        )}
      </div>

      {reportA && reportB && (
        <div className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="flex flex-col divide-y sm:divide-y-0 sm:grid sm:grid-cols-[1fr_72px_1fr] sm:divide-x divide-slate-100">
              <div className={`p-4 sm:p-6 ${winner === 'a' ? 'bg-emerald-50/60' : ''}`}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-500 shrink-0" />
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Report A</span>
                  {winner === 'a' && (
                    <span className="text-xs font-bold bg-emerald-100 text-emerald-700 rounded-full px-2 py-0.5">Winner</span>
                  )}
                </div>
                <p className="text-lg font-bold text-slate-800 truncate">{getDomain(reportA.url)}</p>
                <p className="text-xs text-slate-400 truncate mt-0.5 mb-4">{reportA.url}</p>
                <p className={`text-4xl sm:text-5xl font-black tabular-nums ${scoreBg(reportA.overallScore)}`}>
                  {reportA.overallScore ?? '—'}
                </p>
                <p className="text-xs text-slate-400 mt-1">Overall Score</p>
                {reportA.completedAt && (
                  <p className="text-xs text-slate-400 mt-2">{timeAgo(reportA.completedAt)}</p>
                )}
              </div>

              <div className="flex sm:hidden items-center gap-3 px-4 py-3 bg-slate-50/50">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-xs font-black text-slate-400 tracking-[0.2em]">VS</span>
                {reportA.overallScore != null && reportB.overallScore != null && (
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full tabular-nums ${
                    winner === 'a' ? 'bg-blue-100 text-blue-700'
                    : winner === 'b' ? 'bg-indigo-100 text-indigo-700'
                    : 'bg-slate-100 text-slate-500'
                  }`}>
                    {winner === 'a'
                      ? `A +${reportA.overallScore - reportB.overallScore}`
                      : winner === 'b'
                      ? `B +${reportB.overallScore - reportA.overallScore}`
                      : 'Tie'}
                  </span>
                )}
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              <div className="hidden sm:flex flex-col items-center justify-center gap-2 bg-slate-50/50">
                <span className="text-xs font-black text-slate-300 tracking-[0.2em]">VS</span>
                {reportA.overallScore != null && reportB.overallScore != null && (
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full tabular-nums ${
                    winner === 'a' ? 'bg-blue-100 text-blue-700'
                    : winner === 'b' ? 'bg-indigo-100 text-indigo-700'
                    : 'bg-slate-100 text-slate-500'
                  }`}>
                    {winner === 'a'
                      ? `A +${reportA.overallScore - reportB.overallScore}`
                      : winner === 'b'
                      ? `B +${reportB.overallScore - reportA.overallScore}`
                      : 'Tie'}
                  </span>
                )}
              </div>

              <div className={`p-4 sm:p-6 ${winner === 'b' ? 'bg-emerald-50/60' : ''}`}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-indigo-500 shrink-0" />
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">Report B</span>
                  {winner === 'b' && (
                    <span className="text-xs font-bold bg-emerald-100 text-emerald-700 rounded-full px-2 py-0.5">Winner</span>
                  )}
                </div>
                <p className="text-lg font-bold text-slate-800 truncate">{getDomain(reportB.url)}</p>
                <p className="text-xs text-slate-400 truncate mt-0.5 mb-4">{reportB.url}</p>
                <p className={`text-4xl sm:text-5xl font-black tabular-nums ${scoreBg(reportB.overallScore)}`}>
                  {reportB.overallScore ?? '—'}
                </p>
                <p className="text-xs text-slate-400 mt-1">Overall Score</p>
                {reportB.completedAt && (
                  <p className="text-xs text-slate-400 mt-2">{timeAgo(reportB.completedAt)}</p>
                )}
              </div>
            </div>

            <div className="border-t border-slate-100 overflow-x-auto">
              <div className="min-w-120 px-6 pt-4 pb-2">
                <div className="flex items-center gap-2 mb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  <span className="w-28 shrink-0">Category</span>
                  <span className="w-7 text-right shrink-0 text-blue-400">A</span>
                  <div className="flex-1 text-center">Progress</div>
                  <span className="w-14 text-center shrink-0">Δ</span>
                  <div className="flex-1 text-center">Progress</div>
                  <span className="w-7 shrink-0 text-indigo-400">B</span>
                </div>
                {categories.map((cat) => (
                  <CategoryBar key={cat} cat={cat} a={reportA} b={reportB} />
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {(['CRITICAL', 'WARNING', 'PASSED'] as const).map((sev) => {
              const ca = reportA.issues.filter((i) => i.severity === sev).length;
              const cb = reportB.issues.filter((i) => i.severity === sev).length;
              const aIsBetter = sev === 'PASSED' ? ca > cb : ca < cb;
              const bIsBetter = sev === 'PASSED' ? cb > ca : cb < ca;
              const dot = sev === 'CRITICAL' ? 'bg-red-400' : sev === 'WARNING' ? 'bg-amber-400' : 'bg-emerald-400';

              return (
                <div key={sev} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-1.5 mb-3">
                    <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      {sev.charAt(0) + sev.slice(1).toLowerCase()}
                    </span>
                  </div>
                  <div className="flex justify-around items-end">
                    <div className="text-center">
                      <p className={`text-2xl font-black tabular-nums ${aIsBetter ? 'text-slate-800' : 'text-slate-400'}`}>{ca}</p>
                      <p className={`text-xs font-bold mt-0.5 ${aIsBetter ? 'text-blue-600' : 'text-slate-400'}`}>A</p>
                    </div>
                    <div className="w-px h-8 bg-slate-100" />
                    <div className="text-center">
                      <p className={`text-2xl font-black tabular-nums ${bIsBetter ? 'text-slate-800' : 'text-slate-400'}`}>{cb}</p>
                      <p className={`text-xs font-bold mt-0.5 ${bIsBetter ? 'text-indigo-600' : 'text-slate-400'}`}>B</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex gap-4 justify-center pb-4">
            <Link
              href={`/audit/${reportA.id}`}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:border-blue-300 hover:shadow-sm transition-all"
            >
              <span className="h-2 w-2 rounded-full bg-blue-500" />
              Full Report A
            </Link>
            <Link
              href={`/audit/${reportB.id}`}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:border-indigo-300 hover:shadow-sm transition-all"
            >
              <span className="h-2 w-2 rounded-full bg-indigo-500" />
              Full Report B
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────── */

export default function ComparePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
        </div>
      }
    >
      <CompareContent />
    </Suspense>
  );
}
