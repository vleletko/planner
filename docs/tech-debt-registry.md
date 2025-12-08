# Tech Debt Registry

**Last Updated:** 2025-12-07
**Purpose:** Centralized tracking of technical debt across all epics

---

## Active Tech Debt

| ID | Item | Source | Epic | Severity | Status |
|----|------|--------|------|----------|--------|
| TD-1-1 | Skipped unverified user E2E test | Story 1-6b | Epic 1 | Low | Open |
| TD-1-2 | Coverage PR comments not implemented | Story 1-6a | Epic 1 | Low | Deferred |
| TD-1-3 | Phase 4 Production Deployment incomplete | Story 1-5 | Epic 1 | Medium | Deferred |

---

## Severity Definitions

| Severity | Definition |
|----------|------------|
| **Critical** | Blocks development or causes production issues |
| **High** | Significantly impacts velocity or code quality |
| **Medium** | Creates friction but has workarounds |
| **Low** | Nice to fix, minimal impact |

## Status Definitions

| Status | Definition |
|--------|------------|
| **Open** | Not yet addressed |
| **In Progress** | Being worked on |
| **Resolved** | Fixed in specific story/PR |
| **Deferred** | Intentionally postponed with rationale |
| **Won't Fix** | Accepted as permanent state |

---

## Tech Debt by Epic

### Epic 1: Foundation & Project Infrastructure

| Item | Story | Issue/Reference | Status |
|------|-------|-----------------|--------|
| Skipped unverified user E2E test | 1-6b | [#13](https://github.com/vleletko/planner/issues/13) | Open |
| Coverage PR comments | 1-6a | Monorepo path complexity | Deferred |
| Phase 4 Production Deployment | 1-5 | Preview deployments working, production deferred | Deferred |

---

## Deferred Items Backlog

### Future Epic: Activity & Audit

| Item | Original Location | Reason for Deferral |
|------|-------------------|---------------------|
| Audit Event Infrastructure | Story 2.4 requirement | No UI = not testable, no user value |
| Activity Feed UI | Story 2.4 implied | Should come with backend |
| Audit events for CRUD operations | Multiple stories | Defer until audit epic |

### Future Epic: Project Lifecycle

| Item | Original Location | Reason for Deferral |
|------|-------------------|---------------------|
| Project Restore from Archive | Story 2.5 | Simplify Epic 3 scope |
| Permanent Deletion (admin) | Story 2.5 | Simplify Epic 3 scope |
| Auto-purge background job | Story 2.5 | Simplify Epic 3 scope |

### Future Epic: Observability Enhancements

| Item | Original Location | Reason for Deferral |
|------|-------------------|---------------------|
| OTLP collector deployment | Epic 1B | Need traffic patterns first |
| Grafana/Jaeger backend | Epic 1B | Can use console export initially |
| Metrics dashboards | Epic 1B | Need data to visualize |
| Alerting configuration | Epic 1B | Need baseline to set thresholds |

---

## Resolution History

| ID | Item | Resolved In | Date | Notes |
|----|------|-------------|------|-------|
| | | | | |

---

*This registry is maintained by the retrospective workflow. Items are aggregated from story Tech Debt sections during each epic retrospective.*
