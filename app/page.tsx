import AuditForm from '@/components/AuditForm';

export default function HomePage() {
  return (
    <div className="relative overflow-hidden">
      {/* ── Background ── */}
      <div className="absolute inset-0 -z-10 bg-linear-to-b from-white via-blue-50/20 to-indigo-50/30" />
      <div
        className="absolute inset-0 -z-10"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgb(99 102 241 / 0.08) 1px, transparent 0)',
          backgroundSize: '28px 28px',
        }}
      />
      {/* Soft glow blobs */}
      <div className="absolute -top-40 left-1/2 -z-10 h-80 w-80 -translate-x-1/2 rounded-full bg-blue-200/30 blur-3xl" />
      <div className="absolute top-20 right-0 -z-10 h-64 w-64 rounded-full bg-indigo-200/20 blur-3xl" />

      {/* ── Hero ── */}
      <section className="mx-auto max-w-4xl px-6 pb-12 pt-20 text-center">
        {/* Live badge */}
        <div className="animate-fade-in mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50/80 px-4 py-1.5 text-sm font-medium text-indigo-700">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-500" />
          </span>
          Powered by Claude AI
        </div>

        {/* Headline */}
        <h1 className="animate-fade-up mt-2 text-5xl font-bold tracking-tight text-slate-900 sm:text-6xl leading-[1.1]">
          Audit any website
          <br />
          <span className="bg-linear-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
            in seconds
          </span>
        </h1>

        <p className="animate-fade-up delay-100 mx-auto mt-5 max-w-xl text-lg text-slate-500 leading-relaxed">
          Get a comprehensive report on SEO, performance, and security — with
          prioritized, actionable fixes from Claude AI.
        </p>

        {/* Form */}
        <div className="animate-fade-up delay-200 mx-auto mt-10 max-w-2xl">
          <AuditForm />
        </div>

        {/* Trust row */}
        <p className="animate-fade-up delay-300 mt-4 text-xs text-slate-400">
          Free to use · No sign-up required · Results cached 24 hours
        </p>
      </section>

      {/* ── Feature cards ── */}
      <section className="mx-auto max-w-4xl px-6 pb-24">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            {
              icon: (
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              ),
              bg: 'bg-blue-50',
              border: 'hover:border-blue-200',
              title: 'SEO Analysis',
              items: ['Title & meta description', 'H1–H6 heading structure', 'Open Graph & canonical', 'Sitemap & robots.txt'],
            },
            {
              icon: (
                <svg className="h-6 w-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              ),
              bg: 'bg-amber-50',
              border: 'hover:border-amber-200',
              title: 'Performance',
              items: ['Page size & load time', 'Render-blocking resources', 'Script & style count', 'Image optimization hints'],
            },
            {
              icon: (
                <svg className="h-6 w-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              ),
              bg: 'bg-emerald-50',
              border: 'hover:border-emerald-200',
              title: 'Security',
              items: ['HTTPS enforcement', 'CSP, HSTS & X-Frame', 'Mixed content detection', 'Server header disclosure'],
            },
          ].map((f) => (
            <div
              key={f.title}
              className={`rounded-2xl border border-slate-100 bg-white/80 p-6 shadow-sm backdrop-blur-sm transition-all duration-200 hover:shadow-md ${f.border}`}
            >
              <div className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl ${f.bg}`}>
                {f.icon}
              </div>
              <h3 className="font-semibold text-slate-900">{f.title}</h3>
              <ul className="mt-3 space-y-2">
                {f.items.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-slate-500">
                    <svg className="h-3.5 w-3.5 shrink-0 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
