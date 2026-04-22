import Link from 'next/link';
import UserMenu from './UserMenu';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10" style={{ background: '#0b1120' }}>
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6 py-4">

        <Link href="/" className="flex items-center gap-3 group">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl shadow-lg"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
          >
            <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="text-lg font-bold text-white tracking-tight">SiteAudit</span>
        </Link>

        <nav className="flex items-center gap-1">
          <Link
            href="/"
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
          >
            New Audit
          </Link>
          <div className="ml-3 pl-3 border-l border-white/10">
            <UserMenu />
          </div>
        </nav>

      </div>
    </header>
  );
}
