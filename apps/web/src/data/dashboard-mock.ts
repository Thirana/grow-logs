// Typed mock data for the dashboard — used on the landing page LivePreview
// and as placeholder data before the real API is wired up.
// Swatch hex values map to --gl-swatch-1 through --gl-swatch-5 in globals.css.

export interface MockCategory {
  id: string;
  name: string;
  subcategories: string[];
  swatchColor: string;
  entryCount: number;
  avgScore: number;
}

export interface MockEntry {
  id: string;
  day: string;
  month: string;
  type: 'Work' | 'Learning';
  categoryName: string;
  subcategoryName: string;
  text: string;
  score: number;
  swatchColor: string;
}

export interface DailyActivity {
  dayIndex: number;
  dateLabel: string;
  workCount: number;
  learnCount: number;
}

export interface DashboardStats {
  totalEntries: number;
  thisWeek: number;
  weekTrendUp: boolean;
  weekTrendText: string;
  workPct: number;
  learnPct: number;
  avgProductivity: number;
  currentStreak: number;
  personalBestStreak: number;
}

export const MOCK_STATS: DashboardStats = {
  totalEntries: 147,
  thisWeek: 12,
  weekTrendUp: true,
  weekTrendText: '+3 vs. last week',
  workPct: 62,
  learnPct: 38,
  avgProductivity: 7.4,
  currentStreak: 9,
  personalBestStreak: 23,
};

export const MOCK_CATEGORIES: MockCategory[] = [
  { id: '1', name: 'Backend',       subcategories: ['NestJS', 'Postgres', 'Auth'],        swatchColor: '#6FC8A0', entryCount: 38, avgScore: 7.8 },
  { id: '2', name: 'System Design', subcategories: ['Caching', 'Queues'],                 swatchColor: '#7C8FE0', entryCount: 24, avgScore: 7.2 },
  { id: '3', name: 'Reading',       subcategories: ['DDIA', 'Refactoring'],               swatchColor: '#BFA8E5', entryCount: 22, avgScore: 7.5 },
  { id: '4', name: 'Side Project',  subcategories: ['Grow Logs', 'Notes app'],            swatchColor: '#E0AE52', entryCount: 19, avgScore: 8.4 },
  { id: '5', name: 'Soft Skills',   subcategories: ['Communication', 'Mentoring'],        swatchColor: '#E8866F', entryCount: 12, avgScore: 6.9 },
];

export const MOCK_ENTRIES: MockEntry[] = [
  {
    id: '1', day: '14', month: 'May', type: 'Work',
    categoryName: 'Backend', subcategoryName: 'NestJS',
    text: 'Refactored auth into a single guard. Pulled the refresh-token rotation out of the login handler and the test surface dropped by half.',
    score: 8, swatchColor: '#6FC8A0',
  },
  {
    id: '2', day: '14', month: 'May', type: 'Learning',
    categoryName: 'Reading', subcategoryName: 'DDIA',
    text: 'Chapter 4 — Designing Data-Intensive Applications. Replication patterns; conflict resolution figure finally clicked.',
    score: 7, swatchColor: '#BFA8E5',
  },
  {
    id: '3', day: '13', month: 'May', type: 'Work',
    categoryName: 'Side Project', subcategoryName: 'Grow Logs',
    text: 'Shipped the import-from-CSV flow. Row-level errors inline. Cut onboarding friction for the three people who tried it.',
    score: 9, swatchColor: '#E0AE52',
  },
  {
    id: '4', day: '13', month: 'May', type: 'Learning',
    categoryName: 'System Design', subcategoryName: 'Caching',
    text: 'Read up on cache stampedes — request coalescing, lock-and-refresh, probabilistic early expiration. Trade-offs make sense now.',
    score: 6, swatchColor: '#7C8FE0',
  },
  {
    id: '5', day: '12', month: 'May', type: 'Work',
    categoryName: 'Backend', subcategoryName: 'Postgres',
    text: 'Replaced two redundant indexes after running the unused-index report. Saved ~140 MB. Tiny but satisfying.',
    score: 7, swatchColor: '#6FC8A0',
  },
];

// 30 days of daily activity data
const _seed = [1,2,0,3,1, 2,3,1,2,2, 4,2,3,1,0, 2,3,2,4,1, 3,2,3,1,2, 4,3,2,1,3];
export const MOCK_DAILY: DailyActivity[] = _seed.map((w, i) => ({
  dayIndex: i,
  dateLabel: (i % 7 === 0 || i === 29) ? `${i + 1} May` : '',
  workCount: w,
  learnCount: (i * 3) % 4 + (i % 5 === 0 ? 1 : 0),
}));

// 8-week productivity trend; null = no data that week
export const MOCK_TREND: (number | null)[] = [6.8, 7.1, 6.5, 7.4, null, 7.6, 7.8, 8.0];
