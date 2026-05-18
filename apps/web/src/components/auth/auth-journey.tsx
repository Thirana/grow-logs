// Auth journey progress indicator — four-step signup flow tracker.
// Used by: app/(auth)/check-email/page.tsx, app/(auth)/verify-email/page.tsx
import { type JSX, Fragment } from 'react';

import { cn } from '@/lib/utils';
import { IconCheck } from '@/components/common/icons';

export type StepState = 'done' | 'current' | 'upcoming';

export interface JourneyStep {
  label: string;
  state: StepState;
}

interface FlowStepProps {
  label: string;
  state: StepState;
}

function FlowStep({ label, state }: FlowStepProps): JSX.Element {
  return (
    <div className="flex min-w-0 flex-col items-center gap-2">
      {state === 'done' ? (
        <div className="bg-gl-primary-soft border-gl-primary/30 flex size-6 items-center justify-center rounded-full border">
          <IconCheck size={9} className="text-gl-primary" />
        </div>
      ) : state === 'current' ? (
        <div className="border-gl-primary ring-gl-primary/20 flex size-6 items-center justify-center rounded-full border ring-2">
          <span className="bg-gl-primary size-1.5 rounded-full" />
        </div>
      ) : (
        <div className="border-gl-border size-6 rounded-full border" />
      )}
      <span
        className={cn(
          'text-center text-[10.5px] leading-none font-medium whitespace-nowrap',
          state === 'done' && 'text-gl-text-muted',
          state === 'current' && 'text-gl-primary',
          state === 'upcoming' && 'text-gl-text-faint',
        )}
      >
        {label}
      </span>
    </div>
  );
}

interface JourneyCardProps {
  steps: JourneyStep[];
}

export function JourneyCard({ steps }: JourneyCardProps): JSX.Element {
  return (
    <div className="border-gl-border bg-gl-surface shadow-gl rounded-2xl border px-6 py-5">
      <p className="text-gl-text-faint mb-4 text-[10.5px] font-semibold tracking-[0.08em] uppercase">
        Your journey
      </p>
      <div className="flex items-start">
        {steps.map((step, i) => (
          <Fragment key={step.label}>
            <FlowStep label={step.label} state={step.state} />
            {i < steps.length - 1 && (
              <div
                className={cn(
                  'mt-3 h-px flex-1 shrink',
                  step.state === 'done' ? 'bg-gl-primary/25' : 'bg-gl-border',
                )}
              />
            )}
          </Fragment>
        ))}
      </div>
    </div>
  );
}
