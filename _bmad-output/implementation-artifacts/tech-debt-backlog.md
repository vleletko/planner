# Technical Debt Backlog

This file tracks technical debt items across the project. Items are added during retrospectives and resolved during implementation.

---

## Active Items

### TD-001: Default Statuses Creation
- **Origin:** Epic 2, Story 2-1
- **Description:** Default statuses (Backlog, In Progress, Done) should be created when a new project is created. Currently deferred to Epic 3 Story 3.1 when statuses table is implemented.
- **Priority:** Medium
- **Target:** Story 3.1 (Status Management)
- **Status:** Open

---

### TD-002: Project Overview Page Purpose
- **Origin:** Epic 2, Story 2-1
- **Description:** `/projects/[projectId]` currently shows an empty placeholder. The page provides little value since there's no project-scoped data to display yet. Need to decide what meaningful content to show (project-level resources, activity, filtered board view).
- **Priority:** Low
- **Target:** After Epic 3 (depends on statuses/card types decision)
- **Status:** Open
- **Related:** Global vs project-scoped statuses decision

---

### TD-003: Hard-Delete Background Job
- **Origin:** Epic 2, Story 2-5
- **Description:** Soft-delete with 30-day restoration window is implemented, but there's no background job to permanently delete projects after 30 days.
- **Priority:** Low
- **Target:** Future infrastructure epic
- **Status:** Open
- **Notes:** Requires background job infrastructure (cron, queue system)

---

### TD-004: Architecture Docs - Permission Matrix
- **Origin:** Epic 2, Stories 2-2, 2-5
- **Description:** `docs/architecture.md` is out of sync with actual implementation. Need to document:
  - Global admin role (Better Auth admin plugin, `user.role === "admin"`)
  - Project roles (`owner | admin | member`)
  - Complete permission matrix showing what each role can do
- **Priority:** High
- **Target:** Before Epic 3 starts
- **Status:** Open
- **Action Item:** AI-1 from Epic 2 Retrospective

---

### TD-005: E2E Test Suite Optimization
- **Origin:** Epic 2 Retrospective
- **Description:** E2E test suite (59+ tests) takes significant time to run. As more tests are added, this will become a bottleneck.
- **Priority:** Low
- **Target:** Future
- **Status:** Open
- **Potential Solutions:**
  - Distributed test runners (Playwright sharding)
  - Run against production build instead of dev mode
  - Selective test execution based on changed files

---

### TD-006: E2E Flakiness in Dev Mode
- **Origin:** Epic 2, Story 2-5, Retrospective
- **Description:** Occasional flaky test failures when running E2E tests against Next.js dev mode under high parallel load. Suspected causes: hot reloading, caching differences, timing issues.
- **Priority:** Medium
- **Target:** Epic 3
- **Status:** Open
- **Action Item:** AI-2 from Epic 2 Retrospective

---

## Resolved Items

_No resolved items yet._

---

## Item Template

```markdown
### TD-XXX: [Title]
- **Origin:** [Epic/Story where debt was created]
- **Description:** [What the debt is and why it exists]
- **Priority:** High | Medium | Low
- **Target:** [When to resolve - specific story or "Future"]
- **Status:** Open | In Progress | Resolved
- **Notes:** [Additional context]
```

---

*Last updated: 2026-01-22*
