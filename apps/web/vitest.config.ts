import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    env: {
      NEXT_PUBLIC_API_URL: 'http://localhost:3000/api/v1',
    },
    exclude: ['**/node_modules/**', '**/.next/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      // Coverage measures code that contains testable logic.
      // Excluded categories are documented below with the reason.
      include: [
        'src/hooks/**',
        'src/stores/**',
        'src/lib/**',
        'src/components/common/**',
        // Feature component directories — added as each step is implemented:
        'src/components/auth/**',
        'src/components/onboarding/**',
        'src/components/categories/**',
        'src/components/settings/**',
        // components/dashboard — excluded until F06/F07 when mock data is replaced
        // with real React Query hooks; tests added as part of those steps.
      ],
      exclude: [
        'src/components/ui/**', // shadcn primitives — not our code
        'src/app/**', // Next.js pages — covered by E2E when added
        'src/test/**',
        '**/*.config.*',
        '**/*.d.ts',

        // Landing page — pure static marketing JSX; no business logic to unit test.
        // Visual correctness is verified by inspection and E2E tests, not unit tests.
        'src/components/landing/**',

        // Dashboard components — entirely mock-data driven right now; will be
        // replaced with real data hooks in F06/F07 and tested at that point.
        'src/components/dashboard/**',

        // Static rendering shells in common — no testable logic.
        'src/components/common/icons.tsx', // 388-line SVG export file
        'src/components/common/eyebrow.tsx', // single styled wrapper element
        'src/components/common/logo.tsx', // single styled wrapper element
      ],
      thresholds: {
        // Global floor — rises naturally as hooks and components are tested.
        // Hooks and lib utilities (the API layer) are held to 70%; UI components
        // are harder to reach so the global threshold starts lower.
        lines: 60,
        branches: 60,
        functions: 60,
        statements: 60,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // @testing-library/react and react-dom are hoisted to the monorepo root, so
      // they use root/node_modules/react. Pin all test-time React imports to that
      // same copy so hooks never see two different instances.
      react: path.resolve(__dirname, '../../node_modules/react'),
      'react-dom': path.resolve(__dirname, '../../node_modules/react-dom'),
      'react/jsx-runtime': path.resolve(__dirname, '../../node_modules/react/jsx-runtime'),
      'react-dom/client': path.resolve(__dirname, '../../node_modules/react-dom/client'),
    },
  },
});
