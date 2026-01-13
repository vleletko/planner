# System-Level Test Design (Current Strategy)

**Project:** planner
**Date:** 2026-01-13
**Author:** master

## Testing Philosophy

- **Write tests only when they reduce meaningful risk.** We do not add tests just to increase counts.
- **E2E is the primary way we validate features.** Playwright tests cover user-visible behavior and end-to-end wiring.
- **Unit tests are secondary and selective.** Add them for pure logic that is expensive/risky to validate via UI (e.g., parsing/validation utilities, instrumentation utilities).
- **Integration/API tests are optional.** Add them only for high-risk server invariants that are hard to catch reliably via E2E (e.g., authorization edge cases, transactionality), and only when the ROI is clear.

---

## Evidence Base

- PRD: `docs/PRD.md`
- Architecture: `docs/architecture.md`
- Epics: `docs/epics/index.md`
- Implementation tracking: `_bmad-output/implementation-artifacts/sprint-status.yaml`
- Existing tests:
  - E2E: `apps/e2e/tests/**/*.spec.ts` (Playwright)
  - Unit/Component: `apps/web/**/*.test.ts`, `packages/api/**/*.test.ts` (Bun/Vitest)
  - Storybook interaction tests: `apps/web/vitest.config.ts` (storybook addon)

---

## Coverage Targets Are Not Goals

- Coverage % is a **diagnostic signal**, not a deliverable.
- We do not add tests to “hit a number”. If coverage drops, we only react when it indicates a **real risk** in critical codepaths.
- The goal is **fast, reliable confidence** in user-facing behavior and high-risk invariants.

---

## Current Test Stack (What We Actually Run)

### E2E (Primary)

- Playwright E2E runs on PRs against a deployed preview environment: `.github/workflows/ci.yml:253`.
- E2E is structured with fixtures + POMs and has built-in console error detection:
  - Fixtures: `apps/e2e/src/fixtures/test.fixture.ts`, `apps/e2e/src/fixtures/console.fixture.ts`
  - POMs: `apps/e2e/src/poms/*.ts`
  - Console enforcement: `apps/e2e/src/utils/console-errors.ts`

### Unit / Utility Tests (Selective)

- Example of the kind of unit tests we keep: observability/correlation utilities:
  - `apps/web/src/instrumentation.utils.test.ts`

---

## Practical Quality Bar (Minimal but Real)

### E2E Quality Rules

- Prefer deterministic waits (`waitForURL`, `waitForResponse`, explicit UI state) over time-based sleeps.
- Keep tests focused on **user-visible outcomes**, not implementation details.
- Use stable selectors (role/label/text patterns, POM encapsulation).
- Avoid flaky control-flow patterns where possible; if `try/catch` is used, it must be narrowly scoped and justified (e.g., optional spinner that may not appear).

### Unit Test Quality Rules

- Add unit tests only for:
  - Pure functions / deterministic utilities.
  - Cross-cutting concerns where failure is costly (e.g., instrumentation headers, error mapping).
- Do not unit-test UI flows that are already covered via E2E.

---

## Test Levels Strategy (Aligned to Current Approach)

### Primary Coverage: E2E Feature Tests

- Critical user journeys (auth, project selection, core flows).
- Feature validation end-to-end in the deployed preview environment.

### Selective Coverage: Unit Tests

- Validation helpers and utilities.
- Observability helpers (e.g., correlation headers) and other high-leverage low-flake areas.

### Optional Coverage: API/Integration Tests

Only add if one of these is true:

- The bug class is **security/data integrity** and E2E is unlikely to catch it reliably.
- The E2E reproduction is consistently flaky/slow.
- The invariant is server-side and can be asserted deterministically.

---

## NFR Testing Approach (Right-Sized)

### Security

- Baseline security confidence comes from:
  - E2E coverage of critical protected flows.
  - Review discipline around server-side authz.
- If a security invariant keeps regressing or is high-risk, add a targeted server-side test (API/integration) rather than expanding E2E complexity.

### Performance

- We do not maintain dedicated load testing (k6) by default.
- Performance is validated via:
  - Observational checks during development.
  - Regression awareness (e.g., “this page got slower”) and follow-up profiling when needed.

### Reliability

- Keep E2E deterministic and small to avoid flake.
- Prefer E2E that asserts outcomes and uses stable waiting strategies.

### Maintainability

- Centralize E2E test patterns in fixtures and POMs.
- Keep tests readable and intention-revealing; avoid over-engineering.

---

## Test Environment Requirements (Current Reality)

- E2E assumes a working preview environment and known seeded users.
- Seeded users are defined in `@planner/migrate` and referenced by fixtures:
  - `apps/e2e/src/fixtures/auth.fixture.ts`

---

## When to Add More Tests (Decision Checklist)

Add a new test when it answers “yes” to at least one:

- Will this catch a real regression we’re likely to repeat?
- Is the failure mode expensive (security/data loss/major user impact)?
- Is the test deterministic and cheap to maintain?
- Is E2E too slow/flaky to cover this reliably?

If the answer is “no” across the board, skip the test.
