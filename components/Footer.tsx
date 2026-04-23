import Link from 'next/link';

const LINKS = {
  Product: [
    // { label: 'New Audit', href: '/' },
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Schedules', href: '/schedules' },
    { label: 'Compare Reports', href: '/compare' },
  ],
  Account: [
    // { label: 'Sign In', href: '/auth/signin' },
    { label: 'Profile', href: '/profile' },
    // { label: 'API Keys', href: '/settings/api-keys' },
  ],
};

export default function Footer() {
  return (
    <footer style={{ background: '#0b1120', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12">

        {/* Top grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 mb-10">
          {/* Brand */}
          <div className="sm:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-xl shadow-lg"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
              >
                <svg className="text-white" style={{ height: 16, width: 16 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-sm font-bold text-white">SiteAudit</span>
            </Link>
            <p className="text-sm text-slate-500 leading-relaxed max-w-xs">
              AI-powered website analysis. Identify issues, improve rankings, and ship a faster, more secure site.
            </p>
            {/* Built by */}
            <p className="mt-5 text-xs text-slate-600">
              Built by{' '}
              <Link
                href="https://thefabcode.org"
                target="_blank"
                className="text-slate-500 hover:text-slate-300 transition-colors font-medium"
              >
                The Fabcode IT Solutions LLP
              </Link>
            </p>
          </div>

          {/* Links */}
          {Object.entries(LINKS).map(([group, items]) => (
            <div key={group}>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-600 mb-4">{group}</p>
              <ul className="space-y-2.5">
                {items.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div
          className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
        >
          <p className="text-xs text-slate-600">
            © {new Date().getFullYear()} SiteAudit. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <a href="#" className="text-xs text-slate-600 hover:text-slate-400 transition-colors">Privacy</a>
            <a href="#" className="text-xs text-slate-600 hover:text-slate-400 transition-colors">Terms</a>
          </div>
        </div>

      </div>
    </footer>
  );
}
