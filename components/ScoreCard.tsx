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
    glow: 'rgba(16,185,129,0.18)',
    labelBg: 'rgba(16,185,129,0.1)',
    labelColor: '#059669',
    labelBorder: 'rgba(16,185,129,0.25)',
    bar: 'linear-gradient(90deg, #10b981, #34d399)',
    scoreColor: '#10b981',
    trackColor: 'rgba(16,185,129,0.1)',
  },
  medium: {
    label: 'Needs Work',
    gradient: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
    glow: 'rgba(245,158,11,0.18)',
    labelBg: 'rgba(245,158,11,0.1)',
    labelColor: '#d97706',
    labelBorder: 'rgba(245,158,11,0.25)',
    bar: 'linear-gradient(90deg, #f59e0b, #fbbf24)',
    scoreColor: '#f59e0b',
    trackColor: 'rgba(245,158,11,0.08)',
  },
  poor: {
    label: 'Poor',
    gradient: 'linear-gradient(135deg, #ef4444, #f87171)',
    glow: 'rgba(239,68,68,0.18)',
    labelBg: 'rgba(239,68,68,0.08)',
    labelColor: '#dc2626',
    labelBorder: 'rgba(239,68,68,0.25)',
    bar: 'linear-gradient(90deg, #ef4444, #f87171)',
    scoreColor: '#ef4444',
    trackColor: 'rgba(239,68,68,0.07)',
  },
};

const CAT_CONFIG: Record<string, { bg: string; color: string }> = {
  SEO:           { bg: 'rgba(59,130,246,0.1)',  color: '#3b82f6' },
  PERFORMANCE:   { bg: 'rgba(245,158,11,0.1)',  color: '#f59e0b' },
  SECURITY:      { bg: 'rgba(16,185,129,0.1)',  color: '#10b981' },
  ACCESSIBILITY: { bg: 'rgba(139,92,246,0.1)',  color: '#8b5cf6' },
};

export default function ScoreCard({ category, icon, score }: ScoreCardProps) {
  const tier = getTier(score);
  const cfg = TIER_CONFIG[tier];
  const cat = CAT_CONFIG[category] ?? { bg: 'rgba(99,102,241,0.1)', color: '#6366f1' };

  return (
    <div
      className="relative overflow-hidden rounded-xl border bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
      style={{ borderColor: '#e8edf5' }}
    >
      {/* Subtle background glow */}
      <div
        className="absolute inset-0 opacity-50 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at top right, ${cfg.glow}, transparent 65%)` }}
      />

      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-lg"
              style={{ background: cat.bg, color: cat.color }}
            >
              {icon}
            </div>
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#94a3b8' }}>
              {category}
            </p>
          </div>
          <span
            className="rounded-full px-2.5 py-1 text-xs font-semibold border"
            style={{ background: cfg.labelBg, color: cfg.labelColor, borderColor: cfg.labelBorder }}
          >
            {cfg.label}
          </span>
        </div>

        {/* Score */}
        <div className="flex items-baseline gap-1.5 mb-3">
          <span
            className="text-5xl font-extrabold tabular-nums leading-none"
            style={{ color: cfg.scoreColor }}
          >
            {score}
          </span>
          <span className="text-sm font-medium pb-1" style={{ color: '#cbd5e1' }}>/100</span>
        </div>

        {/* Progress bar */}
        <div className="h-2 overflow-hidden rounded-full" style={{ background: cfg.trackColor }}>
          <div
            className="h-2 rounded-full progress-bar"
            style={{ width: `${score}%`, background: cfg.bar }}
          />
        </div>
      </div>
    </div>
  );
}
