'use client';

import { useState } from 'react';

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
const H = 190;
const PAD = { top: 20, right: 24, bottom: 38, left: 44 };
const CHART_W = W - PAD.left - PAD.right;
const CHART_H = H - PAD.top - PAD.bottom;

function scoreColor(s: number) {
  if (s >= 80) return '#10b981';
  if (s >= 50) return '#f59e0b';
  return '#ef4444';
}

function scoreLabel(s: number) {
  if (s >= 80) return 'Good';
  if (s >= 50) return 'Needs Work';
  return 'Poor';
}

function smoothLinePath(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return '';
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const cp = (pts[i - 1].x + pts[i].x) / 2;
    d += ` C ${cp} ${pts[i - 1].y}, ${cp} ${pts[i].y}, ${pts[i].x} ${pts[i].y}`;
  }
  return d;
}

function smoothAreaPath(pts: { x: number; y: number }[], bottomY: number): string {
  if (pts.length < 2) return '';
  let d = `M ${pts[0].x} ${bottomY} L ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const cp = (pts[i - 1].x + pts[i].x) / 2;
    d += ` C ${cp} ${pts[i - 1].y}, ${cp} ${pts[i].y}, ${pts[i].x} ${pts[i].y}`;
  }
  d += ` L ${pts[pts.length - 1].x} ${bottomY} Z`;
  return d;
}

export default function ScoreTrendChart({ data }: ScoreTrendChartProps) {
  const [hovered, setHovered] = useState<number | null>(null);

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
      <div className="flex h-40 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-gradient-to-br from-slate-50 to-white">
        <div className="text-center">
          <svg className="mx-auto mb-2 h-8 w-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 17l4-8 4 4 4-6 4 4" />
          </svg>
          <p className="text-sm text-slate-400">Run at least 2 audits to see the trend.</p>
        </div>
      </div>
    );
  }

  const scores = valid.map((d) => d.score);
  const minScore = Math.max(0, Math.min(...scores) - 10);
  const maxScore = Math.min(100, Math.max(...scores) + 10);
  const minTime = valid[0].date.getTime();
  const maxTime = valid[valid.length - 1].date.getTime();
  const timeRange = maxTime - minTime || 1;

  const toX = (t: number) => PAD.left + ((t - minTime) / timeRange) * CHART_W;
  const toY = (s: number) => PAD.top + (1 - (s - minScore) / (maxScore - minScore)) * CHART_H;

  const points = valid.map((d) => ({ x: toX(d.date.getTime()), y: toY(d.score), ...d }));

  const linePath = smoothLinePath(points);
  const areaPath = smoothAreaPath(points, PAD.top + CHART_H);

  const latest = valid[valid.length - 1];
  const delta = latest.score - valid[0].score;
  const isUp = delta >= 0;

  const gridLines = [0, 25, 50, 75, 100].filter((v) => v >= minScore && v <= maxScore);

  const hoveredPoint = hovered !== null ? points[hovered] : null;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-50 px-5 py-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Score Trend</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-3xl font-bold tabular-nums" style={{ color: scoreColor(latest.score) }}>
              {latest.score}
            </span>
            <span className="text-sm text-slate-400">/ 100</span>
            <span
              className="inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-bold"
              style={{
                backgroundColor: isUp ? '#d1fae5' : '#fee2e2',
                color: isUp ? '#065f46' : '#991b1b',
              }}
            >
              {isUp ? '▲' : '▼'}&nbsp;{Math.abs(delta)}
            </span>
          </div>
        </div>
        <div className="text-right">
          <span
            className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
            style={{
              backgroundColor: scoreColor(latest.score) + '18',
              color: scoreColor(latest.score),
            }}
          >
            {scoreLabel(latest.score)}
          </span>
          <p className="mt-1.5 text-xs text-slate-400">{valid.length} audits</p>
        </div>
      </div>

      {/* SVG chart */}
      <div className="px-1 pb-3 pt-3">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="xMidYMid meet"
          className="w-full"
          role="img"
          aria-label="Score trend over time"
          onMouseLeave={() => setHovered(null)}
        >
          <defs>
            <linearGradient id="chartAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.18" />
              <stop offset="85%" stopColor="#6366f1" stopOpacity="0.02" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="chartLineGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#6366f1" />
            </linearGradient>
            <filter id="dotGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Grid */}
          {gridLines.map((v) => {
            const y = toY(v);
            const isMid = v === 50;
            return (
              <g key={v}>
                <line
                  x1={PAD.left}
                  y1={y}
                  x2={W - PAD.right}
                  y2={y}
                  stroke={isMid ? '#e2e8f0' : '#f1f5f9'}
                  strokeWidth={isMid ? 1.5 : 1}
                  strokeDasharray={isMid ? '5 4' : undefined}
                />
                <text x={PAD.left - 8} y={y + 4} textAnchor="end" fontSize="9" fill="#cbd5e1" fontFamily="system-ui">
                  {v}
                </text>
              </g>
            );
          })}

          {/* Area fill */}
          <path d={areaPath} fill="url(#chartAreaGrad)" />

          {/* Line */}
          <path
            d={linePath}
            fill="none"
            stroke="url(#chartLineGrad)"
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Hover crosshair */}
          {hoveredPoint && (
            <line
              x1={hoveredPoint.x}
              y1={PAD.top}
              x2={hoveredPoint.x}
              y2={PAD.top + CHART_H}
              stroke="#6366f1"
              strokeWidth="1"
              strokeDasharray="4 3"
              opacity="0.45"
            />
          )}

          {/* Data points */}
          {points.map((p, i) => {
            const isHov = hovered === i;
            const isLast = i === points.length - 1;
            const color = scoreColor(p.score);
            return (
              <g key={p.id} onMouseEnter={() => setHovered(i)} style={{ cursor: 'crosshair' }}>
                {/* Pulse halo on latest */}
                {isLast && !isHov && (
                  <circle cx={p.x} cy={p.y} r={11} fill={color} opacity={0.1} />
                )}
                {/* Outer ring on hover */}
                {isHov && (
                  <circle cx={p.x} cy={p.y} r={11} fill={color} opacity={0.15} />
                )}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isHov ? 7 : isLast ? 5 : 4}
                  fill={isHov ? color : '#ffffff'}
                  stroke={color}
                  strokeWidth={isHov ? 0 : 2.5}
                  filter={isHov ? 'url(#dotGlow)' : undefined}
                />
                {isHov && <circle cx={p.x} cy={p.y} r={2.5} fill="white" />}
              </g>
            );
          })}

          {/* Floating tooltip */}
          {hoveredPoint &&
            (() => {
              const TW = 138;
              const TH = 56;
              const tx = Math.min(Math.max(hoveredPoint.x - TW / 2, PAD.left + 2), W - PAD.right - TW - 2);
              const tyRaw = hoveredPoint.y - TH - 14;
              const ty = tyRaw < PAD.top ? hoveredPoint.y + 14 : tyRaw;
              let hostname = '';
              try { hostname = new URL(hoveredPoint.url).hostname; } catch { hostname = hoveredPoint.url; }
              return (
                <g style={{ pointerEvents: 'none' }}>
                  <rect x={tx} y={ty} width={TW} height={TH} rx="9" fill="#1e293b" opacity={0.93} />
                  <text x={tx + TW / 2} y={ty + 20} textAnchor="middle" fontSize="14" fontWeight="700" fill={scoreColor(hoveredPoint.score)} fontFamily="system-ui">
                    {hoveredPoint.score} / 100
                  </text>
                  <text x={tx + TW / 2} y={ty + 35} textAnchor="middle" fontSize="10" fill="#94a3b8" fontFamily="system-ui">
                    {hoveredPoint.date.toLocaleDateString('en', { month: 'short', day: 'numeric', year: '2-digit' })}
                  </text>
                  <text x={tx + TW / 2} y={ty + 49} textAnchor="middle" fontSize="9" fill="#475569" fontFamily="system-ui">
                    {hostname}
                  </text>
                </g>
              );
            })()}

          {/* X-axis labels */}
          <text x={points[0].x} y={H - 4} textAnchor="middle" fontSize="9" fill="#94a3b8" fontFamily="system-ui">
            {points[0].date.toLocaleDateString('en', { month: 'short', day: 'numeric' })}
          </text>
          <text x={points[points.length - 1].x} y={H - 4} textAnchor="middle" fontSize="9" fill="#6366f1" fontWeight="600" fontFamily="system-ui">
            {points[points.length - 1].date.toLocaleDateString('en', { month: 'short', day: 'numeric' })}
          </text>
          {points.length >= 5 && (
            <text x={points[Math.floor(points.length / 2)].x} y={H - 4} textAnchor="middle" fontSize="9" fill="#94a3b8" fontFamily="system-ui">
              {points[Math.floor(points.length / 2)].date.toLocaleDateString('en', { month: 'short', day: 'numeric' })}
            </text>
          )}
        </svg>
      </div>
    </div>
  );
}
