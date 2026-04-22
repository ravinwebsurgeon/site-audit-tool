"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import ScoreCard from "@/components/ScoreCard";
import IssueList from "@/components/IssueList";
import ConfirmModal from "@/components/ConfirmModal";
import { AuditReportSkeleton } from "@/components/Skeleton";
import { useToast } from "@/components/Toast";

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

// ── Animated score ring ────────────────────────────────────────────────────
function ScoreRing({ score }: { score: number }) {
  const r = 90;
  const cx = 110;
  const cy = 110;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference - (score / 100) * circumference;

  const isGood = score >= 80;
  const isMed = score >= 50;

  const [from, to] = isGood
    ? ["#10b981", "#34d399"]
    : isMed
      ? ["#f59e0b", "#fbbf24"]
      : ["#ef4444", "#f87171"];

  const label = isGood ? "Excellent" : isMed ? "Needs Work" : "Poor";
  const labelColor = isGood ? "#10b981" : isMed ? "#f59e0b" : "#ef4444";
  const glowColor = isGood
    ? "rgba(16,185,129,0.3)"
    : isMed
      ? "rgba(245,158,11,0.3)"
      : "rgba(239,68,68,0.3)";

  return (
    <div className="flex flex-col items-center justify-center">
      <div
        className="relative"
        style={{ filter: `drop-shadow(0 0 24px ${glowColor})` }}
      >
        <svg width="220" height="220" viewBox="0 0 220 220">
          <defs>
            <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={from} />
              <stop offset="100%" stopColor={to} />
            </linearGradient>
          </defs>
          {/* Track */}
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="#f1f5f9"
            strokeWidth="14"
          />
          {/* Progress arc */}
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="url(#scoreGrad)"
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            transform={`rotate(-90 ${cx} ${cy})`}
            style={{
              transition: "stroke-dashoffset 1.4s cubic-bezier(0.4,0,0.2,1)",
            }}
          />
          {/* Score number */}
          {/* <text x={cx} y={cy - 10} textAnchor="middle" fill={from}
            fontSize="64" fontWeight="800" fontFamily="var(--font-geist-sans, sans-serif)">
            {score}
          </text>
          <text x={cx} y={cy + 22} textAnchor="middle" fill="#94a3b8"
            fontSize="18" fontWeight="500" fontFamily="var(--font-geist-sans, sans-serif)">
            out of 100
          </text> */}
          {/* Score number */}
          <text
            x={cx}
            y={cy}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={from}
            fontSize="64"
            fontWeight="800"
            fontFamily="var(--font-geist-sans, sans-serif)"
          >
            {score}
          </text>

          {/* Sub text */}
          <text
            x={cx}
            y={cy + 42} // 👈 controls the gap
            textAnchor="middle"
            fill="#94a3b8"
            fontSize="18"
            fontWeight="500"
            fontFamily="var(--font-geist-sans, sans-serif)"
          >
            out of 100
          </text>
        </svg>
      </div>
      <span
        className="mt-2 rounded-full px-4 py-1.5 text-sm font-bold"
        style={{ background: `${from}18`, color: labelColor }}
      >
        {label}
      </span>
    </div>
  );
}

// ── Processing loader ──────────────────────────────────────────────────────
function ProcessingLoader({ url, status }: { url?: string; status: string }) {
  const steps = [
    { label: "Fetching website content", icon: "🌐" },
    { label: "Running SEO analysis", icon: "🔍" },
    { label: "Checking performance metrics", icon: "⚡" },
    { label: "Scanning security headers", icon: "🔒" },
    { label: "Generating AI recommendations", icon: "🤖" },
  ];
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = setInterval(
      () => setStep((s) => Math.min(s + 1, steps.length - 1)),
      3500,
    );
    return () => clearInterval(id);
  }, [steps.length]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-lg">
        {/* Animated icon */}
        <div className="flex justify-center mb-10">
          <div className="relative flex h-24 w-24 items-center justify-center">
            <div
              className="absolute h-24 w-24 rounded-full animate-ping opacity-20"
              style={{
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              }}
            />
            <div
              className="absolute h-20 w-20 rounded-full animate-ping opacity-10"
              style={{
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                animationDelay: "0.4s",
              }}
            />
            <div
              className="relative flex h-16 w-16 items-center justify-center rounded-2xl shadow-2xl"
              style={{
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              }}
            >
              <svg
                className="h-8 w-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
          </div>
        </div>

        <h2 className="text-center text-2xl font-bold text-slate-900 mb-2">
          {status === "PENDING"
            ? "Queued for analysis…"
            : "Analyzing your website"}
        </h2>
        {url && (
          <p className="text-center text-base font-mono text-slate-400 truncate mb-10">
            {url}
          </p>
        )}

        <div className="space-y-3.5">
          {steps.map((s, i) => (
            <div
              key={s.label}
              className="flex items-center gap-4 rounded-2xl border px-5 py-4 transition-all duration-500"
              style={{
                background:
                  i === step
                    ? "rgba(99,102,241,0.06)"
                    : i < step
                      ? "white"
                      : "white",
                borderColor: i === step ? "rgba(99,102,241,0.3)" : "#e2e8f0",
              }}
            >
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all duration-500"
                style={{
                  background:
                    i < step
                      ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
                      : i === step
                        ? "rgba(99,102,241,0.12)"
                        : "#f8fafc",
                }}
              >
                {i < step ? (
                  <svg
                    className="h-4 w-4 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : i === step ? (
                  <div
                    className="h-3 w-3 rounded-full animate-pulse"
                    style={{ background: "#6366f1" }}
                  />
                ) : (
                  <div className="h-2.5 w-2.5 rounded-full bg-slate-200" />
                )}
              </div>
              <span
                className={`text-base font-medium transition-colors duration-300 ${
                  i < step
                    ? "text-slate-400 line-through"
                    : i === step
                      ? "text-slate-900"
                      : "text-slate-400"
                }`}
              >
                {s.icon} {s.label}
              </span>
            </div>
          ))}
        </div>
        <p className="mt-8 text-center text-sm text-slate-400">
          Usually completes in 10–20 seconds
        </p>
      </div>
    </div>
  );
}

// ── Error state ────────────────────────────────────────────────────────────
function ErrorState({ message }: { message: string }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <div
          className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl"
          style={{
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.2)",
          }}
        >
          <svg
            className="h-10 w-10 text-red-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-3">Audit failed</h2>
        <p className="text-base text-slate-500 mb-8">{message}</p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-base font-semibold text-white shadow-lg transition-all hover:opacity-90"
          style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
        >
          Try again
        </Link>
      </div>
    </div>
  );
}

// ── Category icons ─────────────────────────────────────────────────────────
const CAT_ICONS: Record<string, React.ReactNode> = {
  SEO: (
    <svg
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  ),
  PERFORMANCE: (
    <svg
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M13 10V3L4 14h7v7l9-11h-7z"
      />
    </svg>
  ),
  SECURITY: (
    <svg
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
      />
    </svg>
  ),
  ACCESSIBILITY: (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
};

function formatAgo(completedAt: string): string {
  const ms = Date.now() - new Date(completedAt).getTime();
  const secs = Math.floor(ms / 1000);
  const mins = Math.floor(secs / 60);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (secs < 60)   return "just now";
  if (mins < 60)   return mins === 1   ? "1 minute ago"  : `${mins} minutes ago`;
  if (hours < 24)  return hours === 1  ? "1 hour ago"    : `${hours} hours ago`;
  if (days < 7)    return days === 1   ? "yesterday"     : `${days} days ago`;
  if (weeks < 4)   return weeks === 1  ? "1 week ago"    : `${weeks} weeks ago`;
  if (months < 12) return months === 1 ? "1 month ago"   : `${months} months ago`;
  return years === 1 ? "1 year ago" : `${years} years ago`;
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function AuditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const toast = useToast();
  const [report, setReport] = useState<AuditReport | null>(null);
  const [status, setStatus] = useState<string>("PENDING");
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

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
    fetch(`/api/audits/${id}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          setReport(json.data);
          setStatus(json.data.status);
        } else setError(json.message ?? "Audit not found");
      })
      .catch(() => setError("Failed to load audit"))
      .finally(() => setInitialLoading(false));
  }, [id]);

  useEffect(() => {
    if (status === "COMPLETED" || status === "FAILED" || error) return;
    const es = new EventSource(`/api/audits/${id}/status`);
    es.onmessage = (e) => {
      const data = JSON.parse(e.data) as { status?: string; error?: string };
      if (data.error) {
        setError(data.error);
        es.close();
        return;
      }
      if (data.status) {
        setStatus(data.status);
        if (data.status === "COMPLETED") {
          es.close();
          fetch(`/api/audits/${id}`)
            .then((r) => r.json())
            .then((json) => {
              if (json.success) setReport(json.data);
            });
        }
        if (data.status === "FAILED") {
          es.close();
          setError("Audit processing failed. Please try again.");
        }
      }
    };
    es.onerror = () => es.close();
    return () => es.close();
  }, [id, status, error]);

  if (initialLoading) return <AuditReportSkeleton />;
  if (error) return <ErrorState message={error} />;
  if (status === "PENDING" || status === "PROCESSING") {
    return <ProcessingLoader url={report?.url} status={status} />;
  }
  if (!report) return null;

  const completedAgo = report.completedAt
    ? formatAgo(report.completedAt)
    : null;

  const sectionMap = Object.fromEntries(
    report.sections.map((s) => [s.category, s.score]),
  );
  const criticalCount = report.issues.filter(
    (i) => i.severity === "CRITICAL",
  ).length;
  const warningCount = report.issues.filter(
    (i) => i.severity === "WARNING",
  ).length;
  const passedCount = report.issues.filter(
    (i) => i.severity === "PASSED",
  ).length;

  const overallScore = report.overallScore ?? 0;
  const isGood = overallScore >= 80;
  const isMed = overallScore >= 50;
  const heroGradient = isGood
    ? "linear-gradient(135deg, #064e3b, #0f172a)"
    : isMed
      ? "linear-gradient(135deg, #78350f, #0f172a)"
      : "linear-gradient(135deg, #7f1d1d, #0f172a)";

  return (
    <div className="animate-fade-in">
      {/* ── Hero banner ── */}
      <div
        className="relative overflow-hidden"
        //  style={{ background: heroGradient }}
      >
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)",
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
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              New Audit
            </Link>
            <span className="text-slate-600">/</span>
            <span className="max-w-sm truncate font-mono text-xs text-slate-400">
              {report.url}
            </span>
            {completedAgo && (
              <>
                <span className="text-slate-600">/</span>
                <span className="text-slate-500 text-xs">{completedAgo}</span>
              </>
            )}
          </div>

          {/* Score layout */}
          <div className="flex flex-col lg:flex-row items-center gap-10">
            {/* Score ring */}
            <div className="shrink-0">
              {report.overallScore !== null && (
                <ScoreRing score={report.overallScore} />
              )}
            </div>

            {/* Right panel */}
            <div className="flex-1 w-full">
              <h1 className="text-2xl font-bold text-slate-800 mb-1">
                Audit Report
              </h1>
              <p className="font-mono text-sm text-slate-400 mb-6 truncate">
                {report.url}
              </p>

              {/* Severity pills */}
              <div className="flex flex-wrap gap-3 mb-8">
                {criticalCount > 0 && (
                  <div
                    className="flex items-center gap-2 rounded-xl border px-4 py-2.5"
                    style={{
                      background: "rgba(239,68,68,0.12)",
                      borderColor: "rgba(239,68,68,0.3)",
                    }}
                  >
                    <div
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ background: "#ef4444" }}
                    />
                    <span className="text-sm font-bold text-red-400">
                      {criticalCount} Critical
                    </span>
                  </div>
                )}
                {warningCount > 0 && (
                  <div
                    className="flex items-center gap-2 rounded-xl border px-4 py-2.5"
                    style={{
                      background: "rgba(245,158,11,0.12)",
                      borderColor: "rgba(245,158,11,0.3)",
                    }}
                  >
                    <div
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ background: "#f59e0b" }}
                    />
                    <span className="text-sm font-bold text-amber-400">
                      {warningCount} Warnings
                    </span>
                  </div>
                )}
                {passedCount > 0 && (
                  <div
                    className="flex items-center gap-2 rounded-xl border px-4 py-2.5"
                    style={{
                      background: "rgba(16,185,129,0.12)",
                      borderColor: "rgba(16,185,129,0.3)",
                    }}
                  >
                    <div
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ background: "#10b981" }}
                    />
                    <span className="text-sm font-bold text-emerald-400">
                      {passedCount} Passed
                    </span>
                  </div>
                )}
              </div>

              {/* Category scores */}
               <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {(["SEO", "PERFORMANCE", "SECURITY", "ACCESSIBILITY"] as const).filter((cat) => sectionMap[cat] !== undefined).map((cat) => (
                  <ScoreCard
                    key={cat}
                    category={cat}
                    icon={CAT_ICONS[cat]}
                    score={sectionMap[cat] ?? 0}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Issues section ── */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-10">
        <div
          className="rounded-3xl border bg-white shadow-sm"
          style={{ borderColor: "#e2e8f0" }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between border-b px-4 sm:px-8 py-4 sm:py-6"
            style={{ borderColor: "#f1f5f9" }}
          >
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Findings &amp; Recommendations
              </h2>
              <p className="mt-1 text-base text-slate-500">
                {report.issues.length} items · prioritized by severity · powered
                by Claude AI
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <a
                href={`/api/audits/${id}/export`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex bg-blue-600 text-white hover:bg-blue-700 items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all hover:shadow-sm"
                style={{ borderColor: "#e2e8f0"}}
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
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
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Audit another site
          </Link>
          <Link
            href={`/?url=${encodeURIComponent(report.url)}&refresh=1`}
            onClick={(e) => {
              e.preventDefault();
              fetch("/api/audits?refresh=1", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url: report.url }),
              })
                .then((r) => r.json())
                .then((json) => {
                  if (json.success)
                    window.location.href = `/audit/${json.data.id}`;
                });
            }}
            className="inline-flex items-center gap-2 rounded-xl border bg-white px-6 py-3 text-base font-semibold text-slate-700 shadow-sm transition-all hover:shadow-md hover:border-indigo-200"
            style={{ borderColor: "#e2e8f0" }}
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Re-audit (fresh)
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl border bg-white px-6 py-3 text-base font-semibold text-slate-700 shadow-sm transition-all hover:shadow-md hover:border-slate-300"
            style={{ borderColor: "#e2e8f0" }}
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 7h18M3 12h18M3 17h18"
              />
            </svg>
            Dashboard
          </Link>
          <button
            onClick={() => setDeleteModalOpen(true)}
            disabled={deleting}
            className="inline-flex items-center gap-2 rounded-xl border bg-white px-6 py-3 text-base font-semibold text-red-500 shadow-sm transition-all hover:shadow-md hover:border-red-200 disabled:opacity-50"
            style={{ borderColor: "#e2e8f0" }}
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
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
    </div>
  );
}
