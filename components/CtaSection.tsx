import AuditForm from './AuditForm';

export default function CtaSection() {
  return (
    <section
      className="mx-auto max-w-full px-4 sm:px-6 py-14 sm:py-24 text-center w-full"
      style={{ background: '#0b1120' }}
    >
      <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
        Ready to audit your site?
      </h2>
      <p className="text-base sm:text-lg text-slate-300 mb-10">
        Free, instant, no account needed. Start improving your site today.
      </p>
      <div className="mx-auto max-w-2xl">
        <AuditForm />
      </div>
    </section>
  );
}
