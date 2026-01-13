# Epic 1 Retrospective

**Date:** 2025-12-07
**Epic:** Epic 1 - Foundation & Project Infrastructure
**Facilitator:** Bob (Scrum Master)
**Participants:** BMad, Alice (Product Owner), Dave (Dev)

---

## Epic Summary

**Goal:** Establish the complete foundation for the Planner application including infrastructure, database, authentication, UI shell, CI/CD pipeline, and testing.

**Stories Completed:** 7/7

| Story | Title | Status |
|-------|-------|--------|
| 1-1 | Project Setup and Infrastructure Initialization | Done |
| 1-2 | Database Setup and Schema Foundation | Done |
| 1-3 | Authentication System Integration | Done |
| 1-4 | Basic UI Shell and Theme System | Done |
| 1-5 | Deployment Pipeline and Environment Configuration | Done |
| 1-6a | Unit Testing Infrastructure | Done |
| 1-6b | E2E Testing Infrastructure | Done |

---

## What Went Well

### Research-First Cycle
The research → document → approve → implement → verify pattern proved highly effective, especially in Story 1-5 (Deployment Pipeline). This approach:
- Prevented jumping into implementation with outdated assumptions
- Ensured decisions were documented with sources
- Gave user approval checkpoints before major work
- Created verifiable baselines for testing

### No Estimation Overhead
Not estimating story points worked well for this exploratory foundational work. The focus was on getting things right rather than hitting arbitrary time targets.

### Manual Intervention Acceptable
Heavy manual intervention during implementation was acceptable for Epic 1 since we were building the tooling itself. Future epics will benefit from the infrastructure established.

### Technical Outcomes
- CI/CD pipeline running on all PRs with preview deployments
- E2E testing against preview environments
- Unit testing with 100% coverage on utility functions
- Docker builds with Turbo cache (30-second builds)
- Database migrations and seeding infrastructure

---

## What Could Be Improved

### Epic Was Too Large
7 stories spanning infrastructure, database, auth, UI, CI/CD, and testing made the epic unwieldy. Feedback loops were too long between retrospectives.

**Suggested smaller epic boundaries:**
- Epic: Initial scaffold + database
- Epic: Authentication
- Epic: CI/CD pipeline
- Epic: Testing infrastructure

### Story Granularity
Story 1-5 (Deployment Pipeline) was really 5 stories disguised as one, with 100+ tasks across phases. Stories with internal "phases" should be split.

### Missing Infrastructure
**Gap discovered:** No application logging/observability infrastructure was included in Epic 1. This is foundational and should have been addressed before deployment pipeline.

---

## Action Items for Future Epics

### AI-1: Epic Sizing Guidelines
- **Maximum 3-5 stories per epic** (with flexibility for foundational work)
- **Complexity-aware counting** - phases/research cycles count as story equivalents
- **2-week timebox** - if epic can't finish in 2 weeks, it's too big
- **More frequent retrospectives** as a result

### AI-2: Story Granularity Standards
- **Split stories with 'phases'** into separate stories
- **15-task threshold** - if a story exceeds 15 tasks, consider splitting
- **Clear 'done' signals** - each story should have atomic acceptance criteria
- **Enables explicit prioritization** of incremental work

### AI-3: Process Documentation
- **Research-first workflow** documented as standard for infrastructure/integration stories:
  1. Research with sources
  2. Document findings
  3. User approval checkpoint
  4. Implement
  5. Verify in real environment
- **Infrastructure story template** with mandatory research tasks and pause points
- **Graduated implementation pattern** - start minimal, add incrementally

### AI-4: Technical Debt & Discovery Tracking
- **Technical debt tracking** - formalize deferred items during retrospectives
- **'Discoveries' section** in story files for unexpected learnings
- **Plan E2E coverage upfront** in epic planning, not as afterthought

---

## Key Technical Learnings from Epic 1

### Story 1-5: Deployment Pipeline
- **Build-reuse pattern** (5-10x faster than Docker-in-Docker) by leveraging Turbo cache
- **Drizzle migration bug** - migration journal in separate `drizzle` schema wasn't being dropped during reset
- **Better Auth password hashing** - specific format required: `${salt}:${hash}` with N=16384, r=16, p=1
- **turbo.json outputs** - must include `.next/**` for build-reuse pattern to work

### Story 1-6a: Unit Testing
- **Bun test runner** - zero dependencies, 10-20x faster than Jest, Jest-compatible API
- **Coverage PR comments deferred** - monorepo path complexity prevented mature solutions

### Story 1-6b: E2E Testing
- **WebKit flakiness** - required `loginAndExpectDashboard()` with `networkidle` wait
- **Console error detection** - layered fixture architecture evolved through multiple review rounds
- **UI discovery via DevTools MCP** - helped discover actual element selectors

---

## Epic Resequencing

Based on the gap discovered (missing observability), epics have been resequenced:

| Original | New | Epic Name | Status |
|----------|-----|-----------|--------|
| Epic 1 | Epic 1 | Foundation & Project Infrastructure | Complete |
| - | **Epic 1B** | **Observability (NEW)** | Not Started |
| Epic 2 | Epic 2 | Project & Workspace Management | Not Started |

---

## New Epic 1B: Observability

**Goal:** Establish application observability infrastructure using OpenTelemetry.

**Approach:** OpenTelemetry from day 1 (hybrid - console exporter for dev, OTLP-ready for prod)

| Story | Title | Scope |
|-------|-------|-------|
| 1B.1 | Observability Research & Decision | Compare OTEL libraries, exporters, backends; document findings; user approval |
| 1B.2 | OpenTelemetry SDK Setup | Implement chosen approach, auto-instrumentation |
| 1B.3 | Structured Logging via OTEL | Log API, correlation, log levels |
| 1B.4 | Error Handling & Spans | Error boundaries, exception recording |

### Story 1B.1 Research Topics
- OTEL SDK: `@opentelemetry/sdk-node` vs `@vercel/otel` vs manual setup
- Auto-instrumentation: Next.js, Drizzle/Postgres, fetch, ORPC
- Log Bridge: pino + OTEL bridge vs native OTEL Logs API
- Exporters: Console (dev) vs OTLP (prod) vs vendor-specific
- Backends: Self-hosted (Jaeger, SigNoz) vs SaaS (Grafana Cloud) vs defer
- Collector: Sidecar vs gateway vs direct export

### Deferred Observability Work
- OTLP collector deployment
- Grafana/Jaeger backend setup
- Metrics dashboards
- Alerting configuration

---

## Epic 2: Project & Workspace Management

**Goal:** Enable users to create projects, invite team members, and manage role-based access control.

| Story | Title | Scope |
|-------|-------|-------|
| 2.1 | Project Creation and Basic CRUD | Create/edit projects, default statuses |
| 2.2 | Project Access Control and Permissions | RBAC middleware (Owner/Admin/Member) |
| 2.3 | User Invitation System | Invite/remove members |
| 2.4 | Ownership Transfer | Transfer ownership (no audit logging) |
| 2.5 | Project Archive (Soft Delete) | Archive projects, 30-day grace period |

### Scope Changes from Original Epic 2

**Removed from Story 2.4:**
- "Activity log records ownership transfer" - deferred to Audit epic
- "Log transfer event in activity history" - deferred to Audit epic

**Removed from Story 2.5:**
- Project Restore from Archive - deferred
- Permanent Deletion (admin manual) - deferred
- Auto-purge background job (30-day cleanup) - deferred

---

## Deferred Items Backlog

### Future Epic: Activity & Audit
| Item | Original Location | Reason for Deferral |
|------|-------------------|---------------------|
| Audit Event Infrastructure | Story 2.4 requirement | No UI = not testable, no user value |
| Activity Feed UI | Story 2.4 implied | Should come with backend |
| Audit events for CRUD operations | Multiple stories | Defer until audit epic |

**Decision:** Audit logging will be implemented as a complete feature (backend + UI) in a dedicated epic when needed. Building backend without UI violates YAGNI.

### Future Epic: Project Lifecycle
| Item | Original Location | Reason for Deferral |
|------|-------------------|---------------------|
| Project Restore from Archive | Story 2.5 | Simplify Epic 2 |
| Permanent Deletion (admin) | Story 2.5 | Simplify Epic 2 |
| Auto-purge background job | Story 2.5 | Simplify Epic 2 |

### Future Observability Enhancements
| Item | Reason for Deferral |
|------|---------------------|
| OTLP collector deployment | Need traffic first |
| Grafana/Jaeger backend | Need traffic first |
| Metrics dashboards | Need baseline data |
| Alerting configuration | Need to understand patterns |

---

## Technical Debt Created

| Item | Story | Issue/Reference |
|------|-------|-----------------|
| Skipped unverified user E2E test | 1-6b | [#13](https://github.com/vleletko/planner/issues/13) |
| Coverage PR comments | 1-6a | Monorepo path complexity |
| Phase 4 Production Deployment | 1-5 | Deferred (preview deployments working) |

---

## Retrospective Sign-off

**Reviewed by:** BMad
**Date:** 2025-12-07

**Next Steps:**
1. ~~Update Epic 2 file to be Observability epic~~ → Created Epic 1B for Observability
2. ~~Rename current Epic 2 to Epic 3~~ → Epic 2 remains as Project & Workspace Management
3. Update Story 2.4 to remove audit logging requirements
4. Update Story 2.5 to remove restore/delete/auto-purge
5. Begin Epic 1B (Observability) with Story 1B.1 research

---

*Generated during Epic 1 Retrospective facilitated by BMAD workflow*
