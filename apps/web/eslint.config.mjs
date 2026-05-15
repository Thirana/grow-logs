import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import prettier from 'eslint-config-prettier';

// eslint-config-next/core-web-vitals already bundles and registers jsx-a11y
// with its recommended rules — no need to add it again here.
const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Must be last — disables ESLint rules that conflict with Prettier
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
