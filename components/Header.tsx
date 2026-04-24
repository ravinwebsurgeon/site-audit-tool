import Link from 'next/link';
import UserMenu from './UserMenu';

export default function Header() {
  return (
    <header
      className="sticky top-0 z-50 bg-[#11192e]"
      style={{
        // background: 'rgba(11,17,32,0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        boxShadow: '0 1px 0 rgba(255,255,255,0.04)',
      }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6 py-3.5">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group shrink-0">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-xl shadow-lg transition-transform duration-200 group-hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
          >
            <svg className="h-4.5 w-4.5 text-white" style={{ height: 18, width: 18 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="text-base font-bold text-white tracking-tight">SiteAudit</span>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-1">
          <div className="hidden sm:flex items-center gap-1 mr-2">
            <Link
              href="/"
              className="rounded-lg px-3.5 py-2 text-sm font-medium text-slate-400 transition-all hover:bg-white/8 hover:text-white"
            >
              New Audit
            </Link>
            {/* <Link
              href="/dashboard"
              className="rounded-lg px-3.5 py-2 text-sm font-medium text-slate-400 transition-all hover:bg-white/8 hover:text-white"
            >
              Dashboard
            </Link> */}
          </div>

          {/* Divider */}
          <div className="h-5 w-px bg-white/10 mx-1 hidden sm:block" />

          <div className="ml-2">
            <UserMenu />
          </div>
        </nav>

      </div>
    </header>
  );
}
