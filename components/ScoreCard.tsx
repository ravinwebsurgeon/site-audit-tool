interface ScoreCardProps {
  category: string;
  icon: React.ReactNode;
  score: number;
}

interface ScoreConfig {
  label: string;
  topBorder: string;
  iconBg: string;
  labelBadge: string;
  number: string;
  bar: string;
}

function getConfig(score: number): ScoreConfig {
  if (score >= 80) {
    return {
      label: 'Good',
      topBorder: 'border-t-emerald-400',
      iconBg: 'bg-emerald-50 text-emerald-600',
      labelBadge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      number: 'text-emerald-600',
      bar: 'bg-linear-to-r from-emerald-400 to-emerald-500',
    };
  }
  if (score >= 50) {
    return {
      label: 'Needs Work',
      topBorder: 'border-t-amber-400',
      iconBg: 'bg-amber-50 text-amber-600',
      labelBadge: 'bg-amber-50 text-amber-700 border-amber-200',
      number: 'text-amber-600',
      bar: 'bg-linear-to-r from-amber-400 to-amber-500',
    };
  }
  return {
    label: 'Poor',
    topBorder: 'border-t-red-400',
    iconBg: 'bg-red-50 text-red-600',
    labelBadge: 'bg-red-50 text-red-700 border-red-200',
    number: 'text-red-600',
    bar: 'bg-linear-to-r from-red-400 to-red-500',
  };
}

export default function ScoreCard({ category, icon, score }: ScoreCardProps) {
  const cfg = getConfig(score);

  return (
    <div
      className={`rounded-2xl border-x border-b border-t-4 border-slate-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md ${cfg.topBorder}`}
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className={`flex h-9 w-9 items-center justify-center rounded-xl text-lg ${cfg.iconBg}`}>
            {icon}
          </span>
          <span className="text-sm font-semibold text-slate-700">{category}</span>
        </div>
        <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${cfg.labelBadge}`}>
          {cfg.label}
        </span>
      </div>

      <div className="flex items-baseline gap-1">
        <span className={`text-4xl font-bold tabular-nums ${cfg.number}`}>{score}</span>
        <span className="mb-0.5 text-sm font-medium text-slate-400">/100</span>
      </div>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-1.5 rounded-full transition-all duration-1000 ease-out ${cfg.bar}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}
