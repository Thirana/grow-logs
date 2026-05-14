// Delay class list — must be static strings so Tailwind can detect them at build time
const DELAY_CLASSES = [
  '',
  'animation-delay-100',
  'animation-delay-200',
  'animation-delay-300',
  'animation-delay-400',
] as const;

const CATEGORIES = [
  { name: 'Backend',       count: 38,  swatchColor: '#6FC8A0' },
  { name: 'System Design', count: 24,  swatchColor: '#7C8FE0' },
  { name: 'Reading',       count: 22,  swatchColor: '#BFA8E5' },
  { name: 'Side Project',  count: 19,  swatchColor: '#E0AE52' },
  { name: 'Soft Skills',   count: 15,  swatchColor: '#E8866F' },
] as const;

interface HeroCategoriesWidgetProps {
  className?: string;
}

export function HeroCategoriesWidget({ className = '' }: HeroCategoriesWidgetProps) {
  return (
    <div
      className={`rounded-xl border border-gl-border bg-gl-surface p-5 shadow-gl transition-all duration-[150ms] hover:-translate-y-0.5 hover:shadow-gl-lg ${className}`}
    >
      <p className="mb-3.5 text-[10px] font-bold uppercase tracking-[0.12em] text-gl-text-faint">
        Top categories
      </p>

      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat, i) => (
          <span
            key={cat.name}
            className={`inline-flex cursor-default items-center gap-1.5 rounded-full border border-gl-border bg-gl-surface-2 px-3 py-1.5 text-[12.5px] font-medium text-gl-text transition-transform duration-[120ms] hover:-translate-y-0.5 animate-fade-up ${DELAY_CLASSES[i]}`}
          >
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ background: cat.swatchColor }}
              aria-hidden="true"
            />
            {cat.name}
            <span className="ml-0.5 font-mono text-[10.5px] tabular-nums text-gl-text-faint">
              {cat.count}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
