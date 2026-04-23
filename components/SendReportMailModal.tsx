'use client';

import { useEffect, useRef, useState } from 'react';

interface ReportSummary {
  id: string;
  url: string;
  overallScore: number | null;
  criticalCount: number;
  warningCount: number;
  passedCount: number;
}

interface Props {
  open: boolean;
  report: ReportSummary;
  userEmail: string | null | undefined;
  sending: boolean;
  sent: boolean;
  onSend: () => void;
  onSkip: () => void;
}

export default function SendReportMailModal({
  open,
  report,
  userEmail,
  sending,
  sent,
  onSend,
  onSkip,
}: Props) {
  const skipRef = useRef<HTMLButtonElement>(null);
  // Track whether user has confirmed they want to resend (clicked "Yes, Resend")
  const [resendConfirmed, setResendConfirmed] = useState(false);

  // Derived: show resend confirmation when modal opens and report was already sent
  const resendMode = open && sent && !resendConfirmed;

  useEffect(() => {
    if (open && !sent) skipRef.current?.focus();
  }, [open, sent]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onSkip();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onSkip]);

  if (!open) return null;

  const score = report.overallScore ?? 0;
  const isGood = score >= 80;
  const isMed = score >= 50;
  const scoreColor = isGood ? '#10b981' : isMed ? '#f59e0b' : '#ef4444';
  const scoreBg = isGood
    ? 'rgba(16,185,129,0.10)'
    : isMed
      ? 'rgba(245,158,11,0.10)'
      : 'rgba(239,68,68,0.10)';
  const scoreLabel = isGood ? 'Excellent' : isMed ? 'Needs Work' : 'Poor';
  const displayUrl = report.url.replace(/^https?:\/\//, '').replace(/\/$/, '');

  return (
    <div className="fixed inset-0 z-99 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={sent ? undefined : onSkip}
      />

      {/* Centering wrapper */}
      <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
      {/* Dialog */}
      <div className="relative w-full max-w-md flex flex-col rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
        {/* Top gradient accent */}
        <div
          className="h-1 w-full"
          style={{
            background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #a855f7)',
          }}
        />

        <div className="p-6 sm:p-8">
          {/* Mail icon */}
          <div
            className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
          >
            <svg
              className="h-7 w-7 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>

          <h2 className="text-center text-xl font-bold text-slate-900 mb-1">
            Send report to your email?
          </h2>
          <p
            className="text-center text-sm text-slate-400 mb-6 truncate px-2"
            title={report.url}
          >
            {displayUrl}
          </p>

          {/* Score + metrics card */}
          <div
            className="rounded-2xl border p-4 mb-5"
            style={{ borderColor: '#f1f5f9' }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-slate-500">
                Overall Score
              </span>
              <span
                className="rounded-full px-3 py-1 text-sm font-bold"
                style={{ background: scoreBg, color: scoreColor }}
              >
                {score}/100 · {scoreLabel}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div
                className="rounded-xl p-2.5 text-center"
                style={{ background: 'rgba(239,68,68,0.07)' }}
              >
                <div className="text-xl font-bold text-red-500">
                  {report.criticalCount}
                </div>
                <div className="text-xs text-red-400 mt-0.5">Critical</div>
              </div>
              <div
                className="rounded-xl p-2.5 text-center"
                style={{ background: 'rgba(245,158,11,0.07)' }}
              >
                <div className="text-xl font-bold text-amber-500">
                  {report.warningCount}
                </div>
                <div className="text-xs text-amber-400 mt-0.5">Warnings</div>
              </div>
              <div
                className="rounded-xl p-2.5 text-center"
                style={{ background: 'rgba(16,185,129,0.07)' }}
              >
                <div className="text-xl font-bold text-emerald-500">
                  {report.passedCount}
                </div>
                <div className="text-xs text-emerald-400 mt-0.5">Passed</div>
              </div>
            </div>
          </div>

          {/* Recipient */}
          {userEmail && (
            <p className="text-center text-xs text-slate-400 mb-6">
              Will be sent to{' '}
              <span className="font-semibold text-slate-600">{userEmail}</span>
            </p>
          )}

          {/* Actions */}
          {sent && !resendMode ? (
            // Just-sent success state (after resend completes)
            <div
              className="rounded-2xl p-4 text-center"
              style={{
                background: 'rgba(16,185,129,0.08)',
                border: '1px solid rgba(16,185,129,0.2)',
              }}
            >
              <div className="flex items-center justify-center gap-2 mb-3">
                <svg
                  className="h-5 w-5 text-emerald-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-sm font-semibold text-emerald-600">
                  Report sent successfully!
                </span>
              </div>
              <button
                onClick={onSkip}
                className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
              >
                Close
              </button>
            </div>
          ) : resendMode ? (
            // Already sent — ask user if they want to resend
            <div className="flex flex-col gap-3">
              <div
                className="rounded-2xl p-3 text-center text-sm text-amber-700 font-medium"
                style={{
                  background: 'rgba(245,158,11,0.08)',
                  border: '1px solid rgba(245,158,11,0.25)',
                }}
              >
                ⚠️ The report has already been sent. Do you want to resend it?
              </div>
              <button
                onClick={() => { setResendConfirmed(true); onSend(); }}
                disabled={sending}
                className="w-full rounded-2xl py-3 text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
              >
                {sending ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Sending…
                  </span>
                ) : 'Yes, Resend Report'}
              </button>
              <button
                onClick={onSkip}
                disabled={sending}
                className="w-full rounded-2xl border border-slate-200 py-3 text-sm font-semibold text-slate-600 transition-all hover:bg-slate-50 active:scale-[0.98] disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          ) : (
            // First-time send
            <div className="flex flex-col gap-3">
              <button
                onClick={onSend}
                disabled={sending}
                className="w-full rounded-2xl py-3 text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
                style={{
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                }}
              >
                {sending ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="h-4 w-4 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Sending…
                  </span>
                ) : (
                  'Send Report to Email'
                )}
              </button>
              <button
                ref={skipRef}
                onClick={onSkip}
                disabled={sending}
                className="w-full rounded-2xl border border-slate-200 py-3 text-sm font-semibold text-slate-600 transition-all hover:bg-slate-50 active:scale-[0.98] disabled:opacity-50"
              >
                Skip for now
              </button>
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
