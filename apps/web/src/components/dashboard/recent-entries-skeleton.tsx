import { type JSX } from 'react';

function SkeletonRow({ isLast }: { isLast: boolean }): JSX.Element {
  return (
    <div
      className={`hidden items-center gap-4 px-[22px] py-3.5 sm:flex ${
        isLast ? '' : 'border-gl-border border-b'
      }`}
    >
      {/* Date */}
      <div className="w-11 shrink-0 space-y-1.5 text-center">
        <div className="bg-gl-border/50 mx-auto h-5 w-7 animate-pulse rounded" />
        <div className="bg-gl-border/50 mx-auto h-2.5 w-8 animate-pulse rounded" />
      </div>
      {/* Badge */}
      <div className="bg-gl-border/50 h-6 w-[68px] animate-pulse rounded-full" />
      {/* Text block */}
      <div className="min-w-0 flex-1 space-y-2">
        <div className="bg-gl-border/50 h-3 w-32 animate-pulse rounded" />
        <div className="bg-gl-border/50 h-3 w-full max-w-[480px] animate-pulse rounded" />
      </div>
      {/* Score */}
      <div className="bg-gl-border/50 h-6 w-20 animate-pulse rounded-lg" />
      {/* Menu */}
      <div className="bg-gl-border/50 size-7 animate-pulse rounded-[7px]" />
    </div>
  );
}

export function RecentEntriesSkeleton(): JSX.Element {
  return (
    <div className="border-gl-border bg-gl-surface shadow-gl mb-4 rounded-xl border">
      {/* Header skeleton */}
      <div className="border-gl-border flex items-center justify-between border-b px-[22px] py-[18px]">
        <div className="bg-gl-border/50 h-5 w-32 animate-pulse rounded" />
        <div className="bg-gl-border/50 h-8 w-52 animate-pulse rounded-lg" />
      </div>
      <SkeletonRow isLast={false} />
      <SkeletonRow isLast={false} />
      <SkeletonRow isLast={true} />
    </div>
  );
}
