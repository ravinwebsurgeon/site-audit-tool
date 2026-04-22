import Link from 'next/link';

export default function Footer() {
  return (
    <footer style={{ background: '#0b1120', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="mx-auto max-w-6xl px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">

        <div className="flex items-center gap-3">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-lg"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
          >
            <svg className="h-3.5 w-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-white">SiteAudit</span>
          <span className="text-slate-600">·</span>
          <span className="text-sm text-slate-500">AI-powered website analysis</span>
        </div>

        <p className="text-sm text-slate-500">
          Built by{' '}
          <Link
            href="https://thefabcode.org"
            target="_blank"
            className="text-slate-400 hover:text-white transition-colors font-medium"
          >
            The Fabcode IT Solutions LLP
          </Link>
        </p>

      </div>
    </footer>
  );
}
