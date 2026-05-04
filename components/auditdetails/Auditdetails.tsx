"use client";

import React, { useEffect, useState, use } from "react";
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

interface AiErrorInfo {
  kind: "billing" | "ratelimit" | "overload" | "generic";
  title: string;
  detail: string;
}

function parseAiError(raw: string): AiErrorInfo {
  const m = raw.toLowerCase();
  if (
    m.includes("credit balance") ||
    m.includes("too low") ||
    m.includes("billing") ||
    m.includes("payment required") ||
    m.includes("402")
  ) {
    return {
      kind: "billing",
      title: "AI recommendations unavailable",
      detail:
        "The AI service credits have been exhausted. Your scores and section data are still accurate — recommendations will return once the service is recharged.",
    };
  }
  if (
    m.includes("rate_limit") ||
    m.includes("rate limit") ||
    m.includes("too many requests") ||
    m.includes("429")
  ) {
    return {
      kind: "ratelimit",
      title: "AI service rate limited",
      detail: "Too many requests to the AI service. Please wait a moment and try again.",
    };
  }
  if (m.includes("overloaded") || m.includes("529") || m.includes("service unavailable")) {
    return {
      kind: "overload",
      title: "AI service temporarily busy",
      detail: "The AI service is under heavy load. Please retry in a moment.",
    };
  }
  return {
    kind: "generic",
    title: "Could not generate recommendations",
    detail:
      "AI recommendations failed to generate. Your audit scores are still accurate — you can retry below.",
  };
}

const AI_ERROR_STYLE: Record<
  AiErrorInfo["kind"],
  { iconBg: string; iconBorder: string; iconColor: string; btnBorder: string; btnColor: string }
> = {
  billing: {
    iconBg: "rgba(245,158,11,0.08)",
    iconBorder: "rgba(245,158,11,0.2)",
    iconColor: "#f59e0b",
    btnBorder: "rgba(245,158,11,0.3)",
    btnColor: "#b45309",
  },
  ratelimit: {
    iconBg: "rgba(59,130,246,0.08)",
    iconBorder: "rgba(59,130,246,0.2)",
    iconColor: "#3b82f6",
    btnBorder: "rgba(99,102,241,0.25)",
    btnColor: "#6366f1",
  },
  overload: {
    iconBg: "rgba(99,102,241,0.08)",
    iconBorder: "rgba(99,102,241,0.2)",
    iconColor: "#8b5cf6",
    btnBorder: "rgba(99,102,241,0.25)",
    btnColor: "#6366f1",
  },
  generic: {
    iconBg: "rgba(239,68,68,0.08)",
    iconBorder: "rgba(239,68,68,0.2)",
    iconColor: "#ef4444",
    btnBorder: "rgba(99,102,241,0.25)",
    btnColor: "#6366f1",
  },
};

async function generateAiRecommendations(
  id: string,
  setReport: React.Dispatch<React.SetStateAction<AuditReport | null>>,
  setGenerating: React.Dispatch<React.SetStateAction<boolean>>,
  setError: React.Dispatch<React.SetStateAction<string | null>>
) {
  setGenerating(true);
  setError(null);
  try {
    const res = await fetch(`/api/audits/${id}/analyze`, { method: 'POST' });
    const json = await res.json();
    if (json.success && Array.isArray(json.issues)) {
      setReport((prev) => prev ? { ...prev, issues: json.issues } : prev);
    } else {
      setError(json.message ?? 'Failed to generate recommendations');
    }
  } catch {
    setError('Failed to generate recommendations. Please refresh the page.');
  } finally {
    setGenerating(false);
  }
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
  const [generatingAi, setGeneratingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

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

        if (data.status === "COMPLETED") {
          if (data.issues.length === 0 && data.sections.length > 0) {
            generateAiRecommendations(id, setReport, setGeneratingAi, setAiError);
          }
          return;
        }
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
            if (data.status === "COMPLETED" && data.issues.length === 0 && data.sections.length > 0) {
              generateAiRecommendations(id, setReport, setGeneratingAi, setAiError);
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
            if (json.success) {
              const completed = json.data as AuditReport;
              setReport(completed);
              if (completed.issues.length === 0 && completed.sections.length > 0) {
                generateAiRecommendations(id, setReport, setGeneratingAi, setAiError);
              }
            }
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
  if (error) return <ErrorState message={error} reportUrl={report?.url} />;
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
                {generatingAi
                  ? "Generating AI recommendations…"
                  : `${report.issues.length} items · prioritized by severity · powered by Claude AI`}
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
            {generatingAi ? (
              <div className="flex flex-col items-center py-20 gap-5 text-center">
                <div
                  className="flex h-16 w-16 items-center justify-center rounded-2xl shadow-sm"
                  style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
                >
                  <svg className="h-7 w-7 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                </div>
                <div>
                  <p className="text-base font-semibold text-slate-800">Generating AI Recommendations</p>
                  <p className="mt-1 text-sm text-slate-400">Claude is analysing the audit data — this takes a few seconds</p>
                </div>
              </div>
            ) : aiError ? (
              (() => {
                const err = parseAiError(aiError);
                const style = AI_ERROR_STYLE[err.kind];
                return (
                  <div className="flex flex-col items-center py-16 gap-5 text-center px-4">
                    <div
                      className="flex h-16 w-16 items-center justify-center rounded-2xl"
                      style={{ background: style.iconBg, border: `1px solid ${style.iconBorder}` }}
                    >
                      {err.kind === "billing" ? (
                        <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                          style={{ color: style.iconColor }}>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                      ) : err.kind === "ratelimit" || err.kind === "overload" ? (
                        <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                          style={{ color: style.iconColor }}>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M12 8v4l2.5 2.5M12 3a9 9 0 100 18A9 9 0 0012 3z" />
                        </svg>
                      ) : (
                        <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                          style={{ color: style.iconColor }}>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                        </svg>
                      )}
                    </div>

                    <div className="max-w-sm">
                      <p className="text-base font-semibold text-slate-800">{err.title}</p>
                      <p className="mt-1.5 text-sm text-slate-500 leading-relaxed">{err.detail}</p>
                    </div>

                    {err.kind !== "billing" && (
                      <button
                        onClick={() => generateAiRecommendations(id, setReport, setGeneratingAi, setAiError)}
                        className="inline-flex items-center gap-2 rounded-xl border bg-white px-5 py-2.5 text-sm font-semibold shadow-sm hover:shadow-md transition-all"
                        style={{ borderColor: style.btnBorder, color: style.btnColor }}
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Retry AI analysis
                      </button>
                    )}

                    {err.kind === "billing" && (
                      <p className="text-xs text-slate-400">
                        Scores above are computed independently and are fully accurate.
                      </p>
                    )}
                  </div>
                );
              })()
            ) : (
              <IssueList issues={report.issues} />
            )}
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
                } else if (json.code === 'MISSING_ENV_KEY') {
                  toast.error('Service not configured: ' + (json.message ?? 'Queue service (QStash/Redis) is missing. Check your environment variables.'));
                  setReauditing(false);
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
