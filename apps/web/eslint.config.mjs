import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import prettier from 'eslint-config-prettier';
import queryPlugin from '@tanstack/eslint-plugin-query';

// eslint-config-next/core-web-vitals already bundles jsx-a11y and react-hooks
// with recommended rules — no need to add them again here.
const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  // React Query best-practice rules:
  // - query keys must include all reactive values used inside (exhaustive-deps)
  // - QueryClient must not be created inside a component (stable-query-client)
  // - no inline object/array queryKeys that reset on every render (no-unstable-deps)
  ...queryPlugin.configs['flat/recommended'],

  {
    // Scope type-aware rules to source files only.
    // Config files (eslint.config.mjs, postcss.config.mjs) are not included in
    // tsconfig.json, so the TypeScript parser cannot type-check them.
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    languageOptions: {
      parserOptions: {
        // Enables type-aware rules (no-floating-promises, etc.).
        // Slower than basic linting but catches async bugs that are otherwise invisible.
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Promises must be awaited or explicitly .catch()-ed / void-ed.
      // Unhandled promises cause silent failures — one of the most common AI mistakes.
      '@typescript-eslint/no-floating-promises': 'error',

      // Use `import type` for type-only imports. Improves tree-shaking and makes
      // the intent explicit — the bundler drops type imports safely at build time.
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],

      // No `any`. TypeScript strict mode enables this but making it 'error' here
      // ensures it cannot be accidentally downgraded to 'warn'.
      '@typescript-eslint/no-explicit-any': 'error',

      // No console.log in committed code — it leaks internal state in production.
      // 'error' (not 'warn') so CI lint fails on the same terms as local lint-staged.
      // console.error and console.warn are allowed for error boundaries and logging.
      'no-console': ['error', { allow: ['error', 'warn'] }],
    },
  },

  // Must be last — disables ESLint rules that conflict with Prettier formatting.
  prettier,

  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    'coverage/**',
    'public/mockServiceWorker.js',
  ]),
]);

export default eslintConfig;
