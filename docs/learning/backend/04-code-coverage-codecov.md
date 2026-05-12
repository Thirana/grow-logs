# 04 — Code Coverage and Codecov

**Phase:** Phase 2 | **Concepts:** Code coverage types, coverage thresholds, Codecov, PR diff comments

---

## What is Code Coverage?

Code coverage measures how much of your source code is actually executed when your test suite runs. It answers the question: "which lines of code have never been touched by a test?"

### Types of coverage

| Type | What it measures | Example |
|---|---|---|
| **Line coverage** | Which lines were executed | Line 42 was never reached |
| **Branch coverage** | Which conditional branches were taken | The `else` branch of an `if` was never tested |
| **Function coverage** | Which functions were called | `getReadiness()` was never called by a test |
| **Statement coverage** | Which statements were executed | Slightly finer-grained than line coverage |

Most projects report **line coverage** as the headline number. Branch coverage is the most meaningful — you can have 100% line coverage while missing entire code paths.

### What coverage tells you (and doesn't)

Coverage tells you which code was *executed* during tests. It does **not** tell you whether the tests are *meaningful*. You can achieve 100% coverage with tests that make no assertions — coverage says nothing about test quality.

The value of coverage is **finding untested code paths**, not proving correctness. A utility that parses dates but only has tests for valid inputs has low branch coverage — the error handling path is never exercised.

---

## Coverage in Jest

Jest collects coverage by instrumenting the source code at build time. Running tests with `--coverage` produces a summary in the terminal and detailed reports in `coverage/`:

```
----------|---------|----------|---------|---------|
File      | % Stmts | % Branch | % Funcs | % Lines |
----------|---------|----------|---------|---------|
health... |   85.71 |      100 |     100 |   85.71 |
----------|---------|----------|---------|---------|
```

The coverage directory contains:
- `coverage/lcov.info` — machine-readable format consumed by Codecov
- `coverage/lcov-report/index.html` — human-readable HTML report

In this repo, coverage is configured in `apps/api/package.json`:

```json
"jest": {
  "collectCoverageFrom": [
    "**/*.(t|j)s",
    "!main.ts",           // bootstrap entry point — not unit-testable
    "!instrument.ts",     // Sentry init — runs at process start, not testable in isolation
    "!**/*.module.ts",    // NestJS module wiring — no logic, just DI declarations
    "!prisma/**"          // generated client — not your code
  ],
  "coverageDirectory": "../coverage"
}
```

### Why exclude these files?

Including infrastructure files in coverage metrics distorts the numbers and creates perverse incentives. `main.ts` calls `NestFactory.create()` — there is nothing to unit-test there. `*.module.ts` files are pure DI declarations with no branching logic. Counting them as "uncovered" would pressure you to write meaningless tests just to improve the percentage, rather than testing actual business logic.

The rule of thumb: exclude files where the only meaningful test is "does the app boot?" (answered by e2e tests) or "is the import correct?" (answered by TypeScript).

---

## What is Codecov?

Codecov is a cloud service that stores coverage reports over time and adds coverage analysis to your GitHub PR workflow. After every CI run, the test job uploads `coverage/lcov.info` to Codecov. Codecov then:

1. **Tracks trends** — coverage percentage over time, so you can see if it's improving or regressing
2. **Posts PR comments** — shows exactly which new lines in the PR are covered or uncovered
3. **Enforces thresholds** — fails the CI check if coverage drops below a configured minimum

### The PR diff comment

This is the most useful feature day-to-day. When you open a PR, Codecov posts a comment like:

```
Coverage Report
────────────────────────────────────────────
Files changed   Coverage  Δ (delta)
────────────────────────────────────────────
src/health.service.ts    100%     +0%
src/entries.service.ts    45%    -12%   ← ⚠ new code without tests
────────────────────────────────────────────
Project coverage:  52.3%  (-2.1%)
Patch coverage:    45.0%  (target: 50%)  ← ⚠ below patch threshold
```

This makes it visible at review time when new code is shipping without tests, without anyone having to manually check.

---

## Uploading Coverage in CI

```yaml
# .github/workflows/ci.yml — test job
- name: Run unit tests with coverage
  run: npx turbo run test -- --runInBand --coverage

- name: Upload coverage to Codecov
  uses: codecov/codecov-action@v6
  with:
    token: ${{ secrets.CODECOV_TOKEN }}
    directory: apps/api/coverage     # where lcov.info lives
    fail_ci_if_error: false          # don't fail CI if Codecov upload fails
```

`fail_ci_if_error: false` is important — if Codecov is temporarily unavailable, you don't want your entire CI pipeline to fail. Coverage upload failure is not a reason to block a deploy.

---

## Coverage Thresholds — `codecov.yml`

```yaml
# codecov.yml (repo root)
coverage:
  status:
    project:
      default:
        target: 30%      # overall project coverage must be at least 30%
        threshold: 2%    # allow up to 2% drop before failing
    patch:
      default:
        target: 50%      # new code in each PR must be at least 50% covered
        threshold: 5%

comment:
  layout: "reach,diff,flags,tree"
  require_changes: true  # only comment if coverage actually changed

ignore:
  - "apps/api/src/main.ts"    # bootstrap entry point — tested by e2e, not unit tests
  - "apps/api/prisma/**"
  - "apps/api/test/**"
```

### Project vs Patch thresholds

**Project threshold (30%):** The overall coverage of the entire codebase. Set low deliberately at this stage because most of the infrastructure code (filters, interceptors, middleware) is not yet unit-tested. This number should be raised as business modules and their tests are added.

**Patch threshold (50%):** The coverage of code introduced in *this specific PR*. This is the more meaningful number — it ensures that new code being added ships with at least half of its lines tested. A developer can't ship a new service with zero tests.

The split is intentional: the project threshold tracks historical debt, the patch threshold enforces discipline going forward.

---

## Interview Summary

**Q: What is code coverage and what does it tell you?**
Coverage measures which lines of code were executed during your test suite. It helps you find untested code paths — functions, branches, error cases that no test ever exercises. It does not measure whether tests are meaningful; a test with no assertions can achieve 100% coverage. The real value is finding blind spots, not proving correctness.

**Q: What is the difference between project coverage and patch coverage?**
Project coverage is the overall percentage across the whole codebase — includes historical code that may have been written before tests were required. Patch coverage measures only the new lines introduced in the current PR. Enforcing patch coverage is more actionable — it ensures new code ships with tests regardless of what the existing codebase looks like.

**Q: Why set a 30% project threshold when ideally you'd want 80%+?**
At bootstrap, most of the infrastructure layer (middleware, filters, interceptors) is not covered by unit tests — they're exercised by e2e tests instead. Setting an unachievable threshold immediately would just make every CI run fail. The threshold is raised incrementally as business modules and their unit tests are added. The patch threshold of 50% is what enforces discipline on new code.
