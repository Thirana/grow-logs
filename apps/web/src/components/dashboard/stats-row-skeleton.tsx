import { type JSX } from 'react';

function SkeletonCard(): JSX.Element {
  return (
    <div className="border-gl-border bg-gl-surface shadow-gl rounded-xl border p-5">
      <div className="bg-gl-border/50 h-2.5 w-24 animate-pulse rounded" />
      <div className="bg-gl-border/50 mt-3 h-10 w-16 animate-pulse rounded" />
      <div className="bg-gl-border/50 mt-2 h-3 w-28 animate-pulse rounded" />
    </div>
  );
}

export function StatsRowSkeleton(): JSX.Element {
  return (
    <div className="mb-4 grid grid-cols-2 gap-3.5 lg:grid-cols-5">
      <SkeletonCard />
      <SkeletonCard />
      <div className="border-gl-border bg-gl-surface shadow-gl col-span-2 rounded-xl border p-5 lg:col-span-1">
        <div className="bg-gl-border/50 h-2.5 w-28 animate-pulse rounded" />
        <div className="mt-3.5 mb-2.5 flex items-baseline justify-between">
          <div className="bg-gl-border/50 h-8 w-12 animate-pulse rounded" />
          <div className="bg-gl-border/50 h-8 w-12 animate-pulse rounded" />
        </div>
        <div className="bg-gl-border/50 h-2.5 animate-pulse rounded-full" />
      </div>
      <SkeletonCard />
      <SkeletonCard />
    </div>
  );
}
