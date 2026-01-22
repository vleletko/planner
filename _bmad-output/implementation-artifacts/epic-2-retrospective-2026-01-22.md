# Epic 2 Retrospective: Project & Workspace Management

**Date:** 2026-01-22
**Epic:** Epic 2 - Project & Workspace Management
**Facilitator:** Bob (Scrum Master)
**Participant:** master (Project Lead)

---

## Epic Summary

**Goal:** Enable users to create projects, invite team members, and manage role-based access control. Establish the project-based workspace foundation where all workflow configuration and card management happens.

**Stories Completed:** 6/6 (100%)

| Story | Title | Status | Agent |
|-------|-------|--------|-------|
| 2-0 | Epic 2 UX Design | Done | - |
| 2-1 | Project Creation and Basic CRUD | Done | Claude Opus 4.5 |
| 2-2 | Project Access Control and Permissions | Done | GPT-5.2 Codex CLI |
| 2-3 | User Invitation System | Done | GPT-5.2 Codex CLI |
| 2-4 | Ownership Transfer | Done | Claude Opus 4.5 |
| 2-5 | Project Deletion with Safety Checks | Done | Claude Opus 4.5 |

**Technical Highlights:**
- Project CRUD with Jira-style keys (globally unique, immutable)
- Centralized authorization layer (`requireProjectRole`, `requireProjectMember`)
- Better Auth Admin Plugin enabled (system-wide admin role)
- Soft-delete with 30-day restoration window
- Projects list filtering (name search + status filter)
- Comprehensive E2E test coverage (59+ tests across 3 browsers)

---

## What Went Well

### 1. Centralized Authorization Layer
Story 2-2 created reusable authz helpers (`requireProjectRole`, `requireProjectMember`, `permissionDeniedMessage`) that all subsequent stories (2-3, 2-4, 2-5) reused. This "build once, use everywhere" approach accelerated development and ensured consistent permission enforcement.

### 2. Early Investment in Code Quality
Story 2-1 went through 8 code review iterations, establishing high-quality patterns:
- Transaction wrapping for atomicity
- DRY validation extraction
- Race condition handling with constraint errors
- Comprehensive E2E over mocked unit tests for CRUD routers

These patterns were inherited by subsequent stories, improving overall velocity.

### 3. E2E-First Testing Strategy
The decision to prefer E2E tests over mocked unit tests for CRUD routers was validated:
- 59+ E2E tests by end of epic
- Multi-browser coverage (Chromium, Firefox, WebKit)
- Multi-session verification for complex flows (ownership transfer)
- No reported production issues

---

## What Could Be Improved

### 1. E2E Test Suite Runtime
As the test suite grew to 59+ tests, runtime became a concern. Running tests takes significant time, which will only grow with future epics.

**Recommendation:** Research distributed test runners for future scaling.

### 2. E2E Flakiness in Dev Mode
Occasional flaky test failures occurred when running E2E tests against Next.js dev mode under high parallel load. Dev mode has hot reloading, different caching behavior, and less predictable timing.

**Recommendation:** Investigate running E2E tests against production build instead of dev mode.

### 3. Documentation Drift
Story 2-2 noted a mismatch between `docs/architecture.md` (describing global `is_admin`) and the actual implementation (project-level `admin` role). Story 2-5 then added Better Auth Admin Plugin, creating both global and project admins.

**Recommendation:** Update architecture docs with current permission matrix before Epic 3.

---

## Key Discoveries

### 1. Admin Roles Structure (Documented)

The codebase now has two distinct admin concepts:

| Role | Scope | Key Permissions |
|------|-------|-----------------|
| **System Admin** | Global | Access ANY project, delete ANY project, view archived, bypass all checks |
| **Project Owner** | Per-project | Everything within their project + transfer ownership + delete |
| **Project Admin** | Per-project | Edit settings, manage members, but NOT delete/transfer |
| **Project Member** | Per-project | Read-only for settings, future: manage cards/resources |

**Implementation:**
- Global admin: `user.role === "admin"` (Better Auth admin plugin)
- Project roles: `project_members.role` enum (`owner | admin | member`)
- Centralized in: `packages/api/src/lib/authz/project.ts`

### 2. Global vs Project-Scoped Statuses
Discussion revealed a preference for **global statuses** over project-scoped. Current Epic 3 spec assumes project-scoped statuses. This decision will be finalized during Story 3.1 implementation.

**Impact:** May require Epic 3 Story 3.1 schema adjustment.

---

## Technical Debt

See: `_bmad-output/implementation-artifacts/tech-debt-backlog.md`

| Item | Origin | Priority | Target |
|------|--------|----------|--------|
| Default statuses creation | Story 2-1 | Medium | Story 3.1 |
| Project overview page purpose | Story 2-1 | Low | After Epic 3 |
| Hard-delete background job (30-day cleanup) | Story 2-5 | Low | Future infrastructure |
| Architecture docs - permission matrix | Story 2-2, 2-5 | High | Before Epic 3 |

---

## Action Items

| ID | Action Item | Owner | Priority | Target |
|----|-------------|-------|----------|--------|
| **AI-1** | Update `docs/architecture.md` with permission matrix (global admin vs project admin) | Dev | High | Before Epic 3 |
| **AI-2** | Investigate E2E against production build vs dev mode | Dev | Medium | Epic 3 |
| **AI-3** | Research distributed test runners for E2E scaling | Dev | Low | Future |
| **AI-4** | Decide global vs project-scoped statuses in Story 3.1 | Team | High | Story 3.1 |

---

## Previous Retrospective Follow-Up

**Epic 1B Action Items Status:**

| Action Item | Status |
|-------------|--------|
| AI-1: Module Loading Awareness | ✅ Completed - Documented in development-guide.md |
| AI-2: Backend Compatibility Testing | ✅ Completed - Checklist exists |
| AI-3: Continue Workspace Package Pattern | ✅ Completed - `@planner/logger` used successfully |

All 3 action items from Epic 1B were completed successfully.

---

## Epic 3 Readiness

With Epic 2 complete, Epic 3 (Workflow Configuration Engine) can proceed with:

**Dependencies Satisfied:**
- ✅ Project membership and role-based access control
- ✅ Project settings page infrastructure (tabs, navigation)
- ✅ E2E testing patterns established
- ✅ AuthZ helpers ready for reuse

**Preparation Needed:**
- Add "Workflow" tab to project settings
- Decide on global vs project-scoped statuses (Story 3.1)
- Update architecture docs with permission matrix

---

## Overall Rating

**Excellent** - Smooth delivery, good patterns established, ready for Epic 3.

---

## Retrospective Sign-off

**Reviewed by:** master
**Date:** 2026-01-22

---

*Generated during Epic 2 Retrospective facilitated by BMAD workflow*
