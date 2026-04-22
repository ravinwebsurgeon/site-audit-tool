const FEATURES = [
  {
    icon: (
      <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
    color: '#3b82f6',
    bg: 'rgba(59,130,246,0.12)',
    title: 'SEO Analysis',
    desc: 'Title, meta tags, headings, Open Graph, canonical, robots.txt, sitemap, schema markup, and 15+ more checks.',
  },
  {
    icon: (
      <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.12)',
    title: 'Performance',
    desc: 'Server response time, HTML size, render-blocking resources, image optimization, lazy loading, and caching headers.',
  },
  {
    icon: (
      <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    color: '#10b981',
    bg: 'rgba(16,185,129,0.12)',
    title: 'Security',
    desc: 'HTTPS, HSTS, CSP, X-Frame-Options, mixed content, CORS, server fingerprinting, and 10+ security headers.',
  },
];

export default function FeaturesSection() {
  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6 py-12 sm:py-20 w-full">
      <div className="text-center mb-10 sm:mb-14">
        <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Everything you need to rank higher &amp; load faster
        </h2>
        <p className="mt-4 text-base sm:text-lg text-slate-500 max-w-xl mx-auto">
          30+ checks across three critical pillars — analyzed in parallel, summarized by AI.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {FEATURES.map((f, i) => (
          <div
            key={f.title}
            className={`animate-fade-up rounded-2xl border bg-white p-8 shadow-sm hover:shadow-xl transition-all duration-300 group cursor-default delay-${(i + 1) * 100}`}
            style={{ borderColor: 'var(--card-border)' }}
          >
            <div
              className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110"
              style={{ background: f.bg, color: f.color }}
            >
              {f.icon}
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">{f.title}</h3>
            <p className="text-base text-slate-500 leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
