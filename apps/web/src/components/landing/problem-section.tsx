'use client';

import { useRef, useState, useEffect } from 'react';
import { IconCalendar, IconBook, IconBriefcase } from '@/components/common/icons';
import { FadeIn } from '@/components/common/fade-in';

const PROBLEMS = [
  {
    icon: IconCalendar,
    iconBg: 'bg-gl-warning-soft',
    iconColor: 'text-gl-warning',
    title: 'You forget what you did last week.',
    body: 'Performance review time comes around and you are staring at a blank page trying to remember what you actually worked on for six months.',
  },
  {
    icon: IconBook,
    iconBg: 'bg-gl-learn-bg',
    iconColor: 'text-gl-learn',
    title: 'Your learning has no visible shape.',
    body: 'You study every day but have no record of how far you have come or which areas you have actually covered.',
  },
  {
    icon: IconBriefcase,
    iconBg: 'bg-gl-danger-soft',
    iconColor: 'text-gl-danger',
    title: 'Interviews catch you off guard.',
    body: 'You know you have grown significantly, but when asked to articulate it, the specific examples are gone.',
  },
] as const;

export function ProblemSection(): JSX.Element {
  const scrollRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [activeCard, setActiveCard] = useState(0);

  // Track which card is most visible inside the scroll container
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const idx = cardRefs.current.indexOf(entry.target as HTMLDivElement);
            if (idx !== -1) setActiveCard(idx);
          }
        });
      },
      { root: container, threshold: 0.6 },
    );

    cardRefs.current.forEach(card => { if (card) observer.observe(card); });
    return () => observer.disconnect();
  }, []);

  return (
    <section id="problem" className="py-12 sm:py-16 lg:pt-16 lg:pb-8">
      {/* Header */}
      <FadeIn>
        <div className="mx-auto mb-10 max-w-[640px] text-center">
          <h2 className="mb-3.5 text-[36px] font-bold leading-[1.08] tracking-[-0.025em] text-gl-text text-balance sm:text-[44px] sm:tracking-[-0.028em]">
            Sound familiar?
          </h2>
          <p className="text-[17px] leading-[1.55] text-gl-text-muted">
            A few frustrations every learner and engineer eventually runs into.
          </p>
        </div>
      </FadeIn>

      {/* Cards */}
      <FadeIn delay={130}>
      <div className="relative">
        <div
          ref={scrollRef}
          className="no-scrollbar flex gap-4 overflow-x-auto snap-x snap-mandatory sm:grid sm:grid-cols-2 sm:snap-none sm:overflow-visible sm:gap-5 lg:grid-cols-3"
        >
          {PROBLEMS.map(({ icon: Icon, iconBg, iconColor, title, body }, i) => (
            <div
              key={title}
              ref={el => { cardRefs.current[i] = el; }}
              className="flex w-[82%] min-w-[82%] flex-shrink-0 snap-start flex-col rounded-2xl border border-gl-border bg-gl-surface p-7 shadow-gl transition-all duration-[150ms] hover:-translate-y-0.5 hover:shadow-gl-lg sm:w-auto sm:min-w-0"
            >
              <div className={`mb-[22px] inline-flex size-11 items-center justify-center rounded-xl ${iconBg} ${iconColor}`}>
                <Icon size={22} />
              </div>
              <h3 className="mb-2.5 text-[20px] font-bold leading-[1.3] tracking-[-0.015em] text-gl-text text-balance">
                {title}
              </h3>
              <p className="text-[15px] leading-[1.6] text-gl-text-muted">{body}</p>
            </div>
          ))}
        </div>

        {/* Right fade — signals more content without cluttering the UI */}
        <div
          className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-gl-bg to-transparent sm:hidden"
          aria-hidden="true"
        />
      </div>

      {/* Scroll dots — mobile only */}
      <div className="mt-5 flex justify-center gap-2 sm:hidden" role="tablist" aria-label="Problem cards">
        {PROBLEMS.map((_, i) => (
          <button
            key={i}
            role="tab"
            aria-selected={activeCard === i}
            aria-label={`Card ${i + 1} of ${PROBLEMS.length}`}
            onClick={() =>
              cardRefs.current[i]?.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
                inline: 'start',
              })
            }
            className={`h-1.5 rounded-full transition-all duration-300 ${
              activeCard === i
                ? 'w-5 bg-gl-primary'
                : 'w-1.5 bg-gl-border hover:bg-gl-text-faint'
            }`}
          />
        ))}
      </div>
      </FadeIn>
    </section>
  );
}
