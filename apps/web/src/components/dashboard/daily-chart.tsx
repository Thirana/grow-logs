'use client';

import { useState } from 'react';

interface DailyChartPoint {
  dateLabel: string;
  workCount: number;
  learnCount: number;
}

interface TooltipState {
  colIndex: number;
  dateLabel: string;
  workCount: number;
  learnCount: number;
}

interface DailyChartProps {
  data: DailyChartPoint[];
}

const CHART_H = 220;

export function DailyChart({ data }: DailyChartProps) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const max = Math.max(...data.map((d) => Math.max(d.workCount, d.learnCount)), 1);

  return (
    <div className="relative">
      <div className="relative pl-8" style={{ height: CHART_H + 28 }}>
        {[1, 0.75, 0.5, 0.25].map((frac) => (
          <div
            key={frac}
            className="border-gl-border absolute right-0 left-8 border-t border-dashed"
            style={{ top: (1 - frac) * CHART_H + 4 }}
          >
            <span className="text-gl-text-faint absolute -top-[9px] -left-7 font-mono text-[10px]">
              {Math.round(frac * max)}
            </span>
          </div>
        ))}

        <div
          className="border-gl-border absolute right-0 left-8 border-t"
          style={{ top: CHART_H + 4 }}
        >
          <span className="text-gl-text-faint absolute -top-[9px] -left-7 font-mono text-[10px]">
            0
          </span>
        </div>

        <div
          className="absolute top-1 right-0 left-8 flex items-end gap-[3px]"
          style={{ height: CHART_H }}
        >
          {data.map((d, i) => {
            const wh = (d.workCount / max) * 100;
            const lh = (d.learnCount / max) * 100;
            return (
              <div
                key={i}
                className="flex h-full flex-1 cursor-default items-end gap-[2px]"
                onMouseEnter={() =>
                  setTooltip({
                    colIndex: i,
                    dateLabel: d.dateLabel || `Day ${i + 1}`,
                    workCount: d.workCount,
                    learnCount: d.learnCount,
                  })
                }
                onMouseLeave={() => setTooltip(null)}
              >
                <div
                  className="bg-gl-work flex-1 rounded-t-[2px]"
                  style={{ height: `${wh}%`, opacity: 0.85 }}
                />
                <div
                  className="bg-gl-learn flex-1 rounded-t-[2px]"
                  style={{ height: `${lh}%`, opacity: 0.95 }}
                />
              </div>
            );
          })}
        </div>

        <div className="absolute right-0 left-8 flex" style={{ top: CHART_H + 12 }}>
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

      {tooltip && (
        <div
          className="border-gl-border bg-gl-surface shadow-gl-lg pointer-events-none absolute top-0 z-10 -translate-x-1/2 -translate-y-full rounded-lg border px-3 py-2"
          style={{ left: `${((tooltip.colIndex + 0.5) / data.length) * 100}%` }}
          role="tooltip"
        >
          <div className="text-gl-text-muted mb-1 font-mono text-[11px]">{tooltip.dateLabel}</div>
          <div className="text-gl-text flex gap-2.5 text-[12px]">
            <span className="flex items-center gap-1.5">
              <span className="bg-gl-work size-[7px] rounded-full" aria-hidden="true" />
              {tooltip.workCount} Work
            </span>
            <span className="flex items-center gap-1.5">
              <span className="bg-gl-learn size-[7px] rounded-full" aria-hidden="true" />
              {tooltip.learnCount} Learning
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
