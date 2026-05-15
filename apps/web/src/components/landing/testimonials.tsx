
const SWATCHES = ['#6FC8A0', '#7C8FE0', '#BFA8E5'] as const;

const QUOTES = [
  {
    q: 'I used to dread performance review season. Now I just open Grow Logs and the evidence is already there.',
    name: 'Software engineer',
    role: '3 years experience',
    swatch: SWATCHES[0],
  },
  {
    q: 'I study every day but always felt like I had nothing to show for it. Seeing the categories fill up changed that completely.',
    name: 'Self-taught developer',
    role: 'Career switching',
    swatch: SWATCHES[1],
  },
  {
    q: 'The productivity score is the detail that makes it different. I can see not just what I did but how well I was actually focused.',
    name: 'Senior developer',
    role: 'Upskilling in system design',
    swatch: SWATCHES[2],
  },
] as const;

function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
}

export function Testimonials() {
  return (
    <section id="testimonials" className="py-12 sm:py-16 lg:py-20">
      {/* Header */}
      <div className="mx-auto mb-10 max-w-[640px] text-center">
        <h2 className="mb-3 text-[34px] font-bold leading-[1.1] tracking-[-0.022em] text-gl-text text-balance sm:text-[40px] sm:tracking-[-0.025em]">
          Built for people who never stop learning.
        </h2>
      </div>

      {/* Quote cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {QUOTES.map(({ q, name, role, swatch }) => (
          <figure
            key={name}
            className="m-0 flex flex-col justify-between gap-6 rounded-2xl border border-gl-border bg-gl-surface p-7 shadow-gl transition-transform duration-200 hover:-translate-y-0.5"
          >
            <blockquote className="m-0 text-[17px] font-medium leading-[1.5] tracking-[-0.012em] text-gl-text text-pretty">
              <span className="mr-0.5 font-bold text-gl-primary">&ldquo;</span>
              {q}
              <span className="ml-0.5 font-bold text-gl-primary">&rdquo;</span>
            </blockquote>

            <figcaption className="flex items-center gap-3">
              <span
                className="inline-flex size-[38px] shrink-0 items-center justify-center rounded-full text-[14px] font-bold tracking-[-0.01em]"
                style={{ background: swatch, color: '#0C1A14' }}
                aria-hidden="true"
              >
                {initials(name)}
              </span>
              <div>
                <div className="text-[14px] font-semibold leading-[1.3] text-gl-text">
                  {name}
                </div>
                <div className="mt-0.5 text-[12.5px] leading-[1.3] text-gl-text-muted">
                  {role}
                </div>
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
