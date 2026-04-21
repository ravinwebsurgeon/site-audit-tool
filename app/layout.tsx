import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import Link from 'next/link';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import Providers from '@/components/Providers';
import UserMenu from '@/components/UserMenu';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SiteAudit — SEO, Performance & Security Analysis',
  description:
    'Audit any website instantly for SEO, performance, and security issues with AI-powered recommendations.',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
        <Providers session={session}>

          {/* ── Header ── */}
          <header className="sticky top-0 z-50 border-b border-white/10" style={{ background: '#0b1120' }}>
            <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">

              {/* Logo */}
              <Link href="/" className="flex items-center gap-3 group">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-xl shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
                >
                  <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <span className="text-lg font-bold text-white tracking-tight">SiteAudit</span>
                  <span className="ml-2 hidden sm:inline-block rounded-full px-2 py-0.5 text-xs font-semibold text-indigo-300" style={{ background: 'rgba(99,102,241,0.2)' }}>
                    AI
                  </span>
                </div>
              </Link>

              {/* Nav */}
              <nav className="flex items-center gap-1">
                <Link
                  href="/"
                  className="rounded-lg px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
                >
                  New Audit
                </Link>
                {/* <Link
                  href="/dashboard"
                  className="rounded-lg px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
                >
                  Dashboard
                </Link> */}
                <div className="ml-3 pl-3 border-l border-white/10">
                  <UserMenu />
                </div>
              </nav>
            </div>
          </header>

          <main className="flex-1">{children}</main>

          {/* ── Footer ── */}
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

        </Providers>
      </body>
    </html>
  );
}
