# Step 03 — Dependency Automation

**Phase:** Phase 1 — Turborepo Monorepo Scaffold
**Depends on:** Step 01

---

## What

Add three config files that automate dependency management and CI caching. No code changes. No new packages installed. Only configuration files committed to the repo.

---

## Why

Dependency rot is one of the most common ways a production codebase quietly accumulates security vulnerabilities and technical debt. Setting up automation at the very start means every dependency update and every CVE is caught automatically — you never have to manually audit `package.json` files.

**Doing this in Step 03 instead of later:** These are config files only. They take 10 minutes to add now and save hours of manual updates later. Waiting until later means the first few weeks of development accumulate unreviewed dependency drift.

---

## Deliverables

**`.github/dependabot.yml`**

Configure Dependabot to scan npm packages weekly across all workspaces and open grouped security-fix PRs. Dependabot uses the GitHub Advisory Database — its strength is CVE alerts with automatic fix PRs.

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: npm
    directory: /
    schedule:
      interval: weekly
    groups:
      dependencies:
        patterns: ["*"]
```

**`renovate.json`**

Configure Renovate Bot for intelligent version update PRs. Renovate understands monorepos and groups related packages (e.g. all `@nestjs/*` into one PR, all `prisma` + `@prisma/client` together). It automerges patch updates and opens draft PRs for major versions.

Key config:
- `extends: ["config:recommended"]` — sensible defaults
- Group `@nestjs/*` packages together
- Group `prisma` + `@prisma/client` together (they must always be on the same version)
- Automerge patch and minor dev dependency updates
- Require manual review for major updates and all runtime dependency updates

**`.github/workflows/` note:**

Turborepo Remote Cache is enabled via an environment variable in GitHub Actions (`TURBO_TOKEN` and `TURBO_TEAM`), not a config file. Add a note in the repo README or a comment in `turbo.json` that remote caching requires these secrets to be set in the GitHub repository settings. The actual GitHub Actions workflow is created in Step 06.

---

## Key Decisions

**Renovate for updates, Dependabot for security alerts:** These tools complement each other. Renovate is better at grouping, scheduling, and automerging updates. Dependabot is better at CVE detection and opening targeted security fix PRs. Running both gives full coverage.

**Grouping `prisma` + `@prisma/client`:** These two packages must always be on the same version. Without grouping, Renovate might update one but not the other, breaking the Prisma client generation.

**Weekly cadence:** Daily dependency PRs create noise. Weekly is enough to stay current without overwhelming your PR queue.

---

## Done When

- `.github/dependabot.yml` exists and is valid YAML
- `renovate.json` exists and passes `renovate-config-validator` check
- Renovate Bot GitHub App is installed on the repository
- Dependabot alerts are visible in the GitHub repository Security tab
