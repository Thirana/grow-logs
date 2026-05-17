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
