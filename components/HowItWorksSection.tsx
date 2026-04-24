'use client'
const STEPS = [
  {
    step: '01',
    icon: (
      <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
      </svg>
    ),
    title: 'Enter your URL',
    desc: 'Paste any public website URL into the form and hit Run Audit. No account or setup required.',
    color: '#6366f1',
    bg: 'rgba(99,102,241,0.1)',
  },
  {
    step: '02',
    icon: (
      <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
      </svg>
    ),
    title: 'We analyze it',
    desc: 'Our engine fetches your page and runs 30+ checks across SEO, performance, and security in parallel.',
    color: '#8b5cf6',
    bg: 'rgba(139,92,246,0.1)',
  },
  {
    step: '03',
    icon: (
      <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    title: 'Get your report',
    desc: 'Claude AI prioritizes findings and gives you concrete, actionable recommendations to fix every issue.',
    color: '#10b981',
    bg: 'rgba(16,185,129,0.1)',
  },
];

export default function HowItWorksSection() {
  return (
    <section style={{ background: '#f8faff', borderTop: '1px solid var(--card-border)', borderBottom: '1px solid var(--card-border)' }}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-24">

        {/* Header */}
        <div className="text-center mb-12 sm:mb-16">
          <div
            className="mb-4 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-widest"
            style={{ borderColor: 'rgba(99,102,241,0.25)', background: 'rgba(99,102,241,0.06)', color: '#6366f1' }}
          >
            How it works
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Three steps to a better website
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-500 max-w-md mx-auto">
            From URL to actionable report in under 20 seconds.
          </p>
        </div>

        {/* Steps */}
        <div className="relative grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-6">

          {/* Connecting line (desktop) */}
          {/* <div
            className="hidden sm:block absolute top-12 left-1/6 right-1/6 h-px pointer-events-none"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.3) 20%, rgba(99,102,241,0.3) 80%, transparent)' }}
          /> */}

          {STEPS.map((s, i) => (
            <div
              key={s.step}
              className={`animate-fade-up relative flex flex-col items-center text-center delay-${(i + 1) * 100}`}
            >
              {/* Step circle */}
              <div className="relative mb-6">
                {/* Outer glow ring */}
                <div
                  className="absolute inset-0 rounded-full opacity-30 blur-md"
                  style={{ background: s.color, transform: 'scale(1.4)' }}
                />
                <div
                  className="relative flex h-20 w-20 items-center justify-center rounded-2xl shadow-lg"
                  style={{ background: `linear-gradient(135deg, ${s.bg.replace('0.1)', '0.15)')}, ${s.bg})`, border: `1.5px solid ${s.color}22` }}
                >
                  <span style={{ color: s.color }}>{s.icon}</span>
                </div>
                {/* Step number badge */}
                <div
                  className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full text-xs font-black text-white shadow-md"
                  style={{ background: `linear-gradient(135deg, ${s.color}, ${s.color}bb)` }}
                >
                  {i + 1}
                </div>
              </div>

              <h3 className="text-xl font-bold text-slate-900 mb-3">{s.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed max-w-xs mx-auto">{s.desc}</p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
