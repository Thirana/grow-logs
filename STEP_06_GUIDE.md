# Step 06 — GitHub Actions CI: Complete Implementation Guide

Everything you need to know before, during, and after the agent implements this step.
Delete this file once CI is green and branch protection is configured.

---

## Overview of What Gets Created

One file: `.github/workflows/ci.yml`

That file tells GitHub to run a job on every push and PR to `main` that:
1. Spins up Ubuntu + Node 24
2. Spins up a PostgreSQL 16 service container
3. Runs `npm ci`, migrations, format check, lint, typecheck, build, unit tests, e2e tests

Nothing else. No external service required except GitHub itself.

---

## Part 1 — Before You Tell the Agent to Implement

### Step A: Decide public vs private repo (read limitations section first)

Your repo is currently at `https://github.com/Thirana/grow-logs`.
Check whether it is public or private — it affects how many free CI minutes you get.
You don't need to change anything. Just know which it is before reading the limits below.

### Step B: Set up Vercel Remote Cache (optional but recommended)

This is the cache that makes CI skip rebuilding unchanged packages. Without it, CI still works — it just rebuilds everything each run. Takes about 5 minutes to set up.

**1. Create a Vercel account** if you don't have one: https://vercel.com
   - Free tier is sufficient. You do not need to deploy anything to Vercel.
   - Vercel is used here only as a cache host for Turborepo build artifacts.

**2. Install the Vercel CLI locally:**
```bash
npm install -g vercel
```

**3. Log in:**
```bash
npx turbo login
```
This opens a browser, asks you to authorise with Vercel, and writes a token to `~/.turbo/config.json`.

**4. Link the repo to Vercel's remote cache:**
```bash
# Run from the grow-logs repo root
npx turbo link
```
This asks which Vercel team/account to link to. Select your personal account or team.
It writes a `turbo.json` update and/or a `.turbo/config.json` file locally.

**5. Get your TURBO_TOKEN (Vercel Access Token):**
- In the Vercel dashboard, click your profile avatar (top right)
- Go to **Settings** → **Tokens**
- Click **Create Token** → name it `grow-logs-ci` → set scope to **Full Account** → set expiry to **No Expiration**
- Copy the token immediately — Vercel only shows it once

**6. Get your TURBO_TEAM (team slug, NOT team ID):**

Per the [official Vercel docs](https://vercel.com/docs/monorepos/remote-caching), `TURBO_TEAM` must be the **slug** of your Vercel team — not the `teamId` from `.turbo/config.json`.

Your team slug is your Vercel username or team name as it appears in the dashboard URL:
`https://vercel.com/<your-slug>/...`

For a personal account this is just your Vercel username. You can confirm it by looking at your Vercel dashboard URL after logging in.

> **Note on `.turbo/config.json`:** This file contains a `teamId` (starts with `team_`).
> That is the internal Vercel team identifier — it is **not** what `TURBO_TEAM` expects.
> `TURBO_TEAM` must be the human-readable slug, e.g. `thirana` not `team_xxxx`.

**7. Add both as GitHub Secrets:**
- Go to: `https://github.com/Thirana/grow-logs/settings/secrets/actions`
- Click **New repository secret** and add:

| Name | Value |
|---|---|
| `TURBO_TOKEN` | the access token created in Vercel Settings → Tokens |
| `TURBO_TEAM` | your Vercel team/account slug (e.g. `thirana`, visible in your dashboard URL) |

> If you skip this entirely, just do not add these secrets and tell the agent
> "skip the Turborepo remote cache". The CI workflow will run without caching.
> You can add it later at any time — just add the secrets and they are picked up
> on the next run.

### Step C: Nothing else required before the agent

No Postgres setup, no environment secrets for the app itself — the CI workflow
spins up its own throwaway Postgres container and sets `DATABASE_URL` internally.

---

## Part 2 — Tell the Agent to Implement

Once the secrets are added (or you've decided to skip caching), tell the agent:

```
Read CLAUDE.md and docs/phases/backend/mvp/steps/step-06-github-actions-ci.md
and implement everything described.
```

If you skipped the Vercel remote cache setup, add:
```
Skip the Turborepo remote cache configuration — do not include TURBO_TOKEN
or TURBO_TEAM in the workflow.
```

The agent will create `.github/workflows/ci.yml` and nothing else.

---

## Part 3 — After the Agent Implements

### Step A: Push to GitHub

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add GitHub Actions CI pipeline"
git push
```

### Step B: Watch the first run

1. Go to `https://github.com/Thirana/grow-logs/actions`
2. You should see a workflow run appear within 30 seconds of the push
3. Click into it to watch the steps run in real time
4. The first run typically takes 2–4 minutes

### Step C: Verify it goes green

All steps must pass:
- `npm ci` — installs deps
- `prisma migrate deploy` — applies migrations to the CI Postgres
- `format:check` — formatting
- `lint` — ESLint
- `typecheck` — TypeScript
- `build` — nest build
- `npm test` — unit tests
- `npm run test:e2e` — e2e tests against the real CI Postgres

If it fails, click the failing step to see the logs. Common first-run failures are
covered in the troubleshooting section below.

### Step D: Add the status badge to README (optional but professional)

Open `README.md` and add this below the project description:

```md
![CI](https://github.com/Thirana/grow-logs/actions/workflows/ci.yml/badge.svg)
```

### Step E: Enable branch protection on main (do this after CI is green)

This is the step that makes CI actually enforce quality — without it, you can
merge even if CI is red.

1. Go to: `https://github.com/Thirana/grow-logs/settings/branches`
2. Click **Add branch protection rule**
3. Branch name pattern: `main`
4. Enable these options:
   - ✅ **Require a pull request before merging**
     - ✅ Require approvals: 0 (solo project — you don't need a reviewer)
   - ✅ **Require status checks to pass before merging**
     - Search for and select the `ci` job (it appears after the first successful run)
     - ✅ Require branches to be up to date before merging
   - ✅ **Do not allow bypassing the above settings**
5. Click **Save changes**

After this, every future push to `main` via a PR must have a green CI run before it can be merged.

> **Note:** You can still push directly to `main` without a PR unless you also enable
> "Restrict pushes that create files" or work via PRs consistently. For a solo project,
> branch protection on PRs is enough.

---

## Part 4 — How to Verify the Step is Fully Working

Run through this checklist:

- [ ] `https://github.com/Thirana/grow-logs/actions` shows a completed run
- [ ] All steps in the run are green (no yellow warning, no red X)
- [ ] The job name `ci` appears in the list of available status checks in branch protection settings
- [ ] If you push a branch with a deliberate TypeScript error, the CI run goes red on the `typecheck` step
- [ ] If Turborepo remote cache is set up: on the second run, you should see "FULL TURBO" or cache hit messages in the build step output

---

## Part 5 — Limitations to Know

### GitHub Actions — free tier

| Repo type | Free minutes per month | What counts |
|---|---|---|
| **Public repo** | Unlimited | Linux runners are free, always |
| **Private repo** | 2,000 minutes/month | Linux runners count at 1x |

Each CI run for this project takes roughly **2–4 minutes** on the first run,
dropping to **1–2 minutes** with Turborepo caching.

On a private repo with 2,000 free minutes:
- 2,000 ÷ 3 minutes = ~666 runs per month before you hit the limit
- That's more than 20 pushes a day — you will not hit this limit on a solo project

If you go over, GitHub charges $0.008 per minute for Linux runners. It sends an
email warning before charging.

**Check your current usage:**
`https://github.com/settings/billing` → Actions

### GitHub Actions — other limits

| Limit | Value |
|---|---|
| Max job duration | 6 hours |
| Max workflow run duration | 35 days |
| Concurrent jobs (free) | 20 (Linux) |
| Artefact storage (free) | 500 MB |
| Artefact retention | 90 days |

None of these will affect this project.

### Vercel Remote Cache — free tier

| Limit | Value |
|---|---|
| Cache size | Unlimited on free hobby plan |
| Cache retention | Artifacts expire after 7 days of no access |
| Team members | 1 (personal account) |

If the cache expires (e.g. you don't push for a week), Turborepo just rebuilds
and re-caches on the next run. No action needed — it self-heals.

**Important:** Vercel remote cache is for **build artifacts only** — compiled
TypeScript output, cached test results, etc. It is not connected to your database,
your app deployment, or anything else. It is purely a CI speed optimisation.

### PostgreSQL service in CI

The CI workflow spins up a `postgres:16-alpine` container as a service.
This container:
- Starts fresh every run — no data persists between runs
- Has no connection outside the job — it is not accessible from the internet
- Is torn down when the job finishes

This means:
- `prisma migrate deploy` runs on every CI push (applies from scratch each time)
- `prisma db seed` does NOT run in CI — it is not needed because e2e tests
  don't depend on seed data
- The database name, user, and password in the CI workflow must match what
  `DATABASE_URL` is set to in the workflow env vars

### What CI does NOT do (by design)

| Thing | Why CI doesn't do it |
|---|---|
| Deploy the app | Deployment is a separate concern (CD, not CI) |
| Run `prisma db seed` | E2E tests are self-contained and don't need seed data |
| Check code coverage thresholds | Not configured yet — can be added with Codecov later (Step 06 mentions this) |
| Run load tests | k6 load tests are a post-MVP concern |
| Scan for CVEs | Dependabot handles this separately |

### Public vs private repo — what changes

If your repo is **public**:
- CI minutes are unlimited
- Anyone can see your workflow runs and logs
- Make sure no secrets are logged — GitHub Actions masks registered secrets but
  you must never `echo $SECRET` in a step

If your repo is **private**:
- CI minutes count against your 2,000/month limit
- Only you (and collaborators) can see workflow runs
- No other differences for this project

---

## Part 6 — Troubleshooting Common First-Run Failures

### "Cannot find module" or build fails

Usually means `npm ci` cached an incomplete install.
**Fix:** Re-run the job. If it fails again, check that `package-lock.json` is committed.

### PostgreSQL connection refused in e2e tests

The e2e job may have started before Postgres is ready.
**Fix:** The workflow should include a health check wait before running tests.
Tell the agent to add a `pg_isready` wait step if this happens.

### "No pending migrations" but migration step fails

Means `DATABASE_URL` in the workflow doesn't match the Postgres service config.
**Fix:** Ensure the service container env vars and the `DATABASE_URL` in the
workflow environment use the same database name, user, and password.

### TURBO_TOKEN secret not found

If you set up Vercel caching but the secret name has a typo.
**Fix:** Go to `Settings → Secrets → Actions` and verify the exact name is
`TURBO_TOKEN` (uppercase, underscore).

### CI passes but branch protection doesn't show the `ci` check

Branch protection requires at least one completed run before the check name
appears in the dropdown.
**Fix:** Wait for the first successful run, then go back and configure branch protection.
