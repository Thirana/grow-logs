// This test requires a successful `npm run build` to run first.
// It verifies that the app exits with code 1 when DATABASE_URL is missing
// by spawning a child process — testing process.exit(1) in-process is unreliable.
import { execSync } from 'child_process';
import { resolve } from 'path';

it('exits with code 1 when DATABASE_URL is missing', () => {
  let exitCode: number | null = null;
  let output = '';

  const apiRoot = resolve(__dirname, '..');

  const env = { ...process.env };
  delete env['DATABASE_URL'];
  env['NODE_ENV'] = 'production';
  env['PORT'] = '3099';

  try {
    execSync('node -e "require(\'./dist/src/main\')"', {
      cwd: apiRoot,
      env,
      encoding: 'utf8',
      stdio: 'pipe',
    });
  } catch (err: unknown) {
    const e = err as { status?: number; stderr?: string; stdout?: string };
    exitCode = e.status ?? null;
    output = (e.stderr ?? '') + (e.stdout ?? '');
  }

  expect(exitCode).toBe(1);
  expect(output).toMatch(/DATABASE_URL/i);
});
