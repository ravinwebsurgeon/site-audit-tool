"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import ScoreCard from "@/components/ScoreCard";
import IssueList from "@/components/IssueList";
import ConfirmModal from "@/components/ConfirmModal";
import SendReportMailModal from "@/components/SendReportMailModal";
import { AuditReportSkeleton } from "@/components/Skeleton";
import { useToast } from "@/components/Toast";
import ScoreRing from "./ScoreRing";
import ProcessingLoader from "./ProcessingLoader";
import ErrorState from "./ErrorState";
import { CAT_ICONS, formatAgo } from "./utils";

interface AuditSection {
  id: string;
  category: string;
  score: number;
}
interface AuditIssue {
  id: string;
  category: string;
  severity: "CRITICAL" | "WARNING" | "PASSED";
  title: string;
  description: string;
  recommendation: string;
}
interface AuditReport {
  id: string;
  url: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  overallScore: number | null;
  errorMessage?: string | null;
  completedAt?: string | null;
  sections: AuditSection[];
  issues: AuditIssue[];
}

export default function AuditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const toast = useToast();
  const { data: session } = useSession();
  const [report, setReport] = useState<AuditReport | null>(null);
  const [status, setStatus] = useState<string>("PENDING");
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [reauditing, setReauditing] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [mailModalOpen, setMailModalOpen] = useState(false);
  const [mailSending, setMailSending] = useState(false);
  const [mailSent, setMailSent] = useState(false);

  async function handleSendEmail() {
    setMailSending(true);
    try {
      const res = await fetch(`/api/audits/${id}/send-email`, { method: "POST" });
      const json = await res.json();
      if (json.success) {
        setMailSent(true);
        setMailModalOpen(false);
        toast.success("Report sent to your email!");
      } else {
        toast.error(json.message ?? "Failed to send email.");
      }
    } catch {
      toast.error("Failed to send email. Please try again.");
    } finally {
      setMailSending(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    const res = await fetch(`/api/audits/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (json.success) {
      window.location.href = "/dashboard";
    } else {
      toast.error("Failed to delete report. Please try again.");
      setDeleting(false);
      setDeleteModalOpen(false);
    }
  }

  useEffect(() => {
    let es: EventSource | null = null;
    let closed = false;
    let giveUpTimer: ReturnType<typeof setTimeout>;
    let fallbackPoll: ReturnType<typeof setInterval>;

    function teardown() {
      closed = true;
      es?.close();
      clearTimeout(giveUpTimer);
      clearInterval(fallbackPoll);
    }

    async function bootstrap() {
      try {
        const r = await fetch(`/api/audits/${id}`);
        const json = await r.json();

        if (!json.success) {
          setError(json.message ?? "Audit not found");
          setInitialLoading(false);
          return;
        }

        const data = json.data as AuditReport;
        setStatus(data.status);
        setReport(data);
        setInitialLoading(false);

        if (data.status === "COMPLETED") return;
        if (data.status === "FAILED") {
          setError(data.errorMessage ?? "Audit processing failed. Please try again.");
          return;
        }
      } catch {
        setError("Failed to load audit");
        setInitialLoading(false);
        return;
      }

      // Fallback polling every 4 s — catches COMPLETED if SSE misses it
      fallbackPoll = setInterval(async () => {
        if (closed) return;
        try {
          const r = await fetch(`/api/audits/${id}`);
          const json = await r.json();
          if (!json.success) return;
          const data = json.data as AuditReport;
          if (data.status === "COMPLETED" || data.status === "FAILED") {
            teardown();
            setReport(data);
            setStatus(data.status);
            if (data.status === "FAILED") {
              setError(data.errorMessage ?? "Audit processing failed. Please try again.");
            }
          }
        } catch { /* ignore transient errors */ }
      }, 4000);

      // Primary: SSE for low-latency updates
      es = new EventSource(`/api/audits/${id}/status`);

      es.onmessage = async (evt) => {
        if (closed) return;

        let payload: { status?: string; error?: string; errorMessage?: string | null };
        try {
          payload = JSON.parse(evt.data);
        } catch {
          return;
        }

        if (payload.error) {
          teardown();
          setError(payload.error);
          return;
        }

        if (payload.status && payload.status !== "COMPLETED" && payload.status !== "FAILED") {
          setStatus(payload.status);
        }

        if (payload.status === "COMPLETED") {
          teardown();
          // Fetch full report then update both status + report in the same tick
          // so React batches them into one render (no intermediate empty state).
          try {
            const r = await fetch(`/api/audits/${id}`);
            const json = await r.json();
            if (json.success) setReport(json.data as AuditReport);
          } catch { /* fall through — status update below still fires */ }
          setStatus("COMPLETED");
        } else if (payload.status === "FAILED") {
          teardown();
          setError(payload.errorMessage ?? "Audit processing failed. Please try again.");
        }
      };

      // 3-minute hard limit across all reconnects
      giveUpTimer = setTimeout(() => {
        if (!closed) {
          teardown();
          setError("Audit is taking longer than expected. Please try again.");
        }
      }, 3 * 60 * 1000);
    }

    bootstrap();

    return () => {
      teardown();
    };
  }, [id]);

  if (initialLoading) return <AuditReportSkeleton />;
  if (error) return <ErrorState message={error} />;
  if (status === "PENDING" || status === "PROCESSING") {
    return <ProcessingLoader url={report?.url} status={status} />;
  }
  if (!report) return null;

  const completedAgo = report.completedAt ? formatAgo(report.completedAt) : null;
  const sectionMap = Object.fromEntries(report.sections.map((s) => [s.category, s.score]));
  const criticalCount = report.issues.filter((i) => i.severity === "CRITICAL").length;
  const warningCount = report.issues.filter((i) => i.severity === "WARNING").length;
  const passedCount = report.issues.filter((i) => i.severity === "PASSED").length;

  const overallScore = report.overallScore ?? 0;

  return (
    <div className="animate-fade-in">
      {/* Hero banner */}
      <div className="relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-12">
          {/* Breadcrumb */}
          <div className="mb-8 flex items-center gap-2 text-sm">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-slate-400 hover:text-slate-500 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              New Audit
            </Link>
            <span className="text-slate-600">/</span>
            <span className="max-w-sm truncate font-mono text-xs text-slate-400">{report.url}</span>
            {completedAgo && (
              <>
                <span className="text-slate-600">/</span>
                <span className="text-slate-500 text-xs">{completedAgo}</span>
              </>
            )}
          </div>

          {/* Score layout */}
          <div className="flex flex-col lg:flex-row items-center gap-10">
            <div className="shrink-0">
              {report.overallScore !== null && <ScoreRing score={overallScore} />}
            </div>

            <div className="flex-1 w-full">
              <h1 className="text-2xl font-bold text-slate-800 mb-1">Audit Report</h1>
              <p className="font-mono text-sm text-slate-400 mb-6 truncate">{report.url}</p>

              {/* Severity pills */}
              <div className="flex flex-wrap gap-3 mb-8">
                {criticalCount > 0 && (
                  <div className="flex items-center gap-2 rounded-xl border px-4 py-2.5"
                    style={{ background: "rgba(239,68,68,0.12)", borderColor: "rgba(239,68,68,0.3)" }}>
                    <div className="h-2.5 w-2.5 rounded-full" style={{ background: "#ef4444" }} />
                    <span className="text-sm font-bold text-red-400">{criticalCount} Critical</span>
                  </div>
                )}
                {warningCount > 0 && (
                  <div className="flex items-center gap-2 rounded-xl border px-4 py-2.5"
                    style={{ background: "rgba(245,158,11,0.12)", borderColor: "rgba(245,158,11,0.3)" }}>
                    <div className="h-2.5 w-2.5 rounded-full" style={{ background: "#f59e0b" }} />
                    <span className="text-sm font-bold text-amber-400">{warningCount} Warnings</span>
                  </div>
                )}
                {passedCount > 0 && (
                  <div className="flex items-center gap-2 rounded-xl border px-4 py-2.5"
                    style={{ background: "rgba(16,185,129,0.12)", borderColor: "rgba(16,185,129,0.3)" }}>
                    <div className="h-2.5 w-2.5 rounded-full" style={{ background: "#10b981" }} />
                    <span className="text-sm font-bold text-emerald-400">{passedCount} Passed</span>
                  </div>
                )}
              </div>

              {/* Category scores */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {(["SEO", "PERFORMANCE", "SECURITY", "ACCESSIBILITY"] as const)
                  .filter((cat) => sectionMap[cat] !== undefined)
                  .map((cat) => (
                    <ScoreCard key={cat} category={cat} icon={CAT_ICONS[cat]} score={sectionMap[cat] ?? 0} />
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Issues section */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-10">
        <div className="rounded-3xl border bg-white shadow-sm" style={{ borderColor: "#e2e8f0" }}>
          <div className="sm:flex items-center justify-between border-b px-4 sm:px-8 py-4 sm:py-6"
            style={{ borderColor: "#f1f5f9" }}>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Findings &amp; Recommendations</h2>
              <p className="mt-1 text-base text-slate-500">
                {report.issues.length} items · prioritized by severity · powered by Claude AI
              </p>
            </div>
            <div className="sm:flex items-center gap-2 mt-5 sm:mt-0">
              <a
                href={`/api/audits/${id}/export`}
                target="_blank" rel="noopener noreferrer"
                className="inline-flex bg-blue-600 text-white hover:bg-blue-700 items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all hover:shadow-sm"
                style={{ borderColor: "#e2e8f0" }}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export PDF
              </a>
            </div>
          </div>
          <div className="p-3 sm:p-8">
            <IssueList issues={report.issues} />
          </div>
        </div>

        {/* Bottom CTAs */}
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border bg-white px-6 py-3 text-base font-semibold text-slate-700 shadow-sm transition-all hover:shadow-md hover:border-slate-300"
            style={{ borderColor: "#e2e8f0" }}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Audit another site
          </Link>
          <button
            disabled={reauditing}
            onClick={async () => {
              setReauditing(true);
              try {
                const r = await fetch("/api/audits?refresh=1", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ url: report.url }),
                });
                const json = await r.json();
                if (json.success) {
                  window.location.href = `/audit/${json.data.id}`;
                } else {
                  toast.error(json.message ?? "Failed to start re-audit.");
                  setReauditing(false);
                }
              } catch {
                toast.error("Failed to start re-audit. Please try again.");
                setReauditing(false);
              }
            }}
            className="inline-flex items-center gap-2 rounded-xl border bg-white px-6 py-3 text-base font-semibold text-slate-700 shadow-sm transition-all hover:shadow-md hover:border-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ borderColor: "#e2e8f0" }}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {reauditing ? "Starting…" : "Re-audit (fresh)"}
          </button>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl border bg-white px-6 py-3 text-base font-semibold text-slate-700 shadow-sm transition-all hover:shadow-md hover:border-slate-300"
            style={{ borderColor: "#e2e8f0" }}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M3 12h18M3 17h18" />
            </svg>
            Dashboard
          </Link>
          <button
            onClick={() => setMailModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border bg-white px-6 py-3 text-base font-semibold shadow-sm transition-all hover:shadow-md disabled:opacity-50"
            style={{ borderColor: "#e2e8f0", color: mailSent ? "#8b5cf6" : "#6366f1" }}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            {mailSent ? "Resend Report" : "Send Report to Email"}
          </button>
          <button
            onClick={() => setDeleteModalOpen(true)}
            disabled={deleting}
            className="inline-flex items-center gap-2 rounded-xl border bg-white px-6 py-3 text-base font-semibold text-red-500 shadow-sm transition-all hover:shadow-md hover:border-red-200 disabled:opacity-50"
            style={{ borderColor: "#e2e8f0" }}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete Report
          </button>
        </div>
      </div>

      <ConfirmModal
        open={deleteModalOpen}
        title="Delete Report"
        message="This audit report will be permanently deleted. This cannot be undone."
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteModalOpen(false)}
      />

      <SendReportMailModal
        open={mailModalOpen}
        sent={mailSent}
        report={{ id: report.id, url: report.url, overallScore: report.overallScore, criticalCount, warningCount, passedCount }}
        userEmail={session?.user?.email}
        sending={mailSending}
        onSend={handleSendEmail}
        onSkip={() => setMailModalOpen(false)}
      />
    </div>
  );
}
