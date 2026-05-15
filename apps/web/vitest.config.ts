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
      // Only measure coverage on code we own and can meaningfully test
      include: [
        'src/hooks/**',
        'src/stores/**',
        'src/lib/**',
        'src/components/common/**',
        'src/components/landing/**',
        'src/components/dashboard/**',
      ],
      exclude: [
        'src/components/ui/**', // shadcn primitives — not our code
        'src/app/**', // Next.js pages — covered by E2E when added
        'src/test/**',
        '**/*.config.*',
        '**/*.d.ts',
      ],
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
