"use client";

import { useEffect, useState } from "react";

const STEPS = [
  { label: "Fetching website content", icon: "🌐" },
  { label: "Running SEO analysis", icon: "🔍" },
  { label: "Checking performance metrics", icon: "⚡" },
  { label: "Scanning security headers", icon: "🔒" },
  { label: "Generating AI recommendations", icon: "🤖" },
];

export default function ProcessingLoader({ url, status }: { url?: string; status: string }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 3500);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-lg">
        <div className="flex justify-center mb-10">
          <div className="relative flex h-24 w-24 items-center justify-center">
            <div
              className="absolute h-24 w-24 rounded-full animate-ping opacity-20"
              style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
            />
            <div
              className="absolute h-20 w-20 rounded-full animate-ping opacity-10"
              style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", animationDelay: "0.4s" }}
            />
            <div
              className="relative flex h-16 w-16 items-center justify-center rounded-2xl shadow-2xl"
              style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
            >
              <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
        </div>

        <h2 className="text-center text-2xl font-bold text-slate-900 mb-2">
          {status === "PENDING" ? "Queued for analysis…" : "Analyzing your website"}
        </h2>
        {url && (
          <p className="text-center text-base font-mono text-slate-400 truncate mb-10">{url}</p>
        )}

        <div className="space-y-3.5">
          {STEPS.map((s, i) => (
            <div
              key={s.label}
              className="flex items-center gap-4 rounded-2xl border px-5 py-4 transition-all duration-500"
              style={{
                background: i === step ? "rgba(99,102,241,0.06)" : "white",
                borderColor: i === step ? "rgba(99,102,241,0.3)" : "#e2e8f0",
              }}
            >
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all duration-500"
                style={{
                  background: i < step
                    ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
                    : i === step ? "rgba(99,102,241,0.12)" : "#f8fafc",
                }}
              >
                {i < step ? (
                  <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : i === step ? (
                  <div className="h-3 w-3 rounded-full animate-pulse" style={{ background: "#6366f1" }} />
                ) : (
                  <div className="h-2.5 w-2.5 rounded-full bg-slate-200" />
                )}
              </div>
              <span
                className={`text-base font-medium transition-colors duration-300 ${
                  i < step ? "text-slate-400 line-through" : i === step ? "text-slate-900" : "text-slate-400"
                }`}
              >
                {s.icon} {s.label}
              </span>
            </div>
          ))}
        </div>
        <p className="mt-8 text-center text-sm text-slate-400">Usually completes in 10-20 seconds</p>
      </div>
    </div>
  );
}
