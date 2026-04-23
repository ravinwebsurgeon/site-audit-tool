'use client'
import AuditForm from './AuditForm';

const STATS = [
  { value: '30+', label: 'Audit checks', icon: '🔍' },
  { value: 'AI', label: 'Powered recs', icon: '🤖' },
  { value: '< 20s', label: 'Analysis time', icon: '⚡' },
  { value: 'Free', label: 'No credit card', icon: '🎉' },
];

const TRUST_ITEMS = [
  { text: 'SEO Analysis' },
  { text: 'Performance' },
  { text: 'Security Scan' },
  { text: 'AI Insights' },
];

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden" style={{ background: '#0b1120' }}>
      {/* Layered glow effects */}
      <div className="hero-glow absolute inset-0 pointer-events-none" />

      {/* Dot grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-25 dot-grid-white"
      />

      {/* Bottom fade */}
      <div
        className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, transparent, rgba(11,17,32,0.6))' }}
      />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:pb-28 text-center">

        {/* Badge */}
        <div
          className="animate-fade-in mb-7 inline-flex items-center gap-2.5 rounded-full border px-4 py-1.5 text-xs font-semibold tracking-wide uppercase"
          style={{
            borderColor: 'rgba(99,102,241,0.5)',
            background: 'rgba(99,102,241,0.1)',
            color: '#a5b4fc',
            backdropFilter: 'blur(8px)',
          }}
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full animate-ping" style={{ background: '#818cf8', opacity: 0.7 }} />
            <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: '#6366f1' }} />
          </span>
          Powered by Claude AI · Free to use
        </div>

        {/* Headline */}
        <h1 className="animate-fade-up mt-2 text-5xl font-extrabold tracking-tight text-white sm:text-7xl leading-[1.05]">
          Audit any website
          <br />
          <span className="text-gradient-blue">in seconds</span>
        </h1>

        {/* Sub-headline */}
        <p className="animate-fade-up delay-100 mx-auto mt-6 max-w-2xl text-base sm:text-lg text-slate-400 leading-relaxed">
          Get a comprehensive technical report covering SEO, performance, and security —
          with AI-generated, prioritized recommendations. No setup required.
        </p>

        {/* Feature chips */}
        <div className="animate-fade-up delay-150 mt-6 flex flex-wrap items-center justify-center gap-2">
          {TRUST_ITEMS.map((item) => (
            <span
              key={item.text}
              className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium"
              style={{
                borderColor: 'rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.05)',
                color: 'rgba(148,163,184,0.9)',
              }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: '#6366f1' }}
              />
              {item.text}
            </span>
          ))}
        </div>

        {/* Form */}
        <div className="animate-fade-up delay-200 mx-auto mt-10 max-w-2xl">
          <AuditForm />
        </div>

        {/* Stats */}
        <div className="animate-fade-up delay-300 mt-14 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-lg mx-auto">
          {STATS.map((s) => (
            <div
              key={s.label}
              className="flex flex-col items-center gap-1.5 rounded-2xl border px-3 py-4 transition-all duration-300 hover:border-indigo-500/30"
              style={{
                background: 'rgba(255,255,255,0.04)',
                borderColor: 'rgba(255,255,255,0.07)',
              }}
            >
              <span className="text-xl">{s.icon}</span>
              <p className="text-2xl font-extrabold text-white stat-number">{s.value}</p>
              <p className="text-xs text-slate-500">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Social proof */}
        <div className="animate-fade-up delay-400 mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 text-sm text-slate-500">
          <div className="flex -space-x-2">
            {['#6366f1', '#8b5cf6', '#ec4899', '#10b981', '#3b82f6'].map((c, i) => (
              <div
                key={i}
                className="h-7 w-7 rounded-full ring-2 ring-[#0b1120]"
                style={{ background: c }}
              />
            ))}
          </div>
          <span>
            Trusted by <span className="text-slate-300 font-semibold">1,200+</span> developers &amp; agencies
          </span>
        </div>

      </div>
    </section>
  );
}
