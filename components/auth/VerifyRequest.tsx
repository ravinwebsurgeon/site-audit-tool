import Link from 'next/link';

export default function VerifyRequestPage() {
  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-6">
      <div className="w-full max-w-sm text-center">
        {/* Animated envelope */}
        <div className="relative mx-auto mb-8 flex h-20 w-20 items-center justify-center">
          <div className="absolute h-20 w-20 animate-ping rounded-full bg-blue-100 opacity-50" />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-200">
            <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-slate-900 mb-3">Check your inbox</h1>
        <p className="text-slate-500 text-sm leading-relaxed mb-8 max-w-xs mx-auto">
          We sent you a magic link. Click it to sign in — no password needed. The link expires in 24 hours.
        </p>

        <div className="rounded-xl border border-slate-100 bg-slate-50 px-5 py-4 text-left mb-8">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Checklist</p>
          {[
            'Check your spam/junk folder',
            'Make sure you entered the right email',
            'The link is one-time use only',
          ].map((tip) => (
            <div key={tip} className="flex items-center gap-2 py-1">
              <svg className="h-3.5 w-3.5 shrink-0 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm text-slate-600">{tip}</span>
            </div>
          ))}
        </div>

        <Link
          href="/auth/signin"
          className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
