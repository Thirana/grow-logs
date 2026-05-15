const SWATCHES = ['#69B598', '#8285BA', '#B87DA2'] as const;

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
        <h2 className="text-gl-text mb-3 text-[34px] leading-[1.1] font-bold tracking-[-0.022em] text-balance sm:text-[40px] sm:tracking-[-0.025em]">
          Built for people who never stop learning.
        </h2>
      </div>

      {/* Quote cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {QUOTES.map(({ q, name, role, swatch }) => (
          <figure
            key={name}
            className="border-gl-border bg-gl-surface shadow-gl m-0 flex flex-col justify-between gap-6 rounded-2xl border p-7 transition-transform duration-200 hover:-translate-y-0.5"
          >
            <blockquote className="text-gl-text m-0 text-[17px] leading-[1.5] font-medium tracking-[-0.012em] text-pretty">
              <span className="text-gl-primary mr-0.5 font-bold">&ldquo;</span>
              {q}
              <span className="text-gl-primary ml-0.5 font-bold">&rdquo;</span>
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
                <div className="text-gl-text text-[14px] leading-[1.3] font-semibold">{name}</div>
                <div className="text-gl-text-muted mt-0.5 text-[12.5px] leading-[1.3]">{role}</div>
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
