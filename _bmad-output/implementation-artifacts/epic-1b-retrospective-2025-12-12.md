# Epic 1B Retrospective: Observability

**Date:** 2025-12-12
**Epic:** Epic 1B - Observability
**Facilitator:** Bob (Scrum Master)
**Participant:** BMad

---

## Epic Summary

**Goal:** Establish application observability infrastructure using OpenTelemetry, providing structured logging, request tracing, and error handling before building feature epics.

**Stories Completed:** 4/4

| Story | Title | Status |
|-------|-------|--------|
| 1B.1 | Observability Research & Decision | Done |
| 1B.2 | OpenTelemetry SDK Setup | Done |
| 1B.3 | Structured Logging via OTEL | Done |
| 1B.4 | Error Handling & Spans | Done |

---

## What Went Well

### 1. Research-First Approach Paid Off
Story 1B.1's deep research into OTEL SDK options, Bun compatibility, and runtime implications prevented major implementation issues. **Key finding:** Discovered Bun doesn't support OTEL auto-instrumentation - this saved days of debugging by switching to Node.js runtime proactively.

### 2. Incremental Implementation
Each story built on the previous:
- 1B.1 → Research & runtime decision
- 1B.2 → SDK foundation + auto-instrumentation
- 1B.3 → Structured logging with trace correlation
- 1B.4 → Error handling with span recording

### 3. SigNoz Integration Successful
Production observability achieved with SigNoz self-hosted backend. Traces, logs, and errors all correlated via trace_id.

### 4. Shared Logger Package
Creating `@planner/logger` package with pino + OTEL integration established a reusable pattern across the monorepo.

---

## What Could Be Improved

### 1. Module Loading Order Complexity
Story 1B.4 revealed **critical** complexity around module loading order:
- `@planner/logger` must not be statically imported in `instrumentation.node.ts`
- Pino logger must be created **after** PinoInstrumentation is registered
- Required lazy `require()` calls instead of static imports

**Impact:** 4 bug-fix commits to resolve, required warning comment in code.

### 2. SigNoz Semantic Convention Mismatch
SigNoz expects old OTEL semantic conventions (`http.method`) but we use new ones (`http.request.method`). Workaround needed:
- `OTEL_SEMCONV_STABILITY_OPT_IN=http/dup` for spans
- Manual duplicate attributes for logs (deferred)

### 3. Bun Isolated Linker Issues
Bun's isolated linker creates duplicate package instances, causing type mismatches. Required careful dependency management:
- `@opentelemetry/api` as peerDependency
- Exporting utilities from workspace packages instead of direct deps

---

## Key Technical Discoveries

| Discovery | Impact | Action Taken |
|-----------|--------|--------------|
| Bun doesn't support OTEL auto-instrumentation | Critical - would have broken production observability | Switched to Node.js runtime for production |
| PinoInstrumentation must register before logger creation | Critical - logs missing trace context without lazy loading | Added lazy `require()` pattern + warning comment |
| SigNoz uses legacy OTEL semantic conventions | Medium - attributes not displayed correctly | Set `OTEL_SEMCONV_STABILITY_OPT_IN=http/dup` |
| Bun isolated linker creates duplicate instances | Medium - type mismatches in workspace | Use peerDependencies, export from workspace packages |
| dotenv must load before OTEL SDK | Minor - env vars not available | Added `config()` at top of instrumentation.node.ts |

---

## Technical Debt Created

| Item | Reason | Tracking |
|------|--------|----------|
| Next.js Error Boundaries (error.tsx, global-error.tsx) | Deferred to focus on core OTEL error recording | Future story |
| SigNoz log attribute mapping | Need Log Pipelines config or duplicate attributes | Future story |
| Missing service.instance.id attribute | Incubating OTEL semconv has compatibility issues | Future story |

---

## Action Items (Completed)

### AI-1: Module Loading Awareness ✅
- Documented lazy loading patterns in `docs/development-guide.md` Observability section
- Warning comment exists at top of `instrumentation.node.ts`

### AI-2: Backend Compatibility Testing ✅
- Added "After OTEL Changes" checklist to `docs/development-guide.md`

### AI-3: Continue Workspace Package Pattern ✅
- Documented in `docs/development-guide.md` Observability section
- Pattern already established with `@planner/logger`

---

## Epic 2 Readiness

With observability in place, Epic 2 (Project & Workspace Management) will benefit from:
- ✅ Request tracing visible in SigNoz
- ✅ Structured logs with trace correlation
- ✅ Error recording in spans
- ✅ `x-trace-id` header in error responses

---

## Retrospective Sign-off

**Reviewed by:** BMad
**Date:** 2025-12-12

---

*Generated during Epic 1B Retrospective facilitated by BMAD workflow*
