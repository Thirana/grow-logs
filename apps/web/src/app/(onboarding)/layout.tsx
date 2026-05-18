// Onboarding layout — transparent shell; page.tsx owns the full two-column layout.
// Used by: app/(onboarding)/onboarding/page.tsx
import { type JSX } from 'react';

interface OnboardingLayoutProps {
  children: React.ReactNode;
}

export default function OnboardingLayout({ children }: OnboardingLayoutProps): JSX.Element {
  return <>{children}</>;
}
