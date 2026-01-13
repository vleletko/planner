# Phase 1 Research: Basic CI Pipeline

**Date:** 2025-11-16
**Researcher:** Amelia (Dev Agent)
**Status:** Draft

## Research Questions

- [x] What are the latest GitHub Actions patterns for Bun monorepos (2024-2025)?
- [x] What is the current version of oven-sh/setup-bun GitHub Action?
- [x] How should Turborepo caching be configured in GitHub Actions?
- [x] What workflow triggers should be used (push, pull_request, workflow_dispatch)?
- [x] How do concurrency groups work to cancel outdated runs?
- [x] What are best practices for caching Bun dependencies (bun.lockb)?
- [x] Should lint, typecheck, test, and build run in parallel or sequentially?
- [x] What are best practices for error reporting and annotations?
- [x] What timeout configurations should be used for each stage?

## Findings

### Topic 1: GitHub Actions Setup for Bun Monorepos

**Summary:**
The official `oven-sh/setup-bun` GitHub Action is the recommended approach for setting up Bun in CI/CD. Latest version is v2.0.2 (as of Nov 2024).

**Sources:**
- [oven-sh/setup-bun GitHub Repository](https://github.com/oven-sh/setup-bun)
- [Setup Bun - GitHub Marketplace](https://github.com/marketplace/actions/setup-bun)
- [Bun Official Guide: Install and run Bun in GitHub Actions](https://bun.com/guides/runtime/cicd)

**Key Insights:**
- Use `oven-sh/setup-bun@v2` in workflows
- Action is officially verified by GitHub
- Pin to specific Bun version (`1.3.1`) to match local environment

**Recommendations:**
- Use `oven-sh/setup-bun@v2` with `bun-version: 1.3.1`

---

### Topic 2: Turborepo Caching with GitHub Actions

**Summary:**
Use `rharkor/caching-for-turbo` action for simplified Turborepo caching with GitHub Actions built-in cache. No Vercel account needed.

**Sources:**
- [Turborepo Official Docs: GitHub Actions](https://turborepo.com/docs/guides/ci-vendors/github-actions)
- [rharkor/caching-for-turbo Repository](https://github.com/rharkor/caching-for-turbo)
- [Caching for Turborepo GitHub Action](https://github.com/marketplace/actions/caching-for-turborepo)

**Key Insights:**
- `rharkor/caching-for-turbo` simplifies Turborepo caching setup
- Works with GitHub Actions built-in cache (no Vercel Remote Cache needed)
- Automatically handles `.turbo` directory caching
- No manual cache key configuration required

**Recommendations:**
```yaml
- name: Cache Turborepo
  uses: rharkor/caching-for-turbo@v1.5
```

**Trade-offs:**
- **Pro:** Simple one-line setup, no configuration needed
- **Pro:** No Vercel account dependency
- **Pro:** Works well for self-hosted projects
- **Con:** GitHub Actions cache has 10GB limit and 7-day eviction

---

### Topic 3: Bun Dependency Caching

**Summary:**
Cache `~/.bun/install/cache` with key based on `bun.lockb` hash.

**Sources:**
- [Bun Official Guide: Install dependencies in GitHub Actions](https://bun.sh/guides/install/cicd)
- [actions/cache Repository](https://github.com/actions/cache)

**Key Insights:**
- Bun cache path: `~/.bun/install/cache`
- Cache key should use `hashFiles('**/bun.lockb')`
- Restore keys provide fallback for partial matches

**Recommendations:**
```yaml
- name: Cache Bun dependencies
  uses: actions/cache@v4
  with:
    path: ~/.bun/install/cache
    key: ${{ runner.os }}-bun-${{ hashFiles('**/bun.lockb') }}
    restore-keys: |
      ${{ runner.os }}-bun-
```

---

### Topic 4: Workflow Triggers and Concurrency

**Summary:**
Use `pull_request` and `push` triggers. Concurrency groups with `cancel-in-progress: true` prevent wasteful runs.

**Sources:**
- [GitHub Docs: Control Workflow Concurrency](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency)
- [Blacksmith: Concurrency in GitHub Actions](https://www.blacksmith.sh/blog/protect-prod-cut-costs-concurrency-in-github-actions)

**Key Insights:**
- `cancel-in-progress: true` cancels outdated runs when new commits pushed
- Pattern: `${{ github.workflow }}-${{ github.event.pull_request.number || github.ref }}`
- Can cut GitHub Actions costs by ~10%

**Recommendations:**
```yaml
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  workflow_dispatch:

concurrency:
  group: ${{ github.workflow }}-${{ github.event.pull_request.number || github.ref }}
  cancel-in-progress: true
```

---

### Topic 5: Sequential Verification Steps

**Summary:**
For verification steps (lint, typecheck, build), sequential execution in single job is simpler and faster.

**Sources:**
- [Running GitHub Actions in Parallel and Sequentially - Medium](https://medium.com/@nickjabs/running-github-actions-in-parallel-and-sequentially-b338e4a46bf5)

**Key Insights:**
- Build already validates types work
- Sequential is simpler to debug
- Single job = single cache restore/save (faster)
- Fails fast at first error

**Recommendations:**
Single `verify` job with sequential steps: lint → typecheck → build

**Decision:**
User prefers sequential verification in single job. Future phases will add parallel Docker build job.

---

### Topic 6: Error Reporting

**Summary:**
GitHub Actions automatically annotates errors from Biome and TypeScript. No configuration needed.

**Sources:**
- [GitHub Docs: Workflow Commands](https://docs.github.com/en/actions/using-workflows/workflow-commands-for-github-actions)

**Recommendations:**
- No special configuration needed

---

### Topic 7: Timeouts

**Summary:**
Set reasonable timeouts to catch hung processes.

**Sources:**
- [GitHub Docs: Workflow Syntax - timeout-minutes](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions#jobsjob_idtimeout-minutes)

**Recommendations:**
```yaml
jobs:
  verify:
    timeout-minutes: 15
```

---

## Final Recommendations

### Recommended Workflow Structure:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  workflow_dispatch:

concurrency:
  group: ${{ github.workflow }}-${{ github.event.pull_request.number || github.ref }}
  cancel-in-progress: true

jobs:
  verify:
    name: Verify
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v2
        with:
          bun-version: 1.3.1

      - name: Cache Bun dependencies
        uses: actions/cache@v4
        with:
          path: ~/.bun/install/cache
          key: ${{ runner.os }}-bun-${{ hashFiles('**/bun.lockb') }}
          restore-keys: |
            ${{ runner.os }}-bun-

      - name: Cache Turborepo
        uses: rharkor/caching-for-turbo@v1.5

      - name: Install dependencies
        run: bun install

      - name: Lint
        run: bun run check

      - name: Type check
        run: bun run check-types

      - name: Build
        run: bun run build
```

**Rationale:**
- Sequential verification: lint → typecheck → build
- Single job with single cache restore (faster)
- `rharkor/caching-for-turbo` for simplified Turborepo caching
- Fails fast at first error
- 15 minute timeout

**Expected Performance:**
- First run (cold cache): ~2-4 minutes
- Subsequent runs (warm cache): ~1-2 minutes

---

## Next Steps (Pending User Approval)

### Implementation Tasks:

1. Create `.github/workflows/ci.yml` with recommended structure
2. Verify `check-types` script exists in package.json
3. Test pipeline with various failure scenarios
4. Verify caching works correctly
5. Document CI pipeline in README

---

## User Approval

- [x] User reviewed research findings
- [x] User approved using `rharkor/caching-for-turbo` action
- [x] User prefers sequential verification job
- [ ] Ready to proceed with implementation: **YES/NO**
