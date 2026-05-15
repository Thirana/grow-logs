'use client';

import { useState } from 'react';
import type { DailyActivity } from '@/data/dashboard-mock';

interface TooltipState {
  colIndex: number;
  dateLabel: string;
  workCount: number;
  learnCount: number;
}

interface DailyChartProps {
  data: DailyActivity[];
}

const CHART_H = 220;

export function DailyChart({ data }: DailyChartProps){
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const max = Math.max(...data.map((d) => Math.max(d.workCount, d.learnCount)), 1);

  return (
    <div className="relative">
      {/* Chart area: extra bottom space for x-axis labels */}
      <div className="relative pl-8" style={{ height: CHART_H + 28 }}>

        {/* Y-axis gridlines */}
        {[1, 0.75, 0.5, 0.25].map((frac) => (
          <div
            key={frac}
            className="absolute left-8 right-0 border-t border-dashed border-gl-border"
            style={{ top: (1 - frac) * CHART_H + 4 }}
          >
            <span className="absolute -left-7 -top-[9px] font-mono text-[10px] text-gl-text-faint">
              {Math.round(frac * max)}
            </span>
          </div>
        ))}

        {/* Zero line */}
        <div
          className="absolute left-8 right-0 border-t border-gl-border"
          style={{ top: CHART_H + 4 }}
        >
          <span className="absolute -left-7 -top-[9px] font-mono text-[10px] text-gl-text-faint">0</span>
        </div>

        {/* Bars */}
        <div
          className="absolute left-8 right-0 top-1 flex items-end gap-[3px]"
          style={{ height: CHART_H }}
        >
          {data.map((d, i) => {
            const wh = (d.workCount / max) * 100;
            const lh = (d.learnCount / max) * 100;
            return (
              <div
                key={d.dayIndex}
                className="flex flex-1 h-full cursor-default items-end gap-[2px]"
                onMouseEnter={() =>
                  setTooltip({
                    colIndex: i,
                    dateLabel: d.dateLabel || `Day ${d.dayIndex + 1}`,
                    workCount: d.workCount,
                    learnCount: d.learnCount,
                  })
                }
                onMouseLeave={() => setTooltip(null)}
              >
                <div
                  className="flex-1 rounded-t-[2px] bg-gl-work"
                  style={{ height: `${wh}%`, opacity: 0.85 }}
                />
                <div
                  className="flex-1 rounded-t-[2px] bg-gl-learn"
                  style={{ height: `${lh}%`, opacity: 0.95 }}
                />
              </div>
            );
          })}
        </div>

        {/* X-axis labels */}
        <div
          className="absolute left-8 right-0 flex"
          style={{ top: CHART_H + 12 }}
        >
          {data.map((d, i) => (
            <div key={i} className="flex-1 text-center">
              {d.dateLabel && (
                <span className="font-mono text-[10px] text-gl-text-faint whitespace-nowrap">
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
          className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 -translate-y-full rounded-lg border border-gl-border bg-gl-surface px-3 py-2 shadow-gl-lg"
          style={{ left: `${((tooltip.colIndex + 0.5) / data.length) * 100}%` }}
          role="tooltip"
        >
          <div className="mb-1 font-mono text-[11px] text-gl-text-muted">{tooltip.dateLabel}</div>
          <div className="flex gap-2.5 text-[12px] text-gl-text">
            <span className="flex items-center gap-1.5">
              <span className="size-[7px] rounded-full bg-gl-work" aria-hidden="true" />
              {tooltip.workCount} Work
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-[7px] rounded-full bg-gl-learn" aria-hidden="true" />
              {tooltip.learnCount} Learning
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
