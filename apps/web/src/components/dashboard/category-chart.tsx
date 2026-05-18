import type { CategorySummaryItem } from '@grow-logs/types';

interface CategoryChartProps {
  categories: CategorySummaryItem[];
}

export function CategoryChart({ categories }: CategoryChartProps) {
  if (categories.length === 0) {
    return (
      <div className="text-gl-text-faint flex items-center justify-center py-8 text-[13px]">
        No category data for this period.
      </div>
    );
  }

  const sorted = [...categories].sort((a, b) => b.entryCount - a.entryCount);
  const max = sorted[0].entryCount;

  return (
    <div className="flex flex-col gap-5">
      {sorted.map((c, i) => {
        const widthPct = (c.entryCount / max) * 100;
        const workPct = c.entryCount > 0 ? (c.byType.WORK / c.entryCount) * 100 : 0;
        const learnPct = 100 - workPct;

        return (
          <div key={c.category.id} className="flex items-start gap-3">
            {/* Rank */}
            <span className="text-gl-text-faint mt-[1px] w-4 shrink-0 text-right font-mono text-[11px]">
              {i + 1}
            </span>

            {/* Body */}
            <div className="min-w-0 flex-1">
              {/* Name + count */}
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className="size-2 shrink-0 rounded-full"
                    style={{ background: c.category.color }}
                    aria-hidden="true"
                  />
                  <span className="text-gl-text truncate text-[13.5px] font-semibold">
                    {c.category.name}
                  </span>
                </div>
                <span className="text-gl-text shrink-0 font-mono text-[13px] font-semibold tabular-nums">
                  {c.entryCount}
                </span>
              </div>

              {/* Bar — same work/learn tokens as the daily chart columns */}
              <div className="bg-gl-bg-subtle h-2.5 w-full rounded-full">
                <div
                  className="flex h-full overflow-hidden rounded-full"
                  style={{ width: `${widthPct}%` }}
                >
                  {workPct > 0 && (
                    <div
                      className="bg-gl-work h-full"
                      style={{ width: `${workPct}%`, opacity: 0.85 }}
                    />
                  )}
                  {learnPct > 0 && (
                    <div
                      className="bg-gl-learn h-full"
                      style={{ width: `${learnPct}%`, opacity: 0.95 }}
                    />
                  )}
                </div>
              </div>

              {/* Meta row */}
              <div className="text-gl-text-faint mt-1.5 flex items-center justify-between font-mono text-[11px]">
                <span>
                  {c.byType.WORK > 0 && `${c.byType.WORK} work`}
                  {c.byType.WORK > 0 && c.byType.LEARNING > 0 && ' · '}
                  {c.byType.LEARNING > 0 && `${c.byType.LEARNING} learning`}
                </span>
                {c.averageProductivityScore != null && (
                  <span>avg {c.averageProductivityScore.toFixed(1)}</span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
