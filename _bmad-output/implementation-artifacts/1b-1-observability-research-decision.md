# Story 1B.1: Observability Research & Decision

Status: Done

## Story

As a developer,
I want to research and document observability options for our stack,
So that we make an informed decision on libraries, exporters, and backends before implementation.

## Acceptance Criteria

1. **OTEL SDK Research**
   - Compare `@opentelemetry/sdk-node` vs `@vercel/otel` vs manual instrumentation
   - Evaluate: features, bundle size, maintenance, **Bun runtime compatibility**
   - Provide recommendation with rationale

2. **Auto-instrumentation Research**
   - Document Next.js 16 `instrumentation.ts` capabilities (async, server-only, edge limits)
   - Document Drizzle/PostgreSQL instrumentation (Story 1B.2 needs this for DB query tracing)
   - Document HTTP/fetch instrumentation (Story 1B.2 needs this for outgoing requests)
   - Document ORPC middleware patterns for request span creation
   - Identify gaps requiring manual spans

3. **Logging Strategy Research**
   - Compare: pino + OTEL bridge vs native OTEL Logs API
   - Must support trace_id/span_id injection (Story 1B.3 requirement)
   - Preserve Pino investment per ADR-007 if viable
   - Recommend approach with code example

4. **Exporter Research**
   - Document console exporter (readable dev output)
   - Document OTLP exporter (production-ready)
   - Recommend environment-based switching pattern

5. **Backend Research (Future Reference)**
   - Survey options: Jaeger, SigNoz, Grafana Tempo, SaaS (Grafana Cloud, Honeycomb)
   - Recommend: defer backend (console only) or minimal local setup?
   - Consider Dokploy Docker Compose constraints

6. **Collector Architecture Research**
   - Compare: direct export vs collector sidecar vs gateway
   - Recommend architecture for single-app Dokploy deployment

7. **Deliverables**
   - Research document: `_bmad-output/implementation-artifacts/1b-1-observability-research.md`
   - Follow template structure in Dev Notes below
   - User approval before Story 1B.2

## Tasks / Subtasks

### Research Phase (per AI-3: Research-First Workflow)

- [x] Task 1: OTEL SDK Comparison (AC: #1)
  - [x] 1.1: Research `@opentelemetry/sdk-node` - features, API, bundle size
  - [x] 1.2: Research `@vercel/otel` - wrapper scope, Vercel-specific features, limitations
  - [x] 1.3: Test Bun runtime compatibility (async_hooks, perf_hooks support)
  - [x] 1.4: Document comparison table with pros/cons
  - [x] 1.5: Recommend SDK approach

- [x] Task 2: Auto-instrumentation Research (AC: #2)
  - [x] 2.1: Research Next.js 16 `instrumentation.ts` - async support, server-only, edge runtime limits
  - [x] 2.2: Research `@opentelemetry/instrumentation-pg` for Drizzle/PostgreSQL
  - [x] 2.3: Research `@opentelemetry/instrumentation-fetch` for HTTP clients
  - [x] 2.4: Research ORPC middleware for span creation (see Dev Notes for pattern)
  - [x] 2.5: Document what auto-instruments vs what needs manual spans
  - [x] 2.6: Identify Bun-specific instrumentation issues

- [x] Task 3: Logging Strategy Research (AC: #3)
  - [x] 3.1: Research `pino-opentelemetry-transport` (pino → OTEL bridge)
  - [x] 3.2: Research `@opentelemetry/api-logs` (native OTEL Logs API)
  - [x] 3.3: Compare: complexity, performance, trace correlation mechanism
  - [x] 3.4: Document trace_id/span_id injection for each approach
  - [x] 3.5: Recommend approach (preserve Pino if viable)

- [x] Task 4: Exporter Strategy Research (AC: #4)
  - [x] 4.1: Document `@opentelemetry/exporter-trace-otlp-http`
  - [x] 4.2: Document ConsoleSpanExporter with readable formatting
  - [x] 4.3: Document environment-based exporter switching pattern
  - [x] 4.4: Recommend dev/prod strategy

- [x] Task 5: Backend & Collector Research (AC: #5, #6)
  - [x] 5.1: Survey self-hosted options (Jaeger, SigNoz, Grafana Tempo) - Docker requirements
  - [x] 5.2: Survey SaaS options - free tiers, pricing
  - [x] 5.3: Compare collector patterns (direct vs sidecar vs gateway)
  - [x] 5.4: Recommend: defer backend or minimal setup? Recommend collector pattern.

- [x] Task 6: Create Research Document (AC: #7)
  - [x] 6.1: Create `_bmad-output/implementation-artifacts/1b-1-observability-research.md` using template
  - [x] 6.2: Compile findings with sources/links
  - [x] 6.3: Include code examples for recommended approach
  - [x] 6.4: Add decision summary table
  - [x] 6.5: Add "Deferred Decisions" section

### User Approval Checkpoint (per AI-3)

- [x] Task 7: User Approval (AC: #7)
  - [x] 7.1: Present research findings summary
  - [x] 7.2: Get explicit approval on chosen approach
  - [x] 7.3: Document decision rationale
  - [x] 7.4: Update story status to Done

## Dev Notes

### Current Stack Versions (from package.json)

| Package | Version | Notes |
|---------|---------|-------|
| Next.js | ^16.0.6 | App Router |
| React | 19.2.1 | |
| ORPC | ^1.10.0 | Type-safe RPC |
| Drizzle | ^0.45.0 | PostgreSQL ORM |
| Bun | 1.3.1 | Package manager + runtime |
| Pino | (planned) | ADR-007 decision |

### Bun-OTEL Compatibility Context

**Known issues to investigate:**
- OTEL SDK uses Node.js APIs: `async_hooks`, `perf_hooks`, `diagnostics_channel`
- Bun has partial compatibility - some APIs may be missing or behave differently
- May need Bun-specific workarounds or alternative instrumentation approach
- Check: https://bun.sh/docs/runtime/nodejs-apis for current compatibility

### Cross-Story Dependencies

| Story | Requires from Research |
|-------|------------------------|
| 1B.2 | SDK choice, auto-instrumentation for HTTP/fetch/Drizzle, env switching |
| 1B.3 | Logging approach, trace_id/span_id injection mechanism |
| 1B.4 | Error span recording pattern, correlation header approach |

### ORPC Middleware Pattern

ORPC supports middleware for request interception. Research should evaluate:

```typescript
// Potential pattern for ORPC span creation
import { createMiddleware } from '@orpc/server'
import { trace } from '@opentelemetry/api'

const tracingMiddleware = createMiddleware(async ({ path, next }) => {
  const tracer = trace.getTracer('orpc')
  return tracer.startActiveSpan(`orpc.${path}`, async (span) => {
    try {
      const result = await next()
      span.setStatus({ code: SpanStatusCode.OK })
      return result
    } catch (error) {
      span.recordException(error)
      span.setStatus({ code: SpanStatusCode.ERROR })
      throw error
    } finally {
      span.end()
    }
  })
})
```

Verify this pattern works with ORPC 1.10.0 documentation.

### Next.js 16 Instrumentation Hook

```typescript
// apps/web/instrumentation.ts
export async function register() {
  // Runs once on server startup (not edge, not client)
  // Can be async - await SDK initialization
  // Must be in root of app directory
}
```

**Key constraints:**
- Server-only (not edge runtime, not client bundle)
- Runs before app code loads
- Can dynamically import based on environment

### Research Document Template

Use this structure for `1b-1-observability-research.md`:

```markdown
# Observability Research - Epic 1B

**Date:** YYYY-MM-DD
**Author:** [Agent]
**Status:** Draft | Approved

## Executive Summary
[2-3 sentences: chosen approach and key rationale]

## Decision Summary Table

| Topic | Decision | Rationale |
|-------|----------|-----------|
| SDK | | |
| Auto-instrumentation | | |
| Logging | | |
| Exporters | | |
| Backend | | |
| Collector | | |

## 1. OTEL SDK Comparison
### Options Evaluated
### Comparison Table
### Recommendation

## 2. Auto-instrumentation
### Next.js instrumentation.ts
### Database (Drizzle/pg)
### HTTP/Fetch
### ORPC Middleware
### Manual Span Requirements

## 3. Logging Strategy
### Option A: pino + OTEL bridge
### Option B: Native OTEL Logs API
### Recommendation

## 4. Exporter Strategy
### Development (Console)
### Production (OTLP)
### Environment Switching Pattern

## 5. Backend Options
### Self-hosted Survey
### SaaS Survey
### Recommendation

## 6. Collector Architecture
### Pattern Comparison
### Recommendation for Dokploy

## Deferred Decisions
[Items explicitly deferred with rationale]

## References
[All sources with links]
```

### Project Structure

```
_bmad-output/implementation-artifacts/
├── 1b-1-observability-research-decision.md  # This story
└── 1b-1-observability-research.md           # Research output (Task 6)

apps/web/
└── instrumentation.ts  # Created in Story 1B.2

packages/api/src/lib/
├── validation.ts       # Existing
├── validation.test.ts  # Existing
└── logger.ts           # Created in Story 1B.3 (does not exist yet)
```

### References

- [Source: docs/architecture.md#ADR-007] - Pino logging decision
- [Source: docs/epics/epic-1b-observability.md] - Epic overview
- [Source: _bmad-output/implementation-artifacts/epic-1-retrospective-2025-12-07.md] - AI-3 research-first workflow
- [OpenTelemetry JS](https://opentelemetry.io/docs/languages/js/)
- [Next.js Instrumentation](https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation)
- [@vercel/otel](https://www.npmjs.com/package/@vercel/otel)
- [pino-opentelemetry-transport](https://github.com/pinojs/pino-opentelemetry-transport)
- [Bun Node.js Compatibility](https://bun.sh/docs/runtime/nodejs-apis)

## Dev Agent Record

### Context Reference

- Story file: `_bmad-output/implementation-artifacts/1b-1-observability-research-decision.md`
- Research output: `_bmad-output/implementation-artifacts/1b-1-observability-research.md`

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- Web searches conducted for OTEL SDK, Bun compatibility, auto-instrumentation, logging, exporters, backends, collectors
- Official documentation reviewed: OpenTelemetry JS, Next.js, oRPC, Bun

### Completion Notes List

- Researched and compared `@opentelemetry/sdk-node` vs `@vercel/otel` - recommended sdk-node for full control
- Documented Bun runtime compatibility issues with async_hooks, perf_hooks
- Identified correct packages: `instrumentation-undici` for Node.js fetch (not `instrumentation-fetch`)
- Found official oRPC OpenTelemetry integration docs with interceptor pattern
- Compared pino-opentelemetry-transport vs instrumentation-pino - recommended instrumentation-pino
- Surveyed Jaeger, SigNoz, Grafana Tempo - recommended deferring backend
- Documented collector patterns - recommended direct export for single-app Dokploy deployment

### File List

- `_bmad-output/implementation-artifacts/1b-1-observability-research.md` (created)

## Discoveries

| Discovery | Impact | Action |
|-----------|--------|--------|
| **Production uses Bun runtime, auto-instrumentation broken** | **CRITICAL** | **Change Dockerfile to use Node.js: `node server.js`** |
| Dev uses Node.js (via shebang), prod uses Bun (direct) | High | Inconsistent behavior - unify on Node.js runtime |
| `instrumentation-fetch` is browser-only | High | Use `instrumentation-undici` for Node.js fetch instead |
| oRPC has official OTEL integration | High | Use interceptors pattern from docs, not custom middleware |
| OpenTelemetry requires `--require`/`--experimental-loader` hooks | High | Bun doesn't support these - Node.js required |
| `deployment.environment.name` is the correct attribute (not `deployment.environment`) | Medium | Use semantic conventions v1.28+ |
| Earlier AsyncLocalStorage perf issue was debug build only | Low | No workaround needed for release builds |

## Tech Debt Created

| Item | Reason | Tracking |
|------|--------|----------|
| | | |

## Change Log

- 2025-12-08: Story created via BMAD create-story workflow (YOLO mode)
- 2025-12-08: Quality review applied - fixed versions, added research template, Bun context, cross-story deps
- 2025-12-08: Research completed - CRITICAL: Bun runtime incompatible with OTEL auto-instrumentation
- 2025-12-08: ADR documented: Switch production runtime from Bun to Node.js
- 2025-12-08: User approved research findings and runtime switch decision
- 2025-12-08: Story marked Done
