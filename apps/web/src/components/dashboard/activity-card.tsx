'use client';

// Activity chart card — daily bar chart or category breakdown, with period-aware rolling window.
// Used by: components/dashboard/dashboard-client.tsx
import { useState, useEffect } from 'react';
import { DailyChart } from './daily-chart';
import { CategoryChart } from './category-chart';
import type { CategorySummaryItem } from '@grow-logs/types';

type Period = '7d' | '30d' | 'week' | 'month';
type Tab = 'daily' | 'category';

interface DailyPoint {
  date: string;
  workCount: number;
  learnCount: number;
}

interface ActivityCardProps {
  dailyActivity: DailyPoint[];
  byCategory: CategorySummaryItem[];
  period: Period;
}

const TABS: { key: Tab; label: string; mobileLabel: string }[] = [
  { key: 'daily', label: 'Daily activity', mobileLabel: 'Daily' },
  { key: 'category', label: 'Category breakdown', mobileLabel: 'Categories' },
];

// Generate YYYY-MM-DD in local time (avoids UTC midnight boundary shifting the date).
function localDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Build a full rolling window of `count` days ending today, merging sparse API data.
function buildWindow(
  count: number,
  apiData: DailyPoint[],
): { date: string; workCount: number; learnCount: number }[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const map = new Map<string, { workCount: number; learnCount: number }>();
  for (const d of apiData) {
    map.set(d.date.slice(0, 10), { workCount: d.workCount, learnCount: d.learnCount });
  }

  return Array.from({ length: count }, (_, i) => {
    const day = new Date(today);
    day.setDate(today.getDate() - (count - 1 - i));
    const iso = localDateStr(day);
    const found = map.get(iso);
    return { date: iso, workCount: found?.workCount ?? 0, learnCount: found?.learnCount ?? 0 };
  });
}

// Build an explicit date range from start to end (inclusive), merging sparse API data.
function buildCalendarWindow(
  start: Date,
  end: Date,
  apiData: DailyPoint[],
): { date: string; workCount: number; learnCount: number }[] {
  const map = new Map<string, { workCount: number; learnCount: number }>();
  for (const d of apiData) {
    map.set(d.date.slice(0, 10), { workCount: d.workCount, learnCount: d.learnCount });
  }
  const result: { date: string; workCount: number; learnCount: number }[] = [];
  const cur = new Date(start);
  cur.setHours(0, 0, 0, 0);
  const last = new Date(end);
  last.setHours(0, 0, 0, 0);
  while (cur <= last) {
    const iso = localDateStr(cur);
    const found = map.get(iso);
    result.push({
      date: iso,
      workCount: found?.workCount ?? 0,
      learnCount: found?.learnCount ?? 0,
    });
    cur.setDate(cur.getDate() + 1);
  }
  return result;
}

function currentWeekBounds(): { start: Date; end: Date } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dow = today.getDay(); // 0=Sun … 6=Sat
  const daysToMon = dow === 0 ? -6 : 1 - dow;
  const monday = new Date(today);
  monday.setDate(today.getDate() + daysToMon);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { start: monday, end: sunday };
}

function currentMonthBounds(): { start: Date; end: Date } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(today.getFullYear(), today.getMonth(), 1);
  const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  return { start, end };
}

function labelWeekday(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleString('en-US', { weekday: 'short' });
}

function labelMonthDay(iso: string): string {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(
    new Date(`${iso}T00:00:00`),
  );
}

function labelTooltip(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(new Date(`${iso}T00:00:00`));
}

export function ActivityCard({ dailyActivity, byCategory, period }: ActivityCardProps) {
  const [tab, setTab] = useState<Tab>('daily');
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 639px)').matches,
  );

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)');
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const todayIso = localDateStr(new Date());

  const chartData = (() => {
    if (period === '7d') {
      return buildWindow(7, dailyActivity).map((d) => ({
        dateLabel: labelWeekday(d.date),
        tooltipLabel: labelTooltip(d.date),
        workCount: d.workCount,
        learnCount: d.learnCount,
        isToday: d.date === todayIso,
      }));
    }

    if (period === '30d') {
      const days = isMobile ? 7 : 30;
      return buildWindow(days, dailyActivity).map((d, i, arr) => {
        const showLabel = isMobile || i === 0 || (i + 1) % 5 === 0 || i === arr.length - 1;
        return {
          dateLabel: showLabel ? labelMonthDay(d.date) : '',
          tooltipLabel: labelTooltip(d.date),
          workCount: d.workCount,
          learnCount: d.learnCount,
          isToday: d.date === todayIso,
        };
      });
    }

    if (period === 'week') {
      const { start, end } = currentWeekBounds();
      return buildCalendarWindow(start, end, dailyActivity).map((d) => ({
        dateLabel: labelWeekday(d.date),
        tooltipLabel: labelTooltip(d.date),
        workCount: d.workCount,
        learnCount: d.learnCount,
        isToday: d.date === todayIso,
      }));
    }

    if (period === 'month') {
      const { start, end } = currentMonthBounds();
      const days = buildCalendarWindow(start, end, dailyActivity);
      const totalDays = days.length;
      return days.map((d, i) => {
        const showLabel = isMobile
          ? i === 0 || (i + 1) % 7 === 0 || i === totalDays - 1
          : i === 0 || (i + 1) % 5 === 0 || i === totalDays - 1;
        return {
          dateLabel: showLabel ? labelMonthDay(d.date) : '',
          tooltipLabel: labelTooltip(d.date),
          workCount: d.workCount,
          learnCount: d.learnCount,
          isToday: d.date === todayIso,
        };
      });
    }

    return [];
  })();

  return (
    <div className="border-gl-border bg-gl-surface shadow-gl mb-4 overflow-visible rounded-xl border">
      <div className="flex items-center justify-between px-4 pt-4 sm:px-[22px] sm:pt-[18px]">
        <p className="text-gl-text-faint text-[11px] font-bold tracking-[0.12em] uppercase">
          Activity
        </p>

        <div className="flex items-center gap-3">
          <div className="border-gl-border bg-gl-bg-subtle inline-flex gap-1 rounded-[9px] border p-1">
            {TABS.map(({ key, label, mobileLabel }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`rounded-[7px] px-2.5 py-[6px] text-[11.5px] font-medium transition-colors duration-[120ms] sm:px-3 sm:py-[7px] sm:text-[12.5px] ${
                  tab === key
                    ? 'bg-gl-primary text-gl-primary-ink font-semibold'
                    : 'text-gl-text-muted hover:text-gl-text'
                }`}
              >
                <span className="sm:hidden">{mobileLabel}</span>
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>

          <div className="text-gl-text-muted hidden items-center gap-3.5 text-[12px] sm:flex">
            <span className="flex items-center gap-1.5">
              <span className="bg-gl-work size-[9px] rounded-[2px]" aria-hidden="true" /> Work
            </span>
            <span className="flex items-center gap-1.5">
              <span className="bg-gl-learn size-[9px] rounded-[2px]" aria-hidden="true" /> Learning
            </span>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-[22px]">
        {tab === 'daily' ? (
          <DailyChart data={chartData} />
        ) : (
          <CategoryChart categories={byCategory} />
        )}
      </div>
    </div>
  );
}
