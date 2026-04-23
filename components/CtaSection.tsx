'use client'
import AuditForm from './AuditForm';

const BADGES = [
  { icon: '🔒', text: 'No account needed' },
  { icon: '⚡', text: 'Results in 20s' },
  { icon: '🤖', text: 'AI-powered' },
  { icon: '📊', text: '30+ checks' },
];

export default function CtaSection() {
  return (
    <section
      className="relative overflow-hidden"
      style={{ background: '#0b1120' }}
    >
      {/* Background effects */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 60% 50% at 50% 100%, rgba(99,102,241,0.2) 0%, transparent 70%)',
        }}
      />
      <div className="absolute inset-0 pointer-events-none dot-grid-white opacity-20" />

      <div className="relative mx-auto max-w-4xl px-4 sm:px-6 py-16 sm:py-24 text-center">

        {/* Heading */}
        <div
          className="mb-4 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-widest"
          style={{ borderColor: 'rgba(99,102,241,0.4)', background: 'rgba(99,102,241,0.1)', color: '#a5b4fc' }}
        >
          ✦ Get started for free
        </div>
        <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-4 leading-tight">
          Ready to audit your site?
        </h2>
        <p className="text-base sm:text-lg text-slate-400 mb-10 max-w-lg mx-auto">
          Free, instant, no account needed. Start improving your site in seconds.
        </p>

        {/* Form */}
        <div className="mx-auto max-w-2xl mb-10">
          <AuditForm />
        </div>

        {/* Trust badges */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          {BADGES.map((b) => (
            <div
              key={b.text}
              className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm text-slate-400"
              style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)' }}
            >
              <span>{b.icon}</span>
              {b.text}
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
