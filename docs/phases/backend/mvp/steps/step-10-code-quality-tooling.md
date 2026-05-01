# Step 10 — Code Quality Tooling

**Phase:** Phase 2 — NestJS Bootstrap + Prisma Schema
**Depends on:** Step 06 (GitHub Actions CI must exist to wire Codecov into it)

---

## What

Add two lightweight code quality tools to the existing ESLint and CI setup: `eslint-plugin-security` for static security linting, and Codecov for test coverage tracking. Both are wired into the existing toolchain — no new services to run locally.

---

## Why

**`eslint-plugin-security`:** Catches common Node.js security mistakes that TypeScript and standard ESLint rules miss — things like using `eval()`, unsafe regular expressions (ReDoS vulnerability), unvalidated redirect targets, and `child_process.exec` with unsanitised input. These run in your existing `npm run lint` step, so there is zero overhead.

**Codecov:** Makes test coverage a visible, tracked metric rather than something you check manually when you remember. The GitHub PR comment shows exactly which new lines of code are covered or uncovered, making it easy to spot missing tests during code review. Coverage trends over time show if the project is maintaining discipline as it grows.

---

## Deliverables

**`eslint-plugin-security`:**

Install:
```bash
npm install -D eslint-plugin-security
```

Update `eslint.config.mjs` to add the plugin:
```js
import security from 'eslint-plugin-security';

export default tseslint.config(
  // ... existing config
  security.configs.recommended,
);
```

**`codecov.yml`** at repo root:
```yaml
coverage:
  status:
    project:
      default:
        target: 70%
        threshold: 2%
    patch:
      default:
        target: 80%
```

This sets a minimum 70% overall coverage and 80% coverage on changed lines in a PR. Adjust thresholds as the codebase grows.

**`.github/workflows/ci.yml` update:**
The `test` job (added in Step 06) already runs `--coverage`. Add the Codecov upload step after tests pass:
```yaml
- name: Upload coverage to Codecov
  uses: codecov/codecov-action@v4
  with:
    token: ${{ secrets.CODECOV_TOKEN }}
    fail_ci_if_error: false
```

`fail_ci_if_error: false` means a Codecov upload failure does not block the pipeline — coverage tracking is useful but not a hard gate.

**`apps/api/package.json` Jest config update:**
```json
{
  "jest": {
    "collectCoverageFrom": [
      "src/**/*.ts",
      "!src/main.ts",
      "!src/instrument.ts",
      "!src/tracing.ts",
      "!src/**/*.module.ts",
      "!src/prisma/**"
    ]
  }
}
```

Exclude bootstrap files and module wiring from coverage — these are infrastructure, not business logic.

---

## Key Decisions

**`fail_ci_if_error: false` on Codecov:** If the Codecov service is down or the upload times out, the CI pipeline should still pass. Coverage tracking is a quality aid, not a hard gate. The `codecov.yml` thresholds handle the actual gate.

**70% project coverage threshold:** Starting at 70% gives room to write code without a test for every single bootstrap file, while still enforcing meaningful coverage on business logic. Raise it as the codebase matures.

**Excluding `*.module.ts` and `main.ts`:** These files are NestJS wiring — they contain almost no testable logic. Including them in coverage metrics creates noise and makes the overall percentage misleadingly low.

---

## Done When

- `npm run lint` catches a deliberate `eval('test')` added to a source file
- Codecov receives a coverage report from the CI pipeline
- The Codecov PR comment appears on a test pull request
- `npm run lint` still passes on the existing codebase (no false positives from the security plugin)
