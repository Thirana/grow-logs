import { Eyebrow } from '@/components/common/eyebrow';
import { IconCalendar, IconBook, IconBriefcase } from '@/components/common/icons';

const PROBLEMS = [
  {
    icon: IconCalendar,
    title: 'You forget what you did last week.',
    body: 'Performance review time comes around and you are staring at a blank page trying to remember what you actually worked on for six months.',
  },
  {
    icon: IconBook,
    title: 'Your learning has no visible shape.',
    body: 'You study every day but have no record of how far you have come or which areas you have actually covered.',
  },
  {
    icon: IconBriefcase,
    title: 'Interviews catch you off guard.',
    body: 'You know you have grown significantly, but when asked to articulate it, the specific examples are gone.',
  },
] as const;

export function ProblemSection() {
  return (
    <section id="problem" className="py-20 sm:py-28 lg:pt-[120px] lg:pb-10">
      {/* Header */}
      <div className="mx-auto mb-14 max-w-[640px] text-center">
        <Eyebrow className="mb-3.5">The problem</Eyebrow>
        <h2 className="mb-3.5 text-[36px] font-bold leading-[1.08] tracking-[-0.025em] text-gl-text text-balance sm:text-[44px] sm:tracking-[-0.028em]">
          Sound familiar?
        </h2>
        <p className="text-[17px] leading-[1.55] text-gl-text-muted">
          A few frustrations every learner and engineer eventually runs into.
        </p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {PROBLEMS.map(({ icon: Icon, title, body }) => (
          <div
            key={title}
            className="flex flex-col rounded-2xl border border-gl-border bg-gl-bg-subtle p-7 transition-transform duration-200 hover:-translate-y-0.5"
          >
            <div className="mb-[22px] inline-flex size-11 items-center justify-center rounded-xl border border-gl-border bg-gl-surface-2 text-gl-text-muted">
              <Icon size={22} />
            </div>
            <h3 className="mb-2.5 text-[20px] font-bold leading-[1.3] tracking-[-0.015em] text-gl-text text-balance">
              {title}
            </h3>
            <p className="text-[15px] leading-[1.6] text-gl-text-muted">{body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
