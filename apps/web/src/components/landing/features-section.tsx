import { Eyebrow } from '@/components/common/eyebrow';
import { IconPen, IconFolder, IconChart } from '@/components/common/icons';

// ── Inline feature preview components ──────────────────────────────────────

function PreviewLog() {
  return (
    <div className="rounded-[10px] border border-gl-border bg-gl-bg-subtle p-3.5">
      <div className="mb-2.5 flex items-center gap-2 flex-wrap">
        <span className="rounded-full bg-gl-work-bg px-2 py-1 text-[10.5px] font-medium text-gl-work">
          Work
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-gl-border bg-gl-surface px-2 py-1 text-[10.5px] font-medium text-gl-text">
          <span
            className="size-[6px] shrink-0 rounded-full"
            style={{ background: '#6FC8A0' }}
            aria-hidden="true"
          />
          Engineering
        </span>
      </div>
      <p className="text-[13px] font-medium leading-[1.5] text-gl-text">
        Untangled the refresh-token rotation from the login&nbsp;handler.
        <span
          className="ml-0.5 inline-block h-[13px] w-px translate-y-[2px] bg-gl-primary animate-cursor-blink"
          aria-hidden="true"
        />
      </p>
    </div>
  );
}

const CATEGORIES = [
  { label: 'Engineering', color: '#6FC8A0', count: 38 },
  { label: 'Reading', color: '#7C8FE0', count: 24 },
  { label: 'Side project', color: '#BFA8E5', count: 17 },
  { label: 'Writing', color: '#E8866F', count: 9 },
] as const;

function PreviewCategories() {
  return (
    <div className="flex flex-col gap-2 rounded-[10px] border border-gl-border bg-gl-bg-subtle p-3.5">
      {CATEGORIES.map(({ label, color, count }) => (
        <div key={label} className="flex items-center gap-2.5">
          <span
            className="size-[9px] shrink-0 rounded-full"
            style={{ background: color }}
            aria-hidden="true"
          />
          <span className="flex-1 text-[12.5px] font-medium text-gl-text">{label}</span>
          <span className="font-mono text-[11px] font-medium text-gl-text-faint tabular-nums">
            {count}
          </span>
        </div>
      ))}
    </div>
  );
}

const CHART_WEEKS = [22, 38, 30, 52, 44, 64, 58, 78] as const;

function PreviewChart() {
  const max = 80;
  const w = 240;
  const h = 64;
  const pts = CHART_WEEKS.map((v, i) => [
    (i / (CHART_WEEKS.length - 1)) * w,
    h - (v / max) * h,
  ]);
  const linePath = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L${w},${h} L0,${h} Z`;

  return (
    <div className="rounded-[10px] border border-gl-border bg-gl-bg-subtle p-3.5">
      <div className="mb-2.5 flex justify-between">
        <span className="text-[11px] font-medium text-gl-text-muted">Last 8 weeks</span>
        <span className="font-mono text-[11px] font-semibold text-gl-primary">↗ +28%</span>
      </div>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="block h-16 w-full"
        aria-hidden="true"
        preserveAspectRatio="none"
      >
        <path d={areaPath} fill="var(--gl-primary)" opacity="0.14" />
        <path
          d={linePath}
          fill="none"
          stroke="var(--gl-primary)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {pts.map(([x, y], i) => (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={i === pts.length - 1 ? 3.5 : 0}
            fill="var(--gl-primary)"
          />
        ))}
      </svg>
    </div>
  );
}

// ── Feature cards data ──────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: IconPen,
    eyebrow: 'Log',
    title: 'Log work and learning separately.',
    body: 'Tag every entry as Work or Learning. Add a productivity score to reflect how focused and effective you felt. Build an honest record, not just a list.',
    preview: <PreviewLog />,
  },
  {
    icon: IconFolder,
    eyebrow: 'Organise',
    title: 'Organised by your own categories.',
    body: 'Define up to 5 main categories and their sub-categories during onboarding — Backend, System Design, Soft Skills, whatever fits your journey.',
    preview: <PreviewCategories />,
  },
  {
    icon: IconChart,
    eyebrow: 'Review',
    title: 'See your progress over time.',
    body: 'Your dashboard shows activity breakdowns by category, productivity trends, and a full log history. Know exactly what to say in your next interview.',
    preview: <PreviewChart />,
  },
] as const;

// ── Section ─────────────────────────────────────────────────────────────────

export function FeaturesSection() {
  return (
    <section id="features" className="py-16 sm:py-20 lg:py-24">
      {/* Header */}
      <div className="mx-auto mb-16 max-w-[680px] text-center">
        <Eyebrow className="mb-3.5">Features</Eyebrow>
        <h2 className="mb-3.5 text-[36px] font-bold leading-[1.08] tracking-[-0.025em] text-gl-text text-balance sm:text-[44px] sm:tracking-[-0.028em]">
          Everything you need to track your growth.
        </h2>
        <p className="text-[17px] leading-[1.55] text-gl-text-muted text-pretty">
          One place for your work logs and your learning — structured, searchable, and always
          there when you need it.
        </p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map(({ icon: Icon, eyebrow, title, body, preview }) => (
          <div
            key={title}
            className="flex flex-col rounded-2xl border border-gl-border bg-gl-surface p-7 shadow-gl transition-transform duration-200 hover:-translate-y-0.5"
          >
            <div className="mb-[22px] inline-flex size-11 items-center justify-center rounded-xl bg-gl-primary-soft text-gl-primary">
              <Icon size={22} />
            </div>
            <Eyebrow className="mb-2">{eyebrow}</Eyebrow>
            <h3 className="mb-2.5 text-[22px] font-bold leading-[1.25] tracking-[-0.018em] text-gl-text text-balance">
              {title}
            </h3>
            <p className="mb-6 text-[15px] leading-[1.55] text-gl-text-muted">{body}</p>
            <div className="mt-auto">{preview}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
