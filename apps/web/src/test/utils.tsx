// Shared test utilities — wrappers and helpers used across hook and component tests.
import { type JSX } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Returns a fresh QueryClientProvider wrapper for each test.
// A new QueryClient per test prevents state leaking between tests.
export function createTestWrapper(): ({ children }: { children: React.ReactNode }) => JSX.Element {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return function TestWrapper({ children }: { children: React.ReactNode }): JSX.Element {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}
