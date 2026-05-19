'use client';

// Stacked daily activity bar chart — one bar per day, work at bottom, learning on top.
// Used by: components/dashboard/activity-card.tsx
import { useState } from 'react';

export interface DailyChartPoint {
  dateLabel: string;
  tooltipLabel: string;
  workCount: number;
  learnCount: number;
  isToday: boolean;
}

interface TooltipState {
  colIndex: number;
  tooltipLabel: string;
  workCount: number;
  learnCount: number;
}

interface DailyChartProps {
  data: DailyChartPoint[];
}

const CHART_H = 220;

// Returns up to 4 distinct integer tick values between 1 and max.
// Uses Math.ceil so small max values (1–4) always produce unique labels.
function computeTicks(max: number): number[] {
  const candidates = [Math.ceil(max / 4), Math.ceil(max / 2), Math.ceil((3 * max) / 4), max];
  return [...new Set(candidates)];
}

export function DailyChart({ data }: DailyChartProps) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  // Y-axis max is the busiest total (work + learning) day.
  const max = Math.max(...data.map((d) => d.workCount + d.learnCount), 1);
  const ticks = computeTicks(max);

  return (
    <div className="relative">
      {/* Extra top padding gives the today dot room to breathe above the chart area */}
      <div className="relative pl-8" style={{ height: CHART_H + 36 }}>
        {/* Y-axis gridlines — one per distinct integer tick */}
        {ticks.map((tick) => (
          <div
            key={tick}
            className="border-gl-border absolute right-0 left-8 border-t border-dashed"
            style={{ top: (1 - tick / max) * CHART_H + 12 }}
          >
            <span className="text-gl-text-faint absolute -top-[9px] -left-7 font-mono text-[10px]">
              {tick}
            </span>
          </div>
        ))}

        <div
          className="border-gl-border absolute right-0 left-8 border-t"
          style={{ top: CHART_H + 12 }}
        >
          <span className="text-gl-text-faint absolute -top-[9px] -left-7 font-mono text-[10px]">
            0
          </span>
        </div>

        {/* Bar columns — shifted down 8px to leave space for today dot */}
        <div
          className="absolute right-0 left-8 flex items-end gap-[3px]"
          style={{ top: 8, height: CHART_H }}
        >
          {data.map((d, i) => {
            const total = d.workCount + d.learnCount;
            const totalH = (total / max) * 100;
            const workFrac = total > 0 ? d.workCount / total : 0;
            const learnFrac = total > 0 ? d.learnCount / total : 0;

            return (
              <div
                key={i}
                className="relative flex h-full flex-1 cursor-default flex-col items-stretch justify-end"
                onMouseEnter={() =>
                  setTooltip({
                    colIndex: i,
                    tooltipLabel: d.tooltipLabel,
                    workCount: d.workCount,
                    learnCount: d.learnCount,
                  })
                }
                onMouseLeave={() => setTooltip(null)}
              >
                {/* Today dot — sits above the chart area */}
                {d.isToday && (
                  <span
                    className="bg-gl-primary absolute left-1/2 size-[5px] -translate-x-1/2 rounded-full"
                    style={{ top: -8 }}
                    aria-hidden="true"
                  />
                )}

                {/* Stacked bar */}
                {total > 0 && (
                  <div
                    className="w-full overflow-hidden rounded-t-full"
                    style={{ height: `${totalH}%` }}
                  >
                    {/* Learning segment — top */}
                    {learnFrac > 0 && (
                      <div
                        className="bg-gl-learn w-full"
                        style={{ height: `${learnFrac * 100}%`, opacity: 0.95 }}
                      />
                    )}
                    {/* Work segment — bottom */}
                    {workFrac > 0 && (
                      <div
                        className="bg-gl-work w-full"
                        style={{ height: `${workFrac * 100}%`, opacity: 0.85 }}
                      />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* X-axis labels */}
        <div className="absolute right-0 left-8 flex" style={{ top: CHART_H + 20 }}>
          {data.map((d, i) => (
            <div key={i} className="flex-1 text-center">
              {d.dateLabel && (
                <span className="text-gl-text-faint font-mono text-[10px] whitespace-nowrap">
                  {d.dateLabel}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="border-gl-border bg-gl-surface shadow-gl-lg pointer-events-none absolute top-0 z-10 -translate-x-1/2 -translate-y-full rounded-lg border px-3 py-2.5"
          style={{ left: `${((tooltip.colIndex + 0.5) / data.length) * 100}%` }}
          role="tooltip"
        >
          <p className="text-gl-text mb-1 text-[12px] font-semibold">{tooltip.tooltipLabel}</p>
          <p className="text-gl-text-muted mb-2 text-[12px]">
            {tooltip.workCount + tooltip.learnCount} entries total
          </p>
          <div className="flex flex-col gap-1">
            <span className="text-gl-text flex items-center gap-1.5 text-[11px]">
              <span className="bg-gl-work size-[7px] shrink-0 rounded-[1px]" aria-hidden="true" />
              Work · {tooltip.workCount}
            </span>
            <span className="text-gl-text flex items-center gap-1.5 text-[11px]">
              <span className="bg-gl-learn size-[7px] shrink-0 rounded-[1px]" aria-hidden="true" />
              Learning · {tooltip.learnCount}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
