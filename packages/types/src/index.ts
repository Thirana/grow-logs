export interface UserProfile {
  id: string;
  email: string;
  role: "USER" | "ADMIN";
  isEmailVerified: boolean;
  onboardingCompleted: boolean;
  subscriptionStatus: "FREE" | "ACTIVE" | "CANCELLED" | "PAST_DUE";
  subscriptionPlan: string | null;
  createdAt: string;
}

export interface Subcategory {
  id: string;
  name: string;
  categoryId: string;
  isCompleted: boolean;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  isCompleted: boolean;
  subcategories: Subcategory[];
  entryCount: number;
  createdAt: string;
}

export interface CategorySummaryItem {
  category: {
    id: string;
    name: string;
    color: string;
    isCompleted: boolean;
  };
  entryCount: number;
  averageProductivityScore: number | null;
  byType: {
    WORK: number;
    LEARNING: number;
  };
}

export interface Entry {
  id: string;
  userId: string;
  type: "WORK" | "LEARNING";
  text: string;
  productivityScore: number | null;
  entryDate: string;
  categoryId: string;
  subcategoryId: string | null;
  category: { id: string; name: string; color: string };
  subcategory: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface EntryListMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface EntrySummary {
  period: "7d" | "30d" | "week" | "month";
  totalEntries: number;
  totalByType: {
    WORK: number;
    LEARNING: number;
  };
  averageProductivityScore: number | null;
  thisWeekCount: number;
  lastWeekCount: number;
  currentStreak: number;
  longestStreak: number;
  byCategory: CategorySummaryItem[];
  dailyActivity: { date: string; workCount: number; learnCount: number }[];
  weeklyTrend: { week: string; avgScore: number | null }[];
}
