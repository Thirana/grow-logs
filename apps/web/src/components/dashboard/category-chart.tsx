import type { MockCategory } from '@/data/dashboard-mock';

interface CategoryChartProps {
  categories: MockCategory[];
}

export function CategoryChart({ categories }: CategoryChartProps){
  const max = Math.max(...categories.map((c) => c.entryCount), 1);

  return (
    <div className="flex flex-col gap-4">
      {categories.map((c) => (
        <div
          key={c.id}
          className="grid items-center gap-4"
          style={{ gridTemplateColumns: '160px 1fr 52px' }}
        >
          {/* Label */}
          <div>
            <div className="flex items-center gap-2 text-[13px] font-semibold leading-snug text-gl-text">
              <span
                className="size-[9px] shrink-0 rounded-full"
                style={{ background: c.swatchColor }}
                aria-hidden="true"
              />
              {c.name}
            </div>
            <div className="mt-1 font-mono text-[11px] text-gl-text-faint">
              avg {c.avgScore.toFixed(1)}/10
            </div>
          </div>

          {/* Bar */}
          <div className="relative h-[26px] overflow-hidden rounded-lg bg-gl-bg-subtle">
            <div
              className="h-full"
              style={{
                width: `${(c.entryCount / max) * 100}%`,
                background: 'rgba(245, 241, 230, 0.14)',
                borderRight: `2px solid ${c.swatchColor}`,
              }}
            />
          </div>

          {/* Count */}
          <div className="text-right font-mono text-[13px] font-semibold tabular-nums text-gl-text">
            {c.entryCount}
          </div>
        </div>
      ))}
    </div>
  );
}
