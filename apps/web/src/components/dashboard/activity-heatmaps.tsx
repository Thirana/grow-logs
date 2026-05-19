'use client';

// Three-panel heatmap card: productivity score · daily focus · category spotlight.
// ActivityHeatmapsView — pure presentational, used by the dashboard and the landing page preview.
// ActivityHeatmaps     — data-fetching wrapper for the dashboard.
// Used by: components/dashboard/dashboard-client.tsx
//          components/landing/live-preview.tsx (ActivityHeatmapsView)
import { type JSX, useMemo, useState, useCallback } from 'react';
import { useEntriesSummary } from '@/hooks/use-entries';

// ── Types ─────────────────────────────────────────────────────────────────────

type HeatmapPeriod = '30d' | 'month';

type DayData = {
  workCount: number;
  learnCount: number;
  avgScore: number | null;
  categoryCount: number;
  dominantCategory: { name: string; color: string } | null;
};

type DailyEntry = DayData & { date: string };

type ByCategoryEntry = { category: { id: string; name: string; color: string } };

type GridCell = {
  date: string;
  day: number;
  isToday: boolean;
  isFuture: boolean;
  isPadding: boolean;
};

type CellStyleFn = (cell: GridCell, data: DayData | null) => React.CSSProperties;
type CellContentFn = (cell: GridCell, data: DayData | null) => React.ReactNode;

// ── Date helpers ───────────────────────────────────────────────────────────────

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function localDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function buildCells(period: HeatmapPeriod): GridCell[] {
  const today = new Date();
  const todayStr = localDate(today);
  const start =
    period === 'month' ? new Date(today.getFullYear(), today.getMonth(), 1) : addDays(today, -29);
  const end = period === 'month' ? new Date(today.getFullYear(), today.getMonth() + 1, 0) : today;

  const cells: GridCell[] = [];
  const padStart = (start.getDay() + 6) % 7;

  for (let i = 0; i < padStart; i++) {
    cells.push({ date: '', day: 0, isToday: false, isFuture: false, isPadding: true });
  }

  let cur = new Date(start);
  while (cur <= end) {
    const ds = localDate(cur);
    cells.push({
      date: ds,
      day: cur.getDate(),
      isToday: ds === todayStr,
      isFuture: ds > todayStr,
      isPadding: false,
    });
    cur = addDays(cur, 1);
  }

  while (cells.length % 7 !== 0) {
    cells.push({ date: '', day: 0, isToday: false, isFuture: false, isPadding: true });
  }

  return cells;
}

// ── Cell style functions ───────────────────────────────────────────────────────

const BG_HIDDEN: React.CSSProperties = { visibility: 'hidden' };
const BG_FUTURE: React.CSSProperties = { backgroundColor: 'rgba(255,255,255,0.03)' };
const BG_NONE: React.CSSProperties = { backgroundColor: 'rgba(255,255,255,0.06)' };

function scoreStyle(cell: GridCell, data: DayData | null): React.CSSProperties {
  if (cell.isPadding) return BG_HIDDEN;
  if (cell.isFuture) return BG_FUTURE;
  if (!data) return BG_NONE;
  const s = data.avgScore;
  if (s === null) return { backgroundColor: 'rgba(255,255,255,0.11)' };
  if (s >= 8)
    return { backgroundColor: `rgba(46,184,160,${(0.38 + ((s - 8) / 2) * 0.62).toFixed(2)})` };
  if (s >= 5)
    return { backgroundColor: `rgba(196,160,94,${(0.32 + ((s - 5) / 3) * 0.48).toFixed(2)})` };
  return { backgroundColor: `rgba(184,112,96,${(0.28 + ((s - 1) / 4) * 0.52).toFixed(2)})` };
}

function scoreContent(cell: GridCell, data: DayData | null): React.ReactNode {
  const s = data?.avgScore;
  if (cell.isPadding || cell.isFuture || s == null) return null;
  const ink =
    s >= 8
      ? (s - 8) / 2 > 0.25
        ? '#051a16'
        : '#2eb8a0'
      : s >= 5
        ? (s - 5) / 3 > 0.32
          ? '#1a1200'
          : '#c4a05e'
        : (s - 1) / 4 > 0.28
          ? '#1c0907'
          : '#b87060';
  return (
    <span
      className="text-[10px] leading-none font-bold tabular-nums sm:text-[11px]"
      style={{ color: ink }}
    >
      {s.toFixed(s % 1 === 0 ? 0 : 1)}
    </span>
  );
}

function focusStyle(cell: GridCell, data: DayData | null): React.CSSProperties {
  if (cell.isPadding) return BG_HIDDEN;
  if (cell.isFuture) return BG_FUTURE;
  if (!data || data.categoryCount === 0) return BG_NONE;
  const n = data.categoryCount;
  if (n === 1) return { backgroundColor: 'rgba(46,184,160,0.88)' };
  if (n === 2) return { backgroundColor: 'rgba(46,184,160,0.50)' };
  if (n === 3) return { backgroundColor: 'rgba(196,160,94,0.55)' };
  return { backgroundColor: 'rgba(196,160,94,0.82)' };
}

function focusContent(cell: GridCell, data: DayData | null): React.ReactNode {
  if (cell.isPadding || cell.isFuture || !data || data.categoryCount <= 1) return null;
  const n = data.categoryCount;
  const ink = n <= 2 ? '#051a16' : '#1a1200';
  return (
    <span
      className="text-[10px] leading-none font-bold tabular-nums sm:text-[11px]"
      style={{ color: ink }}
    >
      {n}
    </span>
  );
}

function hexRgba(hex: string, alpha: number): string {
  if (!hex || hex.length < 7) return `rgba(128,128,128,${alpha})`;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return `rgba(128,128,128,${alpha})`;
  return `rgba(${r},${g},${b},${alpha})`;
}

function categoryStyle(cell: GridCell, data: DayData | null): React.CSSProperties {
  if (cell.isPadding) return BG_HIDDEN;
  if (cell.isFuture) return BG_FUTURE;
  if (!data || !data.dominantCategory) return BG_NONE;
  return { backgroundColor: hexRgba(data.dominantCategory.color, 0.72) };
}

function categoryContent(_cell: GridCell, _data: DayData | null): React.ReactNode {
  return null;
}

// ── HeatmapPanel ──────────────────────────────────────────────────────────────

interface HeatmapPanelProps {
  title: string;
  subtitle: string;
  cells: GridCell[];
  dailyMap: Map<string, DayData>;
  hoveredDate: string | null;
  onHover: (date: string | null, rect: DOMRect | null) => void;
  getCellStyle: CellStyleFn;
  getCellContent: CellContentFn;
  legend: React.ReactNode;
  stats: React.ReactNode;
  className?: string;
}

function HeatmapPanel({
  title,
  subtitle,
  cells,
  dailyMap,
  hoveredDate,
  onHover,
  getCellStyle,
  getCellContent,
  legend,
  stats,
  className = '',
}: HeatmapPanelProps): JSX.Element {
  return (
    <div className={className}>
      <div className="mb-3">
        <div className="text-gl-text text-[14px] leading-snug font-bold tracking-[-0.01em]">
          {title}
        </div>
        <div className="text-gl-text-faint mt-0.5 text-[11.5px]">{subtitle}</div>
      </div>

      <div className="grid w-full grid-cols-7 gap-1 sm:w-fit">
        {DAY_LABELS.map((d) => (
          <div
            key={d}
            className="text-gl-text-faint mb-0.5 flex aspect-square w-full items-center justify-center text-[9.5px] font-semibold tracking-[0.04em] sm:aspect-auto sm:size-9"
          >
            {d}
          </div>
        ))}
        {cells.map((cell, i) => {
          const data = cell.date ? (dailyMap.get(cell.date) ?? null) : null;
          const isHovered = !cell.isPadding && cell.date === hoveredDate;
          return (
            <div
              key={i}
              className={`relative flex aspect-square w-full cursor-default items-center justify-center rounded-[7px] transition-all duration-100 sm:aspect-auto sm:size-9 sm:rounded-[8px] ${
                cell.isToday
                  ? 'ring-gl-primary ring-2 ring-offset-1 ring-offset-[var(--gl-surface)]'
                  : isHovered
                    ? 'ring-2 ring-white/30 ring-offset-1 ring-offset-[var(--gl-surface)]'
                    : ''
              } ${cell.isFuture || cell.isPadding ? 'pointer-events-none opacity-25' : 'hover:opacity-75'}`}
              style={getCellStyle(cell, data)}
              onMouseEnter={(e) => {
                if (!cell.isPadding && !cell.isFuture && cell.date) {
                  onHover(cell.date, e.currentTarget.getBoundingClientRect());
                }
              }}
              onMouseLeave={() => onHover(null, null)}
            >
              {getCellContent(cell, data)}
            </div>
          );
        })}
      </div>

      <div className="mt-2.5">{legend}</div>
      <div className="border-gl-border mt-3 border-t pt-3">{stats}</div>
    </div>
  );
}

// ── Mini stat ─────────────────────────────────────────────────────────────────

interface MiniStatProps {
  label: string;
  value: React.ReactNode;
}

function MiniStat({ label, value }: MiniStatProps): JSX.Element {
  return (
    <div className="min-w-0">
      <div className="text-gl-text-faint text-[10px] font-semibold tracking-[0.06em] uppercase">
        {label}
      </div>
      <div className="text-gl-text mt-0.5 truncate text-[13px] leading-snug font-semibold">
        {value}
      </div>
    </div>
  );
}

function fmtShort(ds: string): string {
  return new Date(`${ds}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ── ActivityHeatmapsView — pure presentational ────────────────────────────────
//
// Manages its own period + hover state. Accepts an optional onPeriodChange
// callback so ActivityHeatmaps can re-fetch when the user switches period.

interface ActivityHeatmapsViewProps {
  isLoading: boolean;
  dailyActivity: DailyEntry[];
  byCategory: ByCategoryEntry[];
  averageProductivityScore: number | null;
  onPeriodChange?: (p: HeatmapPeriod) => void;
}

export function ActivityHeatmapsView({
  isLoading,
  dailyActivity,
  byCategory,
  averageProductivityScore,
  onPeriodChange,
}: ActivityHeatmapsViewProps): JSX.Element {
  const [period, setPeriod] = useState<HeatmapPeriod>('30d');
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);
  const [tooltipRect, setTooltipRect] = useState<DOMRect | null>(null);

  function handlePeriodChange(p: HeatmapPeriod) {
    setPeriod(p);
    onPeriodChange?.(p);
  }

  const dailyMap = useMemo(() => {
    const map = new Map<string, DayData>();
    for (const d of dailyActivity) {
      map.set(d.date, {
        workCount: d.workCount,
        learnCount: d.learnCount,
        avgScore: d.avgScore ?? null,
        categoryCount: d.categoryCount ?? 0,
        dominantCategory: d.dominantCategory ?? null,
      });
    }
    return map;
  }, [dailyActivity]);

  const cells = useMemo(() => buildCells(period), [period]);

  const handleHover = useCallback((date: string | null, rect: DOMRect | null) => {
    setHoveredDate(date);
    setTooltipRect(rect);
  }, []);

  // ── Score panel stats ────────────────────────────────────────────────────────
  const scoreStats = useMemo(() => {
    const avg = averageProductivityScore;
    let bestDay: { date: string; score: number } | null = null;
    for (const d of dailyActivity) {
      if (d.avgScore != null && (!bestDay || d.avgScore > bestDay.score)) {
        bestDay = { date: d.date, score: d.avgScore };
      }
    }
    const avgColor =
      avg == null
        ? 'var(--gl-text-muted)'
        : avg >= 8
          ? '#2eb8a0'
          : avg >= 5
            ? '#c4a05e'
            : '#b87060';
    return (
      <div className="flex gap-5">
        <MiniStat
          label="Avg score"
          value={
            <span style={{ color: avgColor }}>{avg != null ? `${avg.toFixed(1)} / 10` : '—'}</span>
          }
        />
        <MiniStat
          label="Best day"
          value={bestDay ? `${bestDay.score.toFixed(1)} · ${fmtShort(bestDay.date)}` : '—'}
        />
      </div>
    );
  }, [dailyActivity, averageProductivityScore]);

  // ── Focus panel stats ────────────────────────────────────────────────────────
  const focusStats = useMemo(() => {
    const active = dailyActivity.filter((d) => d.categoryCount > 0);
    const avgCats =
      active.length > 0
        ? (active.reduce((s, d) => s + d.categoryCount, 0) / active.length).toFixed(1)
        : null;
    const focusedDays = active.filter((d) => d.categoryCount === 1).length;
    return (
      <div className="flex gap-5">
        <MiniStat label="Avg categories" value={avgCats ? `${avgCats} / day` : '—'} />
        <MiniStat
          label="Focused days"
          value={focusedDays > 0 ? `${focusedDays} day${focusedDays === 1 ? '' : 's'}` : '—'}
        />
      </div>
    );
  }, [dailyActivity]);

  // ── Category panel stats ─────────────────────────────────────────────────────
  const categoryStats = useMemo(() => {
    const counts = new Map<string, { name: string; color: string; days: number }>();
    for (const d of dailyActivity) {
      if (!d.dominantCategory) continue;
      const key = d.dominantCategory.name;
      const existing = counts.get(key) ?? { ...d.dominantCategory, days: 0 };
      existing.days++;
      counts.set(key, existing);
    }
    const [top1, top2] = [...counts.values()].sort((a, b) => b.days - a.days);
    const dot = (color: string) => (
      <span
        className="inline-block size-2 shrink-0 rounded-full"
        style={{ backgroundColor: hexRgba(color, 0.85) }}
      />
    );
    return (
      <div className="flex gap-5">
        <MiniStat
          label="Top category"
          value={
            top1 ? (
              <span className="flex items-center gap-1.5">
                {dot(top1.color)}
                {top1.name} · {top1.days}d
              </span>
            ) : (
              '—'
            )
          }
        />
        <MiniStat
          label="Runner-up"
          value={
            top2 ? (
              <span className="flex items-center gap-1.5">
                {dot(top2.color)}
                {top2.name} · {top2.days}d
              </span>
            ) : (
              '—'
            )
          }
        />
      </div>
    );
  }, [dailyActivity]);

  // ── Legends ──────────────────────────────────────────────────────────────────

  const scoreLegend = (
    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
      {[
        { label: '1–4', bg: 'rgba(184,112,96,0.72)' },
        { label: '5–7', bg: 'rgba(196,160,94,0.72)' },
        { label: '8–10', bg: 'rgba(46,184,160,0.82)' },
        { label: 'unscored', bg: 'rgba(255,255,255,0.11)' },
      ].map(({ label, bg }) => (
        <span key={label} className="flex items-center gap-1">
          <span className="size-2 shrink-0 rounded-[2px]" style={{ backgroundColor: bg }} />
          <span className="text-gl-text-faint text-[10px]">{label}</span>
        </span>
      ))}
    </div>
  );

  const focusLegend = (
    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
      {[
        { label: '1 cat', bg: 'rgba(46,184,160,0.88)' },
        { label: '2 cats', bg: 'rgba(46,184,160,0.50)' },
        { label: '3 cats', bg: 'rgba(196,160,94,0.55)' },
        { label: '4+ cats', bg: 'rgba(196,160,94,0.82)' },
      ].map(({ label, bg }) => (
        <span key={label} className="flex items-center gap-1">
          <span className="size-2 shrink-0 rounded-[2px]" style={{ backgroundColor: bg }} />
          <span className="text-gl-text-faint text-[10px]">{label}</span>
        </span>
      ))}
    </div>
  );

  const categoryLegend = (
    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
      {byCategory.slice(0, 5).map(({ category }) => (
        <span key={category.id} className="flex items-center gap-1">
          <span
            className="size-2 shrink-0 rounded-[2px]"
            style={{ backgroundColor: hexRgba(category.color, 0.72) }}
          />
          <span className="text-gl-text-faint max-w-[68px] truncate text-[10px]">
            {category.name}
          </span>
        </span>
      ))}
    </div>
  );

  // ── Shared tooltip ────────────────────────────────────────────────────────────

  const tooltipData = hoveredDate ? (dailyMap.get(hoveredDate) ?? null) : null;

  return (
    <div className="border-gl-border bg-gl-surface shadow-gl rounded-xl border p-[22px]">
      {/* Card header */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <div className="text-gl-text text-[17px] leading-snug font-bold tracking-[-0.015em]">
            Activity patterns
          </div>
          <div className="text-gl-text-muted mt-1 text-[13px]">
            Score · focus depth · category spotlight — hover to cross-highlight
          </div>
        </div>
        <div className="border-gl-border bg-gl-bg-subtle inline-flex shrink-0 items-center gap-1 rounded-[9px] border p-1">
          {(['30d', 'month'] as const).map((p) => (
            <button
              key={p}
              onClick={() => handlePeriodChange(p)}
              className={`rounded-[7px] px-3 py-[7px] text-[12.5px] font-medium whitespace-nowrap transition-colors duration-[120ms] ${
                period === p
                  ? 'bg-gl-primary text-gl-primary-ink font-semibold'
                  : 'text-gl-text-muted hover:text-gl-text'
              }`}
            >
              {p === '30d' ? 'Last 30 days' : 'This month'}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="bg-gl-border/30 h-[300px] animate-pulse rounded-xl" />
      ) : (
        <div className="grid grid-cols-1 gap-y-8 lg:grid-cols-3 lg:gap-x-0 lg:gap-y-0">
          <HeatmapPanel
            title="Productivity score"
            subtitle="Avg score per day"
            cells={cells}
            dailyMap={dailyMap}
            hoveredDate={hoveredDate}
            onHover={handleHover}
            getCellStyle={scoreStyle}
            getCellContent={scoreContent}
            legend={scoreLegend}
            stats={scoreStats}
          />
          <HeatmapPanel
            className="border-gl-border lg:border-l lg:pl-7"
            title="Daily focus"
            subtitle="Categories touched per day"
            cells={cells}
            dailyMap={dailyMap}
            hoveredDate={hoveredDate}
            onHover={handleHover}
            getCellStyle={focusStyle}
            getCellContent={focusContent}
            legend={focusLegend}
            stats={focusStats}
          />
          <HeatmapPanel
            className="border-gl-border lg:border-l lg:pl-7"
            title="Category spotlight"
            subtitle="Dominant category per day"
            cells={cells}
            dailyMap={dailyMap}
            hoveredDate={hoveredDate}
            onHover={handleHover}
            getCellStyle={categoryStyle}
            getCellContent={categoryContent}
            legend={categoryLegend}
            stats={categoryStats}
          />
        </div>
      )}

      {/* Cross-panel tooltip */}
      {hoveredDate && tooltipRect && (
        <div
          className="border-gl-border bg-gl-surface shadow-gl-lg pointer-events-none fixed z-50 min-w-[164px] rounded-xl border px-3.5 py-3 text-[12.5px]"
          style={{
            top: tooltipRect.top - 12,
            left: tooltipRect.left + tooltipRect.width / 2,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div className="text-gl-text mb-2 font-semibold">
            {new Date(`${hoveredDate}T12:00:00`).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            })}
          </div>
          {tooltipData ? (
            <div className="flex flex-col gap-1">
              <div className="text-gl-text-muted flex justify-between gap-4">
                <span>Score</span>
                <span className="text-gl-text font-semibold">
                  {tooltipData.avgScore != null
                    ? `${tooltipData.avgScore.toFixed(1)} / 10`
                    : 'unscored'}
                </span>
              </div>
              <div className="text-gl-text-muted flex justify-between gap-4">
                <span>Focus</span>
                <span className="text-gl-text font-semibold">
                  {tooltipData.categoryCount} cat{tooltipData.categoryCount !== 1 ? 's' : ''}
                  {tooltipData.dominantCategory ? ` · ${tooltipData.dominantCategory.name}` : ''}
                </span>
              </div>
              <div className="text-gl-text-muted flex justify-between gap-4">
                <span>Entries</span>
                <span className="text-gl-text font-semibold">
                  {tooltipData.workCount + tooltipData.learnCount}
                  <span className="text-gl-text-muted font-normal">
                    {' '}
                    ({tooltipData.workCount}W · {tooltipData.learnCount}L)
                  </span>
                </span>
              </div>
            </div>
          ) : (
            <div className="text-gl-text-faint">No entries</div>
          )}
        </div>
      )}
    </div>
  );
}

// ── ActivityHeatmaps — data-fetching wrapper used by the dashboard ─────────────

export function ActivityHeatmaps(): JSX.Element {
  const [period, setPeriod] = useState<HeatmapPeriod>('30d');
  const { data: summary, isLoading } = useEntriesSummary(period);

  return (
    <ActivityHeatmapsView
      isLoading={isLoading}
      dailyActivity={summary?.dailyActivity ?? []}
      byCategory={summary?.byCategory ?? []}
      averageProductivityScore={summary?.averageProductivityScore ?? null}
      onPeriodChange={setPeriod}
    />
  );
}
