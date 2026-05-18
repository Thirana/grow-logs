// Dashboard layout — wraps all dashboard pages with the client-side auth guard.
// Used by: all pages under app/(dashboard)/
import { type JSX } from 'react';
import { AuthGuard } from '@/components/common/auth-guard';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps): JSX.Element {
  return <AuthGuard>{children}</AuthGuard>;
}
