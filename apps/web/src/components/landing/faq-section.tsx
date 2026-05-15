'use client';

import { useState } from 'react';
import { IconChevronDown } from '@/components/common/icons';
import { FadeIn } from '@/components/common/fade-in';

const FAQS = [
  {
    q: 'Is it free to start?',
    a: 'Free forever for the core features: log entries, manage categories, and view your full dashboard. No credit card needed. Premium features like AI-generated weekly summaries and third-party integrations are planned but not yet live.',
  },
  {
    q: 'How is this different from Notion or Obsidian?',
    a: 'Those are general-purpose tools. Grow Logs is purpose-built for growth tracking: every entry has a type (Work or Learning), a productivity score, and belongs to a category you define. Your dashboard surfaces trends and patterns automatically. There is nothing to design or maintain.',
  },
  {
    q: 'What does the productivity score track?',
    a: 'It is a 1–10 self-assessment you add to each entry: how focused and effective you actually felt during that session. Over time your average score gives an honest picture of your output quality, not just your output volume.',
  },
  {
    q: 'Is my data private?',
    a: 'Yes. Your entries are visible only to you. We do not sell or share your data, and your logs are never used to train AI models.',
  },
  {
    q: 'Can I export my entries?',
    a: 'CSV export is on the roadmap. In the meantime, all your data is yours and fully accessible through the dashboard at any time.',
  },
  {
    q: 'What if I miss a day?',
    a: 'That is fine. Grow Logs is not a streak-punishment app. Your streak resets but your history stays exactly as it was. The goal is honest, sustainable reflection, not perfect attendance.',
  },
] as const;

export function FaqSection() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="py-12 sm:py-16 lg:py-20">
      {/* Header */}
      <FadeIn>
        <div className="mx-auto mb-10 max-w-[640px] text-center">
          <h2 className="mb-3.5 text-[34px] font-bold leading-[1.08] tracking-[-0.025em] text-gl-text text-balance sm:text-[44px] sm:tracking-[-0.028em]">
            Common <span className="text-gl-primary">questions</span>.
          </h2>
          <p className="text-[17px] leading-[1.55] text-gl-text-muted text-pretty">
            Everything you need to know before you start.
          </p>
        </div>
      </FadeIn>

      {/* FAQ list — individual cards with gaps */}
      <FadeIn delay={130}>
      <div className="mx-auto flex max-w-[720px] flex-col gap-3">
        {FAQS.map(({ q, a }, i) => {
          const isOpen = open === i;

          return (
            <div
              key={q}
              className="overflow-hidden rounded-2xl border border-gl-border bg-gl-surface shadow-gl transition-colors duration-150"
            >
              <button
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex w-full items-start justify-between gap-4 px-6 py-5 text-left hover:bg-gl-surface-2 transition-colors duration-150"
                aria-expanded={isOpen}
              >
                <span
                  className={`text-[15.5px] font-semibold leading-snug transition-colors duration-150 sm:text-[16px] ${
                    isOpen ? 'text-gl-primary' : 'text-gl-text'
                  }`}
                >
                  {q}
                </span>
                <span
                  className={`mt-0.5 shrink-0 text-gl-text-muted transition-transform duration-300 ${
                    isOpen ? 'rotate-180 text-gl-primary' : ''
                  }`}
                >
                  <IconChevronDown size={16} />
                </span>
              </button>

              {/* Smooth height reveal via CSS grid trick */}
              <div
                className={`grid transition-all duration-300 ease-in-out ${
                  isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                }`}
              >
                <div className="overflow-hidden">
                  <div className="px-6 pb-5">
                    <p className="border-l-2 border-gl-primary pl-4 text-[15px] leading-[1.7] text-gl-text-muted">
                      {a}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      </FadeIn>
    </section>
  );
}
