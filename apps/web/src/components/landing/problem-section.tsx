'use client';

import { type JSX, useRef, useState, useEffect } from 'react';
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
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = cardRefs.current.indexOf(entry.target as HTMLDivElement);
            if (idx !== -1) setActiveCard(idx);
          }
        });
      },
      { root: container, threshold: 0.6 },
    );

    cardRefs.current.forEach((card) => {
      if (card) observer.observe(card);
    });
    return () => observer.disconnect();
  }, []);

  return (
    <section id="problem" className="py-12 sm:py-16 lg:pt-16 lg:pb-8">
      {/* Header */}
      <FadeIn>
        <div className="mx-auto mb-10 max-w-[640px] text-center">
          <h2 className="text-gl-text mb-3.5 text-[36px] leading-[1.08] font-bold tracking-[-0.025em] text-balance sm:text-[44px] sm:tracking-[-0.028em]">
            Sound familiar?
          </h2>
          <p className="text-gl-text-muted text-[17px] leading-[1.55]">
            A few frustrations every learner and engineer eventually runs into.
          </p>
        </div>
      </FadeIn>

      {/* Cards */}
      <FadeIn delay={130}>
        <div className="relative">
          <div
            ref={scrollRef}
            className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto sm:grid sm:snap-none sm:grid-cols-2 sm:gap-5 sm:overflow-visible lg:grid-cols-3"
          >
            {PROBLEMS.map(({ icon: Icon, iconBg, iconColor, title, body }, i) => (
              <div
                key={title}
                ref={(el) => {
                  cardRefs.current[i] = el;
                }}
                className="border-gl-border bg-gl-surface shadow-gl hover:shadow-gl-lg flex w-[82%] min-w-[82%] flex-shrink-0 snap-start flex-col rounded-2xl border p-7 transition-all duration-[150ms] hover:-translate-y-0.5 sm:w-auto sm:min-w-0"
              >
                <div
                  className={`mb-[22px] inline-flex size-11 items-center justify-center rounded-xl ${iconBg} ${iconColor}`}
                >
                  <Icon size={22} />
                </div>
                <h3 className="text-gl-text mb-2.5 text-[20px] leading-[1.3] font-bold tracking-[-0.015em] text-balance">
                  {title}
                </h3>
                <p className="text-gl-text-muted text-[15px] leading-[1.6]">{body}</p>
              </div>
            ))}
          </div>

          {/* Right fade — signals more content without cluttering the UI */}
          <div
            className="from-gl-bg pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l to-transparent sm:hidden"
            aria-hidden="true"
          />
        </div>

        {/* Scroll dots — mobile only */}
        <div
          className="mt-5 flex justify-center gap-2 sm:hidden"
          role="tablist"
          aria-label="Problem cards"
        >
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
                activeCard === i ? 'bg-gl-primary w-5' : 'bg-gl-border hover:bg-gl-text-faint w-1.5'
              }`}
            />
          ))}
        </div>
      </FadeIn>
    </section>
  );
}
