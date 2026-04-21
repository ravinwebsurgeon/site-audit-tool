import AuditForm from '@/components/AuditForm';

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

const STATS = [
  { value: '30+', label: 'Checks run' },
  { value: 'AI', label: 'Recommendations' },
  { value: '< 20s', label: 'Audit time' },
  { value: 'Free', label: 'To use' },
];

export default function HomePage() {
  return (
    <div className="flex flex-col">

      {/* ── Hero Section ────────────────────────────────────── */}
      <section className="relative overflow-hidden" style={{ background: '#0b1120' }}>
        {/* Glow effects */}
        <div className="hero-glow absolute inset-0 pointer-events-none" />
        {/* Dot grid */}
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(148,163,184,0.4) 1px, transparent 0)',
            backgroundSize: '32px 32px',
          }}
        />

        <div className="relative mx-auto max-w-6xl px-6 py-24 sm:py-18 text-center">

          {/* Badge */}
          <div className="animate-fade-in mb-8 inline-flex items-center gap-2.5 rounded-full border px-5 py-2 text-sm font-semibold"
            style={{ borderColor: 'rgba(99,102,241,0.4)', background: 'rgba(99,102,241,0.12)', color: '#a5b4fc' }}>
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full rounded-full animate-ping" style={{ background: '#818cf8', opacity: 0.7 }} />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full" style={{ background: '#6366f1' }} />
            </span>
            Powered by Claude AI — Free to use
          </div>

          {/* Headline */}
          <h1 className="animate-fade-up mt-2 text-5xl font-extrabold tracking-tight text-white sm:text-7xl leading-[1.05]">
            Audit any website
            <br />
            <span className="text-gradient-blue">in seconds</span>
          </h1>

          <p className="animate-fade-up delay-100 mx-auto mt-7 max-w-2xl text-xl text-slate-400 leading-relaxed">
            Get a comprehensive technical report — SEO, performance, and security — with
            AI-generated, prioritized fixes. No signup required.
          </p>

          {/* Form container */}
          <div className="animate-fade-up delay-200 mx-auto mt-12 max-w-2xl">
            <AuditForm />
          </div>

          {/* Stats row */}
          <div className="animate-fade-up delay-300 mt-14 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-xl mx-auto">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-3xl font-extrabold text-white">{s.value}</p>
                <p className="mt-1 text-sm text-slate-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Divider wave ─────────────────────────────────────── */}
      {/* <div style={{ background: '#0b1120', lineHeight: 0 }}>
        <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', width: '100%' }}>
          <path d="M0 60L1440 60L1440 0C1200 50 240 50 0 0L0 60Z" fill="var(--background)" />
        </svg>
      </div> */}

      {/* ── Feature Cards ────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 py-20 w-full">
        <div className="text-center mb-14">
          <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">
            Everything you need to rank higher & load faster
          </h2>
          <p className="mt-4 text-lg text-slate-500 max-w-xl mx-auto">
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

      {/* ── How it works ─────────────────────────────────────── */}
      <section style={{ background: 'white', borderTop: '1px solid var(--card-border)', borderBottom: '1px solid var(--card-border)' }}>
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">How it works</h2>
            <p className="mt-4 text-lg text-slate-500">Three steps to a better website</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
            {[
              { step: '01', title: 'Enter your URL', desc: 'Paste any public website URL into the form above and hit Run Audit.' },
              { step: '02', title: 'We analyze it', desc: 'Our engine fetches your page and runs 30+ checks across SEO, performance, and security in parallel.' },
              { step: '03', title: 'Get your report', desc: 'Claude AI prioritizes findings and gives you concrete, actionable recommendations to fix issues.' },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div
                  className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl text-2xl font-extrabold text-white"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
                >
                  {s.step}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{s.title}</h3>
                <p className="text-base text-slate-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ───────────────────────────────────────── */}
      <section className="mx-auto max-w-full px-6 py-24 text-center w-full" 
      style={{ background: '#0b1120' }}
      >
        <h2 className="text-4xl font-extrabold text-white tracking-tight mb-4">
          Ready to audit your site?
        </h2>
        <p className="text-lg text-slate-300 mb-10">
          Free, instant, no account needed. Start improving your site today.
        </p>
        <div className="mx-auto max-w-2xl">
          <AuditForm />
        </div>
      </section>

    </div>
  );
}
