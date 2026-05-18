import type { CategorySummaryItem } from '@grow-logs/types';

interface CategoryChartProps {
  categories: CategorySummaryItem[];
}

export function CategoryChart({ categories }: CategoryChartProps) {
  const max = Math.max(...categories.map((c) => c.entryCount), 1);

  return (
    <div className="flex flex-col gap-4">
      {categories.map((c) => (
        <div
          key={c.category.id}
          className="grid items-center gap-4"
          style={{ gridTemplateColumns: '160px 1fr 52px' }}
        >
          <div>
            <div className="text-gl-text flex items-center gap-2 text-[13px] leading-snug font-semibold">
              <span
                className="size-[9px] shrink-0 rounded-full"
                style={{ background: c.category.color }}
                aria-hidden="true"
              />
              {c.category.name}
            </div>
            <div className="text-gl-text-faint mt-1 font-mono text-[11px]">
              avg {c.averageProductivityScore != null ? c.averageProductivityScore.toFixed(1) : '—'}
              /10
            </div>
          </div>

          <div className="bg-gl-bg-subtle relative h-[26px] overflow-hidden rounded-lg">
            <div
              className="h-full"
              style={{
                width: `${(c.entryCount / max) * 100}%`,
                background: 'rgba(245, 241, 230, 0.14)',
                borderRight: `2px solid ${c.category.color}`,
              }}
            />
          </div>

          <div className="text-gl-text text-right font-mono text-[13px] font-semibold tabular-nums">
            {c.entryCount}
          </div>
        </div>
      ))}
    </div>
  );
}
