import { type JSX } from 'react';
import { cn } from '@/lib/utils';
import { IconTrendUp, IconTrendDown } from '@/components/common/icons';

interface ProductivityTrendProps {
  data: (number | null)[];
}

const W = 980;
const H = 160;
const PAD_L = 32;
const PAD_R = 12;
const PAD_T = 14;
const PAD_B = 24;
const CW = W - PAD_L - PAD_R;
const CH = H - PAD_T - PAD_B;

function buildSegments(pts: { x: number; y: number | null; v: number | null; label: string }[]) {
  const segments: (typeof pts)[] = [];
  let cur: typeof pts = [];
  for (const p of pts) {
    if (p.y == null) {
      if (cur.length > 1) segments.push(cur);
      cur = [];
    } else {
      cur.push(p);
    }
  }
  if (cur.length > 1) segments.push(cur);
  return segments;
}

function computeTrendBadge(pts: { v: number | null }[]): {
  up: boolean;
  delta: number;
  weeks: number;
} | null {
  const valid = pts.filter((p) => p.v != null);
  if (valid.length < 2) return null;
  const mid = Math.floor(valid.length / 2);
  const avgFirst = valid.slice(0, mid).reduce((s, p) => s + (p.v ?? 0), 0) / mid;
  const avgSecond = valid.slice(mid).reduce((s, p) => s + (p.v ?? 0), 0) / (valid.length - mid);
  return { up: avgSecond >= avgFirst, delta: Math.abs(avgSecond - avgFirst), weeks: valid.length };
}

export function ProductivityTrend({ data }: ProductivityTrendProps): JSX.Element {
  const span = Math.max(data.length - 1, 1);
  const pts = data.map((v, i) => ({
    x: PAD_L + (i / span) * CW,
    y: v == null ? null : PAD_T + (1 - v / 10) * CH,
    v,
    label: `W${i + 1}`,
  }));

  const segments = buildSegments(pts);
  const lastPt = pts.findLast((p) => p.y != null);
  const trend = computeTrendBadge(pts);

  return (
    <div className="border-gl-border bg-gl-surface shadow-gl rounded-xl border p-[22px]">
      <div className="mb-3.5 flex items-start justify-between gap-4">
        <div>
          <div className="text-gl-text text-[17px] leading-snug font-bold tracking-[-0.015em]">
            Productivity over time
          </div>
          <div className="text-gl-text-muted mt-1 text-[13px] leading-snug">
            Average score per week across all entries
          </div>
        </div>
        {trend && (
          <div
            className={cn(
              'inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold',
              trend.up ? 'bg-gl-primary-soft text-gl-primary' : 'bg-gl-danger-soft text-gl-danger',
            )}
          >
            {trend.up ? <IconTrendUp size={11} /> : <IconTrendDown size={11} />}
            {trend.up ? 'Trending up' : 'Trending down'} · {trend.up ? '+' : '-'}
            {trend.delta.toFixed(1)} over {trend.weeks} weeks
          </div>
        )}
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="block h-[160px] w-full" aria-hidden="true">
        <defs>
          <linearGradient id="gl-trend-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2EB8A0" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#2EB8A0" stopOpacity="0" />
          </linearGradient>
        </defs>

        {[0, 5, 10].map((v) => {
          const y = PAD_T + (1 - v / 10) * CH;
          return (
            <g key={v}>
              <line
                x1={PAD_L}
                x2={W - PAD_R}
                y1={y}
                y2={y}
                stroke="var(--gl-border)"
                strokeDasharray="4 4"
              />
              <text
                x={PAD_L - 8}
                y={y + 3}
                textAnchor="end"
                fontFamily="var(--font-mono)"
                fontSize="10"
                fill="var(--gl-text-faint)"
              >
                {v}
              </text>
            </g>
          );
        })}

        {pts.map((p) => (
          <text
            key={p.label}
            x={p.x}
            y={H - 6}
            textAnchor="middle"
            fontFamily="var(--font-mono)"
            fontSize="10"
            fill="var(--gl-text-faint)"
          >
            {p.label}
          </text>
        ))}

        {segments.map((seg, si) => {
          const d = seg.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
          const first = seg[0];
          const last = seg[seg.length - 1];
          const area = `${d} L${last.x},${PAD_T + CH} L${first.x},${PAD_T + CH} Z`;
          return (
            <g key={si}>
              <path d={area} fill="url(#gl-trend-fill)" />
              <path
                d={d}
                fill="none"
                stroke="var(--gl-primary)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          );
        })}

        {pts.map((p, i) =>
          p.y != null ? (
            <g key={i}>
              <circle
                cx={p.x}
                cy={p.y}
                r={p === lastPt ? 5 : 3.2}
                fill="var(--gl-surface)"
                stroke="var(--gl-primary)"
                strokeWidth="2"
              />
              {p === lastPt && (
                <text
                  x={p.x}
                  y={(p.y as number) - 10}
                  textAnchor="middle"
                  fontFamily="var(--font-sans)"
                  fontSize="11"
                  fontWeight="600"
                  fill="var(--gl-primary)"
                >
                  {p.v!.toFixed(1)}
                </text>
              )}
            </g>
          ) : null,
        )}
      </svg>
    </div>
  );
}
