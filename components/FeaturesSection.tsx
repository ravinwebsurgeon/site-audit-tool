'use client'
const FEATURES = [
  {
    num: '01',
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
    color: '#3b82f6',
    bg: 'rgba(59,130,246,0.1)',
    hoverBorder: 'rgba(59,130,246,0.3)',
    hoverGlow: 'rgba(59,130,246,0.08)',
    title: 'SEO Analysis',
    desc: 'Title, meta tags, headings, Open Graph, canonical, robots.txt, sitemap, schema markup, and 15+ more critical checks.',
    checks: ['Title & meta tags', 'OG / Schema markup', 'Robots & Sitemap'],
  },
  {
    num: '02',
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.1)',
    hoverBorder: 'rgba(245,158,11,0.3)',
    hoverGlow: 'rgba(245,158,11,0.06)',
    title: 'Performance',
    desc: 'Server response time, HTML size, render-blocking resources, image optimization, lazy loading, and caching headers.',
    checks: ['Core Web Vitals', 'Render-blocking assets', 'Image optimization'],
  },
  {
    num: '03',
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    color: '#10b981',
    bg: 'rgba(16,185,129,0.1)',
    hoverBorder: 'rgba(16,185,129,0.3)',
    hoverGlow: 'rgba(16,185,129,0.06)',
    title: 'Security',
    desc: 'HTTPS, HSTS, CSP, X-Frame-Options, mixed content, CORS, server fingerprinting, and 10+ security headers.',
    checks: ['HTTPS & SSL cert', 'Security headers', 'Mixed content scan'],
  },
];

export default function FeaturesSection() {
  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-24 w-full">

      {/* Section header */}
      <div className="text-center mb-12 sm:mb-16">
        <div
          className="mb-4 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-widest"
          style={{ borderColor: 'rgba(99,102,241,0.25)', background: 'rgba(99,102,241,0.06)', color: '#6366f1' }}
        >
          What we check
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Everything you need to{' '}
          <span style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            rank higher
          </span>{' '}
          &amp; load faster
        </h2>
        <p className="mt-4 text-base sm:text-lg text-slate-500 max-w-xl mx-auto">
          30+ checks across three critical pillars — analyzed in parallel, summarized by AI.
        </p>
      </div>

      {/* Feature cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {FEATURES.map((f, i) => (
          <div
            key={f.title}
            className={`animate-fade-up group relative overflow-hidden rounded-2xl border bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 delay-${(i + 1) * 100}`}
            style={{
              borderColor: '#e8edf5',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.borderColor = f.hoverBorder;
              (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 0 1px ${f.hoverBorder}, 0 20px 48px ${f.hoverGlow}`;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.borderColor = '#e8edf5';
              (e.currentTarget as HTMLDivElement).style.boxShadow = '';
            }}
          >
            {/* Corner number */}
            <div
              className="absolute top-5 right-6 text-5xl font-black leading-none select-none transition-opacity duration-300 group-hover:opacity-100 opacity-30"
              style={{ color: f.color }}
            >
              {f.num}
            </div>

            {/* Subtle bg glow */}
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl"
              style={{ background: `radial-gradient(ellipse at top left, ${f.hoverGlow} 0%, transparent 65%)` }}
            />

            <div className="relative">
              {/* Icon */}
              <div
                className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110"
                style={{ background: f.bg, color: f.color }}
              >
                {f.icon}
              </div>

              {/* Title */}
              <h3 className="text-xl font-bold text-slate-900 mb-2.5">{f.title}</h3>

              {/* Description */}
              <p className="text-sm text-slate-500 leading-relaxed mb-5">{f.desc}</p>

              {/* Check list */}
              <ul className="space-y-2">
                {f.checks.map((check) => (
                  <li key={check} className="flex items-center gap-2.5 text-sm text-slate-600">
                    <span
                      className="flex h-4.5 w-4.5 items-center justify-center rounded-full"
                      style={{ background: f.bg, minWidth: 18, minHeight: 18 }}
                    >
                      <svg
                        style={{ width: 10, height: 10, color: f.color }}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    {check}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
