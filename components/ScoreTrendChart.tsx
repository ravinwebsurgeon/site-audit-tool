'use client';

interface TrendPoint {
  id: string;
  url: string;
  overallScore: number | null;
  completedAt: string | Date | null;
  createdAt: string | Date;
}

interface ScoreTrendChartProps {
  data: TrendPoint[];
}

const W = 600;
const H = 160;
const PAD = { top: 16, right: 16, bottom: 32, left: 36 };
const CHART_W = W - PAD.left - PAD.right;
const CHART_H = H - PAD.top - PAD.bottom;

function scoreColor(s: number) {
  if (s >= 80) return '#10b981';
  if (s >= 50) return '#f59e0b';
  return '#ef4444';
}

export default function ScoreTrendChart({ data }: ScoreTrendChartProps) {
  const valid = data
    .filter((d) => d.overallScore !== null)
    .map((d) => ({
      score: d.overallScore as number,
      date: new Date(d.completedAt ?? d.createdAt),
      url: d.url,
      id: d.id,
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  if (valid.length < 2) {
    return (
      <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50">
        <p className="text-sm text-slate-400">Run at least 2 audits to see the trend chart.</p>
      </div>
    );
  }

  const minScore = Math.max(0, Math.min(...valid.map((d) => d.score)) - 10);
  const maxScore = Math.min(100, Math.max(...valid.map((d) => d.score)) + 10);
  const minTime = valid[0].date.getTime();
  const maxTime = valid[valid.length - 1].date.getTime();
  const timeRange = maxTime - minTime || 1;

  const toX = (t: number) => PAD.left + ((t - minTime) / timeRange) * CHART_W;
  const toY = (s: number) => PAD.top + (1 - (s - minScore) / (maxScore - minScore)) * CHART_H;

  const points = valid.map((d) => ({ x: toX(d.date.getTime()), y: toY(d.score), ...d }));
  const polyline = points.map((p) => `${p.x},${p.y}`).join(' ');

  // Y-axis gridlines at 0, 50, 100
  const gridLines = [0, 25, 50, 75, 100].filter((v) => v >= minScore && v <= maxScore);

  return (
    <div className="w-full overflow-hidden rounded-xl border border-slate-100 bg-white p-4">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid meet"
        className="w-full"
        role="img"
        aria-label="Score trend over time"
      >
        <defs>
          <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {gridLines.map((v) => {
          const y = toY(v);
          return (
            <g key={v}>
              <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} stroke="#f1f5f9" strokeWidth="1" />
              <text x={PAD.left - 6} y={y + 4} textAnchor="end" fontSize="10" fill="#94a3b8">
                {v}
              </text>
            </g>
          );
        })}

        {/* Area fill */}
        <polygon
          points={`${points[0].x},${PAD.top + CHART_H} ${polyline} ${points[points.length - 1].x},${PAD.top + CHART_H}`}
          fill="url(#trendGrad)"
        />

        {/* Line */}
        <polyline points={polyline} fill="none" stroke="#6366f1" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

        {/* Data points */}
        {points.map((p) => (
          <g key={p.id}>
            <circle cx={p.x} cy={p.y} r="5" fill={scoreColor(p.score)} stroke="white" strokeWidth="2" />
            <title>{`${new URL(p.url).hostname} · ${p.score}/100 · ${p.date.toLocaleDateString()}`}</title>
          </g>
        ))}

        {/* X-axis date labels (first + last) */}
        <text x={points[0].x} y={H - 6} textAnchor="middle" fontSize="10" fill="#94a3b8">
          {points[0].date.toLocaleDateString('en', { month: 'short', day: 'numeric' })}
        </text>
        {points.length > 1 && (
          <text x={points[points.length - 1].x} y={H - 6} textAnchor="middle" fontSize="10" fill="#94a3b8">
            {points[points.length - 1].date.toLocaleDateString('en', { month: 'short', day: 'numeric' })}
          </text>
        )}
      </svg>
    </div>
  );
}
