# Test Design: Epic 2 - Project & Workspace Management

**Date:** 2026-01-13
**Author:** master
**Status:** Draft

---

## Executive Summary

**Scope:** full test design for Epic 2

**Evidence Base Used:**

- PRD: `docs/PRD.md`
- Epic: `docs/epics/epic-2-project-workspace-management.md`
- Architecture: `docs/architecture.md`
- Sprint tracking: `_bmad-output/implementation-artifacts/sprint-status.yaml`
- Existing automated tests:
  - Playwright E2E: `apps/e2e/tests/projects/projects.spec.ts`, `apps/e2e/tests/auth/login.spec.ts`, `apps/e2e/tests/auth/logout.spec.ts`
  - Vitest: `apps/web/src/components/projects/hooks/use-invite-user-search.test.ts`

**Risk Summary:**

- Total risks identified: 12
- High-priority risks (≥6): 4
- Critical categories: SEC, DATA, TECH

**Coverage Summary (Planned Additions / Gaps):**

- P0 scenarios: 8 (16 hours)
- P1 scenarios: 12 (12 hours)
- P2/P3 scenarios: 18 (7 hours)
- **Total effort**: 35 hours (~5 days)

---

## Risk Assessment

### High-Priority Risks (Score ≥6)

| Risk ID | Category | Description | Probability | Impact | Score | Mitigation | Owner | Timeline |
| ------- | -------- | ----------- | ----------- | ------ | ----- | ---------- | ----- | -------- |
| R-001 | SEC | RBAC bypass allows member to perform owner/admin actions (invite, transfer ownership, delete) | 3 | 3 | 9 | Enforce authorization in ORPC context + router guards; add negative tests for each restricted mutation and UI affordance checks | DEV/QA | 2026-01-13 |
| R-002 | DATA | Project deletion (admin) deletes wrong project or leaves orphaned records; soft-delete/hard-delete race | 2 | 3 | 6 | Transactional delete by projectId; foreign key constraints; idempotent delete; add audit logging + E2E confirmation flow tests | DEV/QA | 2026-01-13 |
| R-003 | TECH | Create project not atomic (project created but default statuses missing) | 2 | 3 | 6 | Create project + default statuses in single DB transaction; integration tests for rollback on failure | DEV | 2026-01-13 |
| R-004 | SEC | Membership scoping failure exposes projects to non-members (list or direct navigation) | 2 | 3 | 6 | Membership-based filters on all project queries + route guards; add API and E2E tests for non-member access | DEV/QA | 2026-01-13 |

### Medium-Priority Risks (Score 3-4)

| Risk ID | Category | Description | Probability | Impact | Score | Mitigation | Owner |
| ------- | -------- | ----------- | ----------- | ------ | ----- | ---------- | ----- |
| R-005 | DATA | Duplicate project name per user constraint not enforced consistently (PRD requires unique name per user) | 2 | 2 | 4 | DB unique index + API error mapping; E2E test for duplicate name error message | DEV/QA |
| R-006 | TECH | Ownership transfer not consistent (both users end up owner, or owner loses access unexpectedly) | 2 | 2 | 4 | Transactional role updates; integration tests for role state after transfer | DEV |
| R-007 | OPS | Invitation lookup (email/username) ambiguous; inviting nonexistent user returns incorrect error state | 2 | 2 | 4 | Normalize lookup, clear error codes/messages; add UI and API tests for "user not found" and "already member" | DEV/QA |
| R-008 | PERF | Project list/settings become slow with many projects/members | 1 | 3 | 3 | Add indexes on membership joins; keep payloads minimal; basic query perf checks | DEV |

### Low-Priority Risks (Score 1-2)

| Risk ID | Category | Description | Probability | Impact | Score | Action |
| ------- | -------- | ----------- | ----------- | ------ | ----- | ------ |
| R-009 | BUS | UX copy mismatches spec (toasts, labels), causing minor confusion | 2 | 1 | 2 | Monitor |
| R-010 | OPS | Toast notifications not shown on some errors (non-blocking) | 1 | 2 | 2 | Monitor |
| R-011 | TECH | Minor client-side validation edge case for project key formatting | 1 | 2 | 2 | Monitor |
| R-012 | PERF | E2E flakiness due to async key validation waits | 1 | 2 | 2 | Monitor |

### Risk Category Legend

- **TECH**: Technical/Architecture (flaws, integration, scalability)
- **SEC**: Security (access controls, auth, data exposure)
- **PERF**: Performance (SLA violations, degradation, resource limits)
- **DATA**: Data Integrity (loss, corruption, inconsistency)
- **BUS**: Business Impact (UX harm, logic errors)
- **OPS**: Operations (deployment, config, monitoring)

---

## Test Coverage Plan

### Existing Coverage (Observed)

- Project list renders for authenticated user and shows create button (`apps/e2e/tests/projects/projects.spec.ts`).
- Project creation covered (auto key, custom key, duplicate key, invalid key format).
- Settings access covered (navigate, owner can edit, member read-only, save disabled behavior).
- Auth login/logout covered (`apps/e2e/tests/auth/*.spec.ts`).

### Coverage Gaps (Epic 2)

- Duplicate **project name** behavior (PRD says name unique per user).
- Invitation flows (invite/remove user), membership visibility in list.
- Ownership transfer flow and post-transfer permissions.
- Admin-only delete project flow (safety checks, confirmation input, redirect).
- API-level permission enforcement (403) for restricted operations.

### Coverage Matrix

| Requirement | Test Level | Priority | Risk Link | Test Count | Owner |
| ----------- | ---------- | -------- | --------- | ---------- | ----- |
| Projects list is filtered by membership | API | P0 | R-004 | 2 | DEV/QA |
| Non-member cannot access project (direct URL) | E2E | P0 | R-004 | 1 | QA |
| Restricted actions enforce RBAC (invite, transfer, delete) | API | P0 | R-001 | 4 | QA |
| Create project is atomic and creates default statuses | API | P0 | R-003 | 2 | DEV/QA |
| Duplicate project name rejected per-user | E2E | P1 | R-005 | 1 | QA |
| Invite user adds member and project becomes visible | E2E | P1 | R-007 | 2 | QA |
| Ownership transfer updates roles and permissions | E2E | P1 | R-006 | 2 | QA |
| Admin delete project confirmation + redirect | E2E | P1 | R-002 | 2 | QA |
| Remove member constraints (cannot remove self) | API | P2 | R-007 | 2 | DEV/QA |
| Project settings UI states (disabled, toasts) | Component | P2 | R-009 | 6 | DEV |

### P0 (Critical) - Run on every commit

**Criteria:** Security / data integrity / core workspace access; high-risk (≥6); no workaround.

| Requirement | Test Level | Risk Link | Test Count | Owner | Notes |
| ----------- | ---------- | --------- | ---------- | ----- | ----- |
| Non-member cannot access a project (list + direct URL) | E2E | R-004 | 2 | QA | Validate membership scoping end-to-end |
| Member cannot perform owner actions (invite/transfer/delete) | API | R-001 | 4 | QA | Prefer API tests for deterministic authorization checks |
| Create project is atomic with default statuses | API | R-003 | 2 | DEV/QA | Integration test: failure injection / rollback |

**Total P0**: 8 tests, 16 hours

### P1 (High) - Run on PR to main

**Criteria:** Core workflows; medium/high risk; common usage.

| Requirement | Test Level | Risk Link | Test Count | Owner | Notes |
| ----------- | ---------- | --------- | ---------- | ----- | ----- |
| Duplicate project name shows correct error | E2E | R-005 | 1 | QA | Align error message with PRD |
| Invite user by email/username and user sees project | E2E | R-007 | 3 | QA | Includes "user not found" negative case |
| Transfer ownership updates roles correctly | E2E | R-006 | 2 | QA | Verify UI changes and access after transfer |
| Admin delete project with safety checks | E2E | R-002 | 3 | QA | Confirmation input, redirect, data removed |
| Project list filtered by membership | API | R-004 | 3 | DEV/QA | Contract tests for listProjects |

**Total P1**: 12 tests, 12 hours

### P2 (Medium) - Run nightly/weekly

**Criteria:** Secondary flows, edge cases, non-critical UI.

| Requirement | Test Level | Risk Link | Test Count | Owner | Notes |
| ----------- | ---------- | --------- | ---------- | ----- | ----- |
| Remove member cannot remove self; error states | API | R-007 | 4 | DEV/QA | Deterministic constraints |
| Project settings UI states (toasts, disabled controls) | Component | R-009 | 6 | DEV | Vitest component-level assertions |

**Total P2**: 10 tests, 5 hours

### P3 (Low) - Run on-demand

**Criteria:** Rare cases and flakiness mitigation.

| Requirement | Test Level | Test Count | Owner | Notes |
| ----------- | ---------- | ---------- | ----- | ----- |
| Cross-browser visual sanity for projects list/settings | E2E | 2 | QA | Leverage existing Playwright multi-project setup |
| Key validation retry behaviors | E2E | 6 | QA | Only if flakiness observed |

**Total P3**: 8 tests, 2 hours

---

## Execution Order

### Smoke Tests (<5 min)

**Purpose**: Fast feedback, catch build-breaking issues

- [ ] Authenticated user can reach Projects page (existing)
- [ ] Projects list renders seeded projects (existing)
- [ ] Create project happy path (existing)

**Total**: 3 scenarios

### P0 Tests (<10 min)

**Purpose**: Security + data integrity

- [ ] Non-member access blocked (E2E)
- [ ] Restricted mutations reject unauthorized roles (API)
- [ ] Create project transactionality (API)

**Total**: 8 scenarios

### P1 Tests (<30 min)

**Purpose**: Core workflows

- [ ] Invite user flow (E2E)
- [ ] Ownership transfer flow (E2E)
- [ ] Admin delete project flow (E2E)

**Total**: 12 scenarios

### P2/P3 Tests (<60 min)

**Purpose**: Broader regression and UI polish

- [ ] Member management constraints (API)
- [ ] UI state coverage (component)
- [ ] Cross-browser sanity (E2E)

**Total**: 18 scenarios

---

## Resource Estimates

### Test Development Effort

| Priority | Count | Hours/Test | Total Hours | Notes |
| -------- | ----- | ---------- | ----------- | ----- |
| P0 | 8 | 2.0 | 16 | Authorization + fixtures/seeding |
| P1 | 12 | 1.0 | 12 | End-to-end workflows |
| P2 | 10 | 0.5 | 5 | Smaller API/component coverage |
| P3 | 8 | 0.25 | 2 | Best-effort / stability |
| **Total** | **38** | **-** | **35** | **~5 days** |

### Prerequisites

**Test Data:**

- Reuse existing seeding (`@planner/migrate/seed/projects`) where possible.
- Add helper factories for: project creation, member creation, role assignment, admin user.

**Tooling:**

- Playwright (`apps/e2e`) for E2E coverage; leverage `apps/e2e/playwright.config.ts` multi-browser projects.
- Vitest (`apps/web/vitest.config.ts`) for hooks/components.
- Prefer API-level tests for permissions to reduce flakiness.

**Environment:**

- Local dev server via Playwright `webServer` (already configured).
- Test DB state reset/seed per run to keep tests deterministic.

---

## Quality Gate Criteria

### Pass/Fail Thresholds

- **P0 pass rate**: 100% (no exceptions)
- **P1 pass rate**: ≥95% (waivers required for failures)
- **P2/P3 pass rate**: ≥90% (informational)
- **High-risk mitigations**: 100% complete or approved waivers (R-001..R-004)

### Coverage Targets

- **Critical paths**: ≥80%
- **Security scenarios**: 100% for RBAC and scoping
- **Business logic**: ≥70% (API-level)

### Non-Negotiable Requirements

- [ ] Member/non-member authorization enforced server-side
- [ ] Project deletion is safe and scoped
- [ ] Create project is transactional (project + default statuses)

---

## Mitigation Plans

### R-001: RBAC bypass (Score: 9)

**Mitigation Strategy:** Ensure all privileged operations are guarded in ORPC routers using role checks derived from `project_members` and admin flag; add negative tests that assert 403 for member role.
**Owner:** DEV/QA
**Timeline:** 2026-01-13
**Status:** Planned
**Verification:** API tests for each restricted mutation + E2E checks that UI does not expose actions.

### R-002: Unsafe project deletion (Score: 6)

**Mitigation Strategy:** Transactional delete; explicit confirmation input; ensure cascade/soft-delete behavior matches spec; verify post-delete redirect.
**Owner:** DEV/QA
**Timeline:** 2026-01-13
**Status:** Planned
**Verification:** E2E delete flow + API assertions that project is inaccessible afterward.

---

## Assumptions and Dependencies

### Assumptions

1. Admin identity is represented in a stable way (e.g., user flag) and is accessible in ORPC context.
2. Invitation adds user immediately (no approval workflow), per PRD.
3. Project name uniqueness is enforced at DB level and surfaced as a stable API error.

### Dependencies

1. Reliable test data seeding/reset for Playwright runs.
2. Clear API surface for invite/remove/transfer/delete operations (ORPC routers).

### Risks to Plan

- **Risk**: Hard-to-test admin-only flows without admin fixtures.
  - **Impact**: Gaps in deletion/override coverage.
  - **Contingency**: Add dedicated admin user fixture in `apps/e2e` and seed admin role.

---

## Follow-on Workflows (Manual)

- Run `*atdd` to generate failing P0 tests (separate workflow; not auto-run).

---

## Approval

**Test Design Approved By:**

- [ ] Product Manager: {name} Date: 2026-01-13
- [ ] Tech Lead: {name} Date: 2026-01-13
- [ ] QA Lead: {name} Date: 2026-01-13

**Comments:**

---

## Appendix

### Knowledge Base References

- `_bmad/bmm/testarch/knowledge/risk-governance.md` - Risk classification framework
- `_bmad/bmm/testarch/knowledge/probability-impact.md` - Risk scoring methodology
- `_bmad/bmm/testarch/knowledge/test-levels-framework.md` - Test level selection
- `_bmad/bmm/testarch/knowledge/test-priorities-matrix.md` - P0-P3 prioritization

### Related Documents

- PRD: `docs/PRD.md`
- Epic: `docs/epics/epic-2-project-workspace-management.md`
- Architecture: `docs/architecture.md`

---

**Generated by**: BMad TEA Agent - Test Architect Module
**Workflow**: `_bmad/bmm/testarch/test-design`
**Version**: 4.0 (BMad v6)
