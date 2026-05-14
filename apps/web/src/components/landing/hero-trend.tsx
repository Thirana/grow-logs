const TREND = [6.8, 7.1, 6.5, 7.4, null, 7.6, 7.8, 8.0];
const W = 260;
const H = 64;
const PAD = 6;

interface Point {
  x: number;
  y: number | null;
  v: number | null;
}

function buildPoints(): Point[] {
  const cw = W - PAD * 2;
  const ch = H - 8;
  return TREND.map((v, i) => ({
    x: PAD + (i / (TREND.length - 1)) * cw,
    y: v == null ? null : 4 + (1 - v / 10) * ch,
    v,
  }));
}

function buildSegments(pts: Point[]): Point[][] {
  const segments: Point[][] = [];
  let current: Point[] = [];
  for (const p of pts) {
    if (p.y == null) {
      if (current.length > 1) segments.push(current);
      current = [];
    } else {
      current.push(p);
    }
  }
  if (current.length > 1) segments.push(current);
  return segments;
}

export function HeroTrend() {
  const pts = buildPoints();
  const segments = buildSegments(pts);
  const last = pts[pts.length - 1];

  return (
    <div className="flex flex-col gap-2.5 rounded-xl border border-gl-border bg-gl-surface p-5">
      <p className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-gl-text-muted">
        Productivity · 8 wk
      </p>

      <div className="flex items-baseline justify-between">
        <span className="font-sans text-[28px] font-bold tabular-nums tracking-[-0.025em] text-gl-text">
          {last.v?.toFixed(1)}
          <span className="ml-0.5 text-[15px] font-semibold text-gl-text-muted"> / 10</span>
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-gl-primary-soft px-2 py-1 text-[11px] font-semibold text-gl-primary whitespace-nowrap">
          ↗ +1.2
        </span>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="block h-14 w-full"
        aria-hidden="true"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="heroTrendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--gl-primary)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--gl-primary)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {segments.map((seg, si) => {
          const linePath = seg
            .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y!.toFixed(1)}`)
            .join(' ');
          const first = seg[0];
          const l = seg[seg.length - 1];
          const areaPath = `${linePath} L${l.x},${H} L${first.x},${H} Z`;

          return (
            <g key={si}>
              <path d={areaPath} fill="url(#heroTrendFill)" />
              <path
                d={linePath}
                fill="none"
                stroke="var(--gl-primary)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          );
        })}

        {last.y != null && (
          <circle
            cx={last.x}
            cy={last.y}
            r={3.5}
            fill="var(--gl-surface)"
            stroke="var(--gl-primary)"
            strokeWidth="2"
          />
        )}
      </svg>
    </div>
  );
}
