# 02 — Dependency Automation

**Phase:** Phase 1 | **Concepts:** Dependabot, Renovate, automated dependency management

---

## The Problem

Every production codebase has dozens or hundreds of npm dependencies. Each one releases updates regularly — bug fixes, security patches, new features. Left unmanaged, dependencies go stale. Six months of accumulated updates become an intimidating batch change. More critically, a known vulnerability in a dependency can sit unpatched for weeks because nobody noticed.

Dependency automation solves this by making updates automatic and continuous rather than manual and periodic.

---

## Dependabot

Dependabot is a GitHub-native tool (free, built into every GitHub repository) that does two distinct jobs.

### Job 1: Security Alerts

Dependabot continuously scans your `package.json` and `package-lock.json` against the **GitHub Advisory Database** — a database of known CVEs (Common Vulnerabilities and Exposures). When it finds a dependency with a known vulnerability, it:

1. Opens a **security alert** in the Security tab of your repo
2. Automatically opens a **pull request** with the minimal version bump that fixes the vulnerability

This is reactive — it responds to known vulnerabilities, not version updates in general.

### Job 2: Dependency Version Updates

When configured in `.github/dependabot.yml`, Dependabot also opens PRs to keep dependencies up to date — not just for security, but for all version updates.

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"              # check root package.json
    schedule:
      interval: "weekly"        # check every Monday
    groups:
      dependencies:
        patterns: ["*"]         # group all updates into one PR
```

Without grouping, Dependabot opens one PR per dependency — easily 20+ PRs per week on an active project. The `groups` configuration collapses related updates into a single PR.

---

## Renovate

Renovate is an open-source tool (free via the Mend hosted app on GitHub) that also opens dependency update PRs, but it is significantly smarter than Dependabot at this specific job.

### How Renovate is Smarter

**Grouping by package family:**

```json
// renovate.json — this repo's config
{
  "packageRules": [
    {
      "matchPackagePatterns": ["^@nestjs/"],
      "groupName": "NestJS packages"        // all @nestjs/* updates in one PR
    },
    {
      "matchPackageNames": ["prisma", "@prisma/client"],
      "groupName": "Prisma"                 // prisma + @prisma/client always together
    }
  ]
}
```

Dependabot would open separate PRs for `@nestjs/common`, `@nestjs/core`, `@nestjs/swagger`, etc. Updating them separately is risky — they must be on the same major version to work together. Renovate understands this and groups them.

**Automerge for safe updates:**

```json
{
  "packageRules": [
    {
      "matchUpdateTypes": ["patch", "minor"],
      "matchDepTypes": ["devDependencies"],
      "automerge": true     // auto-merge minor/patch dev dep updates when CI passes
    }
  ]
}
```

Renovate can automatically merge low-risk updates (patch/minor dev dependencies) without you touching them, as long as CI passes.

**Scheduling:**

Renovate can be configured to open PRs only on certain days or times, preventing a flood of update PRs during busy periods.

---

## How They Work Together

Dependabot and Renovate are **complementary**, not competing:

| | Dependabot | Renovate |
|---|---|---|
| **Security alerts** | ✅ Primary job | ❌ |
| **Security fix PRs** | ✅ | ❌ |
| **Version update PRs** | ✅ (basic) | ✅ (smarter) |
| **Smart grouping** | Limited | ✅ Excellent |
| **Automerge** | Basic | ✅ Configurable |
| **Scheduling** | Basic | ✅ Fine-grained |
| **Monorepo awareness** | Limited | ✅ |

The pattern used in this repo and across many production codebases:
- **Dependabot** handles security scanning and security fix PRs
- **Renovate** handles all version update PRs with intelligent grouping and automerge

You keep both enabled. They don't conflict — Dependabot's security alerts are independent of Renovate's update PRs.

---

## This Repo's Configuration

```yaml
# .github/dependabot.yml — security scanning only
# Dependabot opens security fix PRs automatically
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
```

```json
// renovate.json — version updates with smart grouping
{
  "$schema": "https://docs.renovatebot.com/renovate-schema.json",
  "extends": ["config:recommended"],
  "packageRules": [
    {
      "matchPackagePatterns": ["^@nestjs/"],
      "groupName": "NestJS packages"
    },
    {
      "matchPackageNames": ["prisma", "@prisma/client", "@prisma/adapter-pg"],
      "groupName": "Prisma"
    }
  ]
}
```

---

## Interview Summary

**Q: How do you keep dependencies up to date in production?**
Automated tooling. Renovate opens grouped PRs weekly — all NestJS packages together, Prisma packages together — so updates are low-friction and don't break compatibility. Dependabot runs independently for security: it monitors CVEs and opens targeted fix PRs the moment a vulnerability is published. CI gates every PR, so a bad update is caught before it merges.

**Q: What is a CVE?**
Common Vulnerability and Exposure — a standardised identifier for a publicly known security vulnerability. When a CVE is filed against an npm package you depend on, Dependabot detects it and opens a PR to patch the affected version.

**Q: Why not just use Dependabot for everything?**
Dependabot's version update PRs lack grouping intelligence. On a NestJS project it would open one PR per `@nestjs/*` package, but those packages must be updated together or the app breaks. Renovate understands package families and groups them correctly. Both tools are free, so there's no reason not to use both.
