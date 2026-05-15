
const STEPS = [
  {
    n: '01',
    title: 'Set up your categories.',
    body: 'Define the areas you are tracking — your stack, your learning topics, your goals. Takes two minutes.',
  },
  {
    n: '02',
    title: 'Log something every day.',
    body: 'Takes less than a minute. A sentence, a bullet list, or a full reflection — whatever feels right.',
  },
  {
    n: '03',
    title: 'Watch your progress appear.',
    body: 'Your dashboard fills up. Your categories grow. Your growth becomes visible and articulable.',
  },
] as const;

export function HowItWorks() {
  return (
    <section id="how" className="py-12 sm:py-16 lg:pt-16 lg:pb-12">
      {/* Header */}
      <div className="mx-auto mb-10 max-w-[640px] text-center">
        <h2 className="text-[36px] font-bold leading-[1.08] tracking-[-0.025em] text-gl-text text-balance sm:text-[44px] sm:tracking-[-0.028em]">
          Up and running in minutes.
        </h2>
      </div>

      {/* Steps */}
      <div className="relative grid grid-cols-1 gap-8 sm:grid-cols-3 sm:gap-8">
        {/* Connector line — visible only on desktop */}
        <div
          className="pointer-events-none absolute top-9 left-[16.66%] right-[16.66%] hidden h-px sm:block"
          style={{
            background: `linear-gradient(to right, transparent, var(--gl-border) 12%, var(--gl-border) 88%, transparent)`,
          }}
          aria-hidden="true"
        />

        {STEPS.map(({ n, title, body }) => (
          <div
            key={n}
            className="relative z-10 flex flex-col items-start gap-3.5"
          >
            {/* Step number */}
            <div className="inline-flex size-[72px] items-center justify-center rounded-full border border-gl-border bg-gl-bg-subtle font-mono text-2xl font-bold tabular-nums text-gl-primary">
              {n}
            </div>

            <h3 className="mt-2 text-[22px] font-bold leading-[1.25] tracking-[-0.018em] text-gl-text text-balance">
              {title}
            </h3>
            <p className="text-[15px] leading-[1.6] text-gl-text-muted">{body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
