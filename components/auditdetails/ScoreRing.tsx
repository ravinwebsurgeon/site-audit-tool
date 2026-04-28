export default function ScoreRing({ score }: { score: number }) {
  const r = 90;
  const cx = 110;
  const cy = 110;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference - (score / 100) * circumference;

  const isGood = score >= 80;
  const isMed = score >= 50;

  const [from, to] = isGood
    ? ["#10b981", "#34d399"]
    : isMed
      ? ["#f59e0b", "#fbbf24"]
      : ["#ef4444", "#f87171"];

  const label = isGood ? "Excellent" : isMed ? "Needs Work" : "Poor";
  const labelColor = isGood ? "#10b981" : isMed ? "#f59e0b" : "#ef4444";
  const glowColor = isGood
    ? "rgba(16,185,129,0.3)"
    : isMed
      ? "rgba(245,158,11,0.3)"
      : "rgba(239,68,68,0.3)";

  return (
    <div className="flex flex-col items-center justify-center">
      <div
        className="relative"
        style={{ filter: `drop-shadow(0 0 24px ${glowColor})` }}
      >
        <svg width="220" height="220" viewBox="0 0 220 220">
          <defs>
            <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={from} />
              <stop offset="100%" stopColor={to} />
            </linearGradient>
          </defs>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth="14" />
          <circle
            cx={cx} cy={cy} r={r} fill="none"
            stroke="url(#scoreGrad)" strokeWidth="14" strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={dashOffset}
            transform={`rotate(-90 ${cx} ${cy})`}
            style={{ transition: "stroke-dashoffset 1.4s cubic-bezier(0.4,0,0.2,1)" }}
          />
          <text
            x={cx} y={cy} textAnchor="middle" dominantBaseline="middle"
            fill={from} fontSize="64" fontWeight="800"
            fontFamily="var(--font-geist-sans, sans-serif)"
          >
            {score}
          </text>
          <text
            x={cx} y={cy + 42} textAnchor="middle"
            fill="#94a3b8" fontSize="18" fontWeight="500"
            fontFamily="var(--font-geist-sans, sans-serif)"
          >
            out of 100
          </text>
        </svg>
      </div>
      <span
        className="mt-2 rounded-full px-4 py-1.5 text-sm font-bold"
        style={{ background: `${from}18`, color: labelColor }}
      >
        {label}
      </span>
    </div>
  );
}
