const STEPS = [
  { step: '01', title: 'Enter your URL', desc: 'Paste any public website URL into the form above and hit Run Audit.' },
  { step: '02', title: 'We analyze it', desc: 'Our engine fetches your page and runs 30+ checks across SEO, performance, and security in parallel.' },
  { step: '03', title: 'Get your report', desc: 'Claude AI prioritizes findings and gives you concrete, actionable recommendations to fix issues.' },
];

export default function HowItWorksSection() {
  return (
    <section style={{ background: 'white', borderTop: '1px solid var(--card-border)', borderBottom: '1px solid var(--card-border)' }}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12 sm:py-20">
        <div className="text-center mb-10 sm:mb-14">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">How it works</h2>
          <p className="mt-4 text-base sm:text-lg text-slate-500">Three steps to a better website</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
          {STEPS.map((s) => (
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
  );
}
