'use client';

import { useState } from 'react';
import { EntryRow } from './entry-row';
import { IconArrowRight, IconEmptyList } from '@/components/common/icons';
import type { MockEntry } from '@/data/dashboard-mock';

type Filter = 'all' | 'work' | 'learning';

interface RecentEntriesProps {
  entries: MockEntry[];
  onAddEntry?: () => void;
}

const FILTER_LABELS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'work', label: 'Work' },
  { key: 'learning', label: 'Learning' },
];

export function RecentEntries({ entries, onAddEntry }: RecentEntriesProps){
  const [filter, setFilter] = useState<Filter>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const visible =
    filter === 'all' ? entries : entries.filter((e) => e.type.toLowerCase() === filter);

  return (
    <div className="mb-4 rounded-xl border border-gl-border bg-gl-surface shadow-gl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gl-border px-[22px] py-[18px]">
        <h2 className="text-[17px] font-bold leading-snug tracking-[-0.015em] text-gl-text">
          Recent entries
        </h2>

        <div className="flex items-center gap-3">
          {/* Filter pills */}
          <div className="flex gap-0.5 rounded-lg border border-gl-border bg-gl-bg-subtle p-[3px]">
            {FILTER_LABELS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`rounded-[7px] px-3 py-1.5 text-[12.5px] font-medium transition-colors duration-[120ms] ${
                  filter === key
                    ? 'bg-gl-primary-soft font-semibold text-gl-primary'
                    : 'text-gl-text-muted hover:text-gl-text'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* View all */}
          <a
            href="#"
            className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-gl-primary hover:text-gl-primary-hover whitespace-nowrap"
          >
            View all <IconArrowRight size={12} />
          </a>
        </div>
      </div>

      {/* Body */}
      {entries.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
          <IconEmptyList size={36} className="text-gl-text-faint" />
          <div className="mt-1 text-[18px] font-bold tracking-[-0.015em] text-gl-text">No entries yet</div>
          <p className="max-w-[320px] text-[14px] leading-relaxed text-gl-text-muted">
            Your log will appear here once you start adding entries.
          </p>
          <button
            onClick={onAddEntry}
            className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-semibold text-gl-primary hover:text-gl-primary-hover"
          >
            Add your first entry <IconArrowRight size={12} />
          </button>
        </div>
      ) : visible.length === 0 ? (
        <div className="px-6 py-10 text-center text-[13px] leading-relaxed text-gl-text-muted">
          No {filter} entries in this period.
        </div>
      ) : (
        visible.map((entry, i) => (
          <EntryRow
            key={entry.id}
            entry={entry}
            isExpanded={expandedId === entry.id}
            onToggleExpand={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
            isLast={i === visible.length - 1}
          />
        ))
      )}
    </div>
  );
}
