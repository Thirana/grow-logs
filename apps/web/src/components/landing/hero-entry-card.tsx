import { TypeBadge } from '@/components/common/type-badge';
import { IconCheck } from '@/components/common/icons';

export function HeroEntryCard() {
  return (
    <div className="relative flex h-full min-h-[280px] flex-col gap-3.5 rounded-2xl border border-gl-border bg-gl-surface p-7 shadow-gl-lg transition-all duration-[150ms] hover:-translate-y-0.5 hover:shadow-gl-lg">
      {/* Date + score */}
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.10em] text-gl-text-faint whitespace-nowrap">
          14 May · Today
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-gl-primary-soft px-2.5 py-1 font-mono text-[12px] font-semibold tabular-nums text-gl-primary whitespace-nowrap">
          <span className="font-normal text-gl-primary/60">score</span> 8 / 10
        </span>
      </div>

      {/* Type + category */}
      <div className="flex flex-wrap items-center gap-2">
        <TypeBadge type="Work" />
        <span className="inline-flex items-center gap-1.5 rounded-full border border-gl-border bg-gl-surface-2 px-2.5 py-1 text-[11.5px] font-medium text-gl-text whitespace-nowrap">
          <span
            className="size-[7px] shrink-0 rounded-full"
            style={{ background: '#6FC8A0' }}
            aria-hidden="true"
          />
          Backend
          <span className="mx-0.5 text-gl-text-faint">/</span>
          <span className="text-gl-text-muted">NestJS</span>
        </span>
      </div>

      {/* Title */}
      <h3 className="mt-0.5 text-[22px] font-bold leading-[1.32] tracking-[-0.018em] text-gl-text text-balance">
        Refactored auth into a single guard.
      </h3>

      {/* Body */}
      <p className="text-[14.5px] italic leading-[1.65] text-gl-text-muted">
        Pulled the refresh-token rotation out of the login handler. Tests dropped by half once
        the responsibilities were separated.
        <span
          className="ml-0.5 inline-block h-[13px] w-px translate-y-[2px] bg-gl-primary animate-cursor-blink"
          aria-hidden="true"
        />
      </p>

      {/* Footer */}
      <div className="mt-auto flex items-center justify-between border-t border-gl-border pt-3">
        <span className="inline-flex items-center gap-1.5 text-[11.5px] font-medium text-gl-primary">
          <span className="inline-flex size-[14px] items-center justify-center rounded-full bg-gl-primary-soft">
            <IconCheck size={9} />
          </span>
          Saved · just now
        </span>
        <kbd className="font-mono text-[11px] font-medium text-gl-text-faint">↵ enter</kbd>
      </div>
    </div>
  );
}
