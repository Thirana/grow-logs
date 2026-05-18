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
