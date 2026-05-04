"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Props {
  message: string;
  reportUrl?: string;
}

type Kind = "notfound" | "timeout" | "unreachable" | "failed";

function classify(msg: string): Kind {
  const m = msg.toLowerCase();
  if (m.includes("not found")) return "notfound";
  if (m.includes("taking longer") || m.includes("timed")) return "timeout";
  if (
    m.includes("not accessible") ||
    m.includes("failed to load") ||
    m.includes("failed to fetch") ||
    m.includes("econnrefused") ||
    m.includes("dns") ||
    m.includes("network")
  )
    return "unreachable";
  return "failed";
}

function NotFoundIcon() {
  return (
    <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M9 12h6m-3-3v6M3 10a7 7 0 1114 0 7 7 0 01-14 0zm16 9l-3.5-3.5" />
    </svg>
  );
}

function TimeoutIcon() {
  return (
    <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M12 8v4l2.5 2.5M12 3a9 9 0 100 18A9 9 0 0012 3z" />
    </svg>
  );
}

function UnreachableIcon() {
  return (
    <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3l18 18" />
    </svg>
  );
}

function FailedIcon() {
  return (
    <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    </svg>
  );
}

const CONFIGS = {
  notfound: {
    Icon: NotFoundIcon,
    heading: "Report not found",
    hint: "This audit report may have been deleted or the link is no longer valid.",
    badge: "Not Found",
    iconBg: "rgba(100,116,139,0.08)",
    iconBorder: "rgba(100,116,139,0.2)",
    iconColor: "#94a3b8",
    badgeBg: "rgba(100,116,139,0.1)",
    badgeColor: "#64748b",
    showRetry: false,
  },
  timeout: {
    Icon: TimeoutIcon,
    heading: "Audit timed out",
    hint: "The website took too long to respond. This can happen with slow or temporarily unresponsive sites.",
    badge: "Timeout",
    iconBg: "rgba(245,158,11,0.08)",
    iconBorder: "rgba(245,158,11,0.2)",
    iconColor: "#f59e0b",
    badgeBg: "rgba(245,158,11,0.1)",
    badgeColor: "#b45309",
    showRetry: true,
  },
  unreachable: {
    Icon: UnreachableIcon,
    heading: "Could not reach the site",
    hint: "The website may be down, blocking automated requests, or the URL may be invalid. Check the address and try again.",
    badge: "Unreachable",
    iconBg: "rgba(249,115,22,0.08)",
    iconBorder: "rgba(249,115,22,0.2)",
    iconColor: "#f97316",
    badgeBg: "rgba(249,115,22,0.1)",
    badgeColor: "#c2410c",
    showRetry: true,
  },
  failed: {
    Icon: FailedIcon,
    heading: "Audit failed",
    hint: "Something went wrong while processing this audit. This can happen with certain website configurations or server errors.",
    badge: "Failed",
    iconBg: "rgba(239,68,68,0.08)",
    iconBorder: "rgba(239,68,68,0.2)",
    iconColor: "#ef4444",
    badgeBg: "rgba(239,68,68,0.1)",
    badgeColor: "#dc2626",
    showRetry: true,
  },
} as const;

export default function ErrorState({ message, reportUrl }: Props) {
  const router = useRouter();
  const kind = classify(message);
  const cfg = CONFIGS[kind];
  const { Icon } = cfg;

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Card */}
        <div
          className="rounded-3xl border bg-white shadow-sm overflow-hidden"
          style={{ borderColor: "#e2e8f0" }}
        >
          {/* Top accent bar */}
          <div
            className="h-1 w-full"
            style={{ background: `linear-gradient(90deg, ${cfg.iconColor}, ${cfg.iconColor}88)` }}
          />

          <div className="px-8 py-10 text-center">
            {/* Icon */}
            <div
              className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl"
              style={{ background: cfg.iconBg, border: `1px solid ${cfg.iconBorder}`, color: cfg.iconColor }}
            >
              <Icon />
            </div>

            {/* Badge */}
            <div className="mb-4 flex justify-center">
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider"
                style={{ background: cfg.badgeBg, color: cfg.badgeColor }}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: cfg.badgeColor }} />
                {cfg.badge}
              </span>
            </div>

            {/* Heading + hint */}
            <h2 className="text-2xl font-bold text-slate-900 mb-3">{cfg.heading}</h2>
            <p className="text-sm text-slate-500 leading-relaxed mb-2">{cfg.hint}</p>

            {/* Raw message — subtle, for technical context */}
            {message && message !== cfg.hint && (
              <p
                className="mt-3 rounded-xl px-4 py-2.5 text-xs font-mono text-slate-400 text-left break-words"
                style={{ background: "rgba(248,250,252,1)", border: "1px solid #f1f5f9" }}
              >
                {message}
              </p>
            )}
          </div>

          {/* Actions */}
          <div
            className="flex flex-col sm:flex-row gap-3 px-8 pb-8"
          >
            {cfg.showRetry && (
              <Link
                href={reportUrl ? `/?url=${encodeURIComponent(reportUrl)}` : "/"}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:opacity-90 hover:shadow-md"
                style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {reportUrl ? "Re-audit this site" : "Try a new audit"}
              </Link>
            )}
            {!cfg.showRetry && (
              <Link
                href="/"
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:opacity-90 hover:shadow-md"
                style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 4v16m8-8H4" />
                </svg>
                New audit
              </Link>
            )}
            <Link
              href="/dashboard"
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border px-5 py-3 text-sm font-semibold text-slate-700 transition-all hover:shadow-sm hover:border-slate-300 bg-white"
              style={{ borderColor: "#e2e8f0" }}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M3 12h18M3 17h18" />
              </svg>
              Dashboard
            </Link>
          </div>
        </div>

        {/* Help note */}
        <p className="mt-5 text-center text-xs text-slate-400">
          If the problem persists,{" "}
          <a href="mailto:support@thefabcode.org" className="underline hover:text-slate-500 transition-colors">
            contact support
          </a>
          .
        </p>
      </div>
    </div>
  );
}
