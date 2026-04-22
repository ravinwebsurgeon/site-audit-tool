import AuditForm from './AuditForm';

const STATS = [
  { value: '30+', label: 'Checks run' },
  { value: 'AI', label: 'Recommendations' },
  { value: '< 20s', label: 'Audit time' },
  { value: 'Free', label: 'To use' },
];

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden" style={{ background: '#0b1120' }}>
      <div className="hero-glow absolute inset-0 pointer-events-none" />
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(148,163,184,0.4) 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }}
      />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 py-14 sm:py-24 text-center">

        <div
          className="animate-fade-in mb-8 inline-flex items-center gap-2.5 rounded-full border px-5 py-2 text-sm font-semibold"
          style={{ borderColor: 'rgba(99,102,241,0.4)', background: 'rgba(99,102,241,0.12)', color: '#a5b4fc' }}
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full rounded-full animate-ping" style={{ background: '#818cf8', opacity: 0.7 }} />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full" style={{ background: '#6366f1' }} />
          </span>
          Powered by Claude AI — Free to use
        </div>

        <h1 className="animate-fade-up mt-2 text-5xl font-extrabold tracking-tight text-white sm:text-7xl leading-[1.05]">
          Audit any website
          <br />
          <span className="text-gradient-blue">in seconds</span>
        </h1>

        <p className="animate-fade-up delay-100 mx-auto mt-7 max-w-2xl text-base sm:text-xl text-slate-400 leading-relaxed">
          Get a comprehensive technical report — SEO, performance, and security — with
          AI-generated, prioritized fixes. No signup required.
        </p>

        <div className="animate-fade-up delay-200 mx-auto mt-12 max-w-2xl">
          <AuditForm />
        </div>

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
  );
}
