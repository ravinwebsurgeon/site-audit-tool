interface ScoreCardProps {
  category: string;
  icon: React.ReactNode;
  score: number;
}

type Tier = 'good' | 'medium' | 'poor';

function getTier(score: number): Tier {
  if (score >= 80) return 'good';
  if (score >= 50) return 'medium';
  return 'poor';
}

const TIER_CONFIG = {
  good: {
    label: 'Good',
    gradient: 'linear-gradient(135deg, #10b981, #34d399)',
    glow: 'rgba(16,185,129,0.2)',
    labelBg: 'rgba(16,185,129,0.12)',
    labelColor: '#10b981',
    labelBorder: 'rgba(16,185,129,0.3)',
    bar: 'linear-gradient(90deg, #10b981, #34d399)',
    scoreColor: '#10b981',
    trackColor: 'rgba(16,185,129,0.12)',
  },
  medium: {
    label: 'Needs Work',
    gradient: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
    glow: 'rgba(245,158,11,0.2)',
    labelBg: 'rgba(245,158,11,0.12)',
    labelColor: '#f59e0b',
    labelBorder: 'rgba(245,158,11,0.3)',
    bar: 'linear-gradient(90deg, #f59e0b, #fbbf24)',
    scoreColor: '#f59e0b',
    trackColor: 'rgba(245,158,11,0.1)',
  },
  poor: {
    label: 'Poor',
    gradient: 'linear-gradient(135deg, #ef4444, #f87171)',
    glow: 'rgba(239,68,68,0.2)',
    labelBg: 'rgba(239,68,68,0.1)',
    labelColor: '#ef4444',
    labelBorder: 'rgba(239,68,68,0.3)',
    bar: 'linear-gradient(90deg, #ef4444, #f87171)',
    scoreColor: '#ef4444',
    trackColor: 'rgba(239,68,68,0.08)',
  },
};

const CAT_BG: Record<string, string> = {
  SEO: 'rgba(59,130,246,0.1)',
  PERFORMANCE: 'rgba(245,158,11,0.1)',
  SECURITY: 'rgba(16,185,129,0.1)',
};
const CAT_COLOR: Record<string, string> = {
  SEO: '#3b82f6',
  PERFORMANCE: '#f59e0b',
  SECURITY: '#10b981',
};

export default function ScoreCard({ category, icon, score }: ScoreCardProps) {
  const tier = getTier(score);
  const cfg = TIER_CONFIG[tier];

  return (
    <div
      className="relative overflow-hidden rounded-2xl border bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
      style={{ borderColor: '#e2e8f0' }}
    >
      {/* Subtle background glow */}
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at top right, ${cfg.glow}, transparent 70%)` }}
      />

      <div className="relative">
        {/* Header row */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-xl"
              style={{ background: CAT_BG[category] ?? 'rgba(99,102,241,0.1)', color: CAT_COLOR[category] ?? '#6366f1' }}
            >
              {icon}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#94a3b8' }}>
                {category}
              </p>
            </div>
          </div>

          <span
            className="rounded-full px-3 py-1 text-xs font-semibold border"
            style={{ background: cfg.labelBg, color: cfg.labelColor, borderColor: cfg.labelBorder }}
          >
            {cfg.label}
          </span>
        </div>

        {/* Score number */}
        <div className="flex items-baseline gap-1.5 mb-4">
          <span className="text-6xl font-extrabold tabular-nums leading-none" style={{ color: cfg.scoreColor }}>
            {score}
          </span>
          <span className="text-lg font-medium pb-1" style={{ color: '#cbd5e1' }}>/100</span>
        </div>

        {/* Progress bar */}
        <div className="h-2.5 overflow-hidden rounded-full" style={{ background: cfg.trackColor }}>
          <div
            className="h-2.5 rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${score}%`, background: cfg.bar }}
          />
        </div>
      </div>
    </div>
  );
}
