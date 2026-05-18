'use client';

import { type JSX, useState } from 'react';
import { EntryRow } from './entry-row';
import { IconArrowRight, IconEmptyList } from '@/components/common/icons';
import type { Entry } from '@grow-logs/types';

type Filter = 'all' | 'work' | 'learning';

interface RecentEntriesProps {
  entries: Entry[];
  onAddEntry?: () => void;
}

const FILTER_LABELS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'work', label: 'Work' },
  { key: 'learning', label: 'Learning' },
];

export function RecentEntries({ entries, onAddEntry }: RecentEntriesProps): JSX.Element {
  const [filter, setFilter] = useState<Filter>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const visible =
    filter === 'all' ? entries : entries.filter((e) => e.type.toLowerCase() === filter);

  return (
    <div className="border-gl-border bg-gl-surface shadow-gl mb-4 rounded-xl border">
      {/* Header */}
      <div className="border-gl-border border-b px-4 py-3.5 sm:px-[22px] sm:py-[18px]">
        {/* Mobile: title row */}
        <div className="flex items-center justify-between gap-2 sm:hidden">
          <h2 className="text-gl-text text-[16px] leading-snug font-bold tracking-[-0.015em]">
            Recent entries
          </h2>
          <div className="border-gl-border bg-gl-bg-subtle flex gap-0.5 rounded-lg border p-[3px]">
            {FILTER_LABELS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`rounded-[6px] px-2.5 py-1 text-[11.5px] font-medium transition-colors duration-[120ms] ${
                  filter === key
                    ? 'bg-gl-primary-soft text-gl-primary font-semibold'
                    : 'text-gl-text-muted hover:text-gl-text'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Desktop: single row */}
        <div className="hidden items-center justify-between sm:flex">
          <h2 className="text-gl-text text-[17px] leading-snug font-bold tracking-[-0.015em]">
            Recent entries
          </h2>
          <div className="flex items-center gap-3">
            <div className="border-gl-border bg-gl-bg-subtle flex gap-0.5 rounded-lg border p-[3px]">
              {FILTER_LABELS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`rounded-[7px] px-3 py-1.5 text-[12.5px] font-medium transition-colors duration-[120ms] ${
                    filter === key
                      ? 'bg-gl-primary-soft text-gl-primary font-semibold'
                      : 'text-gl-text-muted hover:text-gl-text'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <a
              href="#"
              className="text-gl-primary hover:text-gl-primary-hover inline-flex items-center gap-1.5 text-[12.5px] font-semibold whitespace-nowrap"
            >
              View all <IconArrowRight size={12} />
            </a>
          </div>
        </div>
      </div>

      {/* Body */}
      {entries.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
          <IconEmptyList size={36} className="text-gl-text-faint" />
          <div className="text-gl-text mt-1 text-[18px] font-bold tracking-[-0.015em]">
            No entries yet
          </div>
          <p className="text-gl-text-muted max-w-[320px] text-[14px] leading-relaxed">
            Your log will appear here once you start adding entries.
          </p>
          {onAddEntry && (
            <button
              onClick={onAddEntry}
              className="text-gl-primary hover:text-gl-primary-hover mt-2 inline-flex items-center gap-1.5 text-[13px] font-semibold"
            >
              Add your first entry <IconArrowRight size={12} />
            </button>
          )}
        </div>
      ) : visible.length === 0 ? (
        <div className="text-gl-text-muted px-6 py-10 text-center text-[13px] leading-relaxed">
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
