# Epic 2B: Observability

**Goal:** Establish application observability infrastructure using OpenTelemetry, providing structured logging, request tracing, and error handling before building feature epics.

**Rationale:** This epic was identified during the Epic 1 retrospective as a missing foundational component. Observability should be in place before Epic 2 (Project & Workspace Management) to ensure new features are debuggable from day 1.

**Approach:** OpenTelemetry from day 1 with a hybrid strategy - console exporter for development, OTLP-ready for production backends when needed.

---

## Story 2B.1: Observability Research & Decision

As a developer,
I want to research and document observability options for our stack,
So that we make an informed decision on libraries, exporters, and backends.

**Acceptance Criteria:**

**Given** I need to set up observability for a Next.js + ORPC + Drizzle application
**When** I research available options
**Then** I document findings for each topic with trade-offs

**Research Topics:**

1. **OTEL SDK Options**
   - `@opentelemetry/sdk-node` (official)
   - `@vercel/otel` (Vercel's wrapper)
   - Manual instrumentation setup
   - Comparison: features, bundle size, maintenance

2. **Auto-instrumentation**
   - Next.js instrumentation (`instrumentation.ts`)
   - Drizzle/PostgreSQL instrumentation
   - Fetch/HTTP client instrumentation
   - ORPC middleware instrumentation

3. **Logging Strategy**
   - pino + OTEL bridge vs native OTEL Logs API
   - Log levels and formatting
   - Correlation with traces (trace_id, span_id)

4. **Exporters**
   - Console exporter (development)
   - OTLP exporter (production-ready)
   - Vendor-specific exporters (if needed)

5. **Backends (for future reference)**
   - Self-hosted: Jaeger, SigNoz, Grafana Tempo
   - SaaS: Grafana Cloud, Honeycomb, Datadog
   - Decision: defer backend or set up minimal?

6. **Collector Architecture**
   - Direct export vs collector sidecar vs gateway
   - Dokploy deployment considerations

**Deliverables:**
- Research document: `docs/sprint-artifacts/2b-1-observability-research.md`
- Recommendation with rationale
- User approval before implementation

**Prerequisites:** Epic 1 complete

**Technical Notes:**
- Follow research-first pattern from Story 1-5
- Document all findings with sources
- Include code examples for recommended approach
- Consider bundle size impact on client
- Ensure compatibility with Bun runtime

---

## Story 2B.2: OpenTelemetry SDK Setup

As a developer,
I want OpenTelemetry SDK configured in our application,
So that I have the foundation for traces, logs, and metrics.

**Acceptance Criteria:**

**Given** the approved observability approach from Story 2B.1
**When** I set up the OTEL SDK
**Then** the application initializes telemetry on startup

**And** in development:
- Traces are output to console in readable format
- Spans show request lifecycle (incoming → processing → response)
- No external dependencies required

**And** in production (preview deployments):
- Telemetry is configured but export can be disabled
- OTLP endpoint is configurable via environment variable
- Graceful degradation if exporter unavailable

**And** auto-instrumentation captures:
- HTTP incoming requests (Next.js)
- HTTP outgoing requests (fetch)
- Database queries (Drizzle/PostgreSQL)

**Prerequisites:** Story 2B.1 approved

**Technical Notes:**
- Create `instrumentation.ts` in `apps/web/`
- Configure SDK based on research findings
- Add environment variables: `OTEL_EXPORTER_OTLP_ENDPOINT`, `OTEL_SERVICE_NAME`
- Ensure SDK initializes before app code
- Test with `bun run dev` and verify console output

---

## Story 2B.3: Structured Logging via OTEL

As a developer,
I want structured logging integrated with OpenTelemetry,
So that logs are correlated with traces and have consistent format.

**Acceptance Criteria:**

**Given** OTEL SDK is configured
**When** I use the logging API
**Then** logs include trace context (trace_id, span_id)

**And** log levels work correctly:
- `debug` - Development details (hidden in production)
- `info` - Normal operations
- `warn` - Potential issues
- `error` - Failures requiring attention

**And** logs are structured:
- JSON format in production (for parsing)
- Pretty format in development (for readability)
- Consistent fields: timestamp, level, message, trace_id, span_id, attributes

**And** logging is available via helper:
- Import from shared package or utility
- Type-safe API with attribute support
- Example: `logger.info('User logged in', { userId: '123' })`

**Prerequisites:** Story 2B.2

**Technical Notes:**
- Create logger utility in `packages/api/src/lib/logger.ts` or similar
- Integrate with OTEL Logs API or pino bridge (per research decision)
- Add request context middleware for ORPC
- Ensure logs appear in Docker/Dokploy output
- Test correlation: make request, verify trace_id matches across logs

---

## Story 2B.4: Error Handling & Spans

As a developer,
I want errors properly captured in traces and logs,
So that I can debug issues effectively in any environment.

**Acceptance Criteria:**

**Given** an error occurs in the application
**When** it is caught by error handling
**Then** the error is recorded in the current span with:
- Error message
- Stack trace
- Error attributes (code, type, etc.)

**And** error boundaries capture React errors:
- Client-side errors logged with context
- Error boundary UI shows user-friendly message
- Error details available in telemetry

**And** API errors are handled consistently:
- ORPC errors include span context
- HTTP status codes set span status appropriately
- Error responses include correlation ID for support

**And** unhandled errors are captured:
- Global error handler for uncaught exceptions
- Promise rejection handler
- Graceful logging before crash

**Prerequisites:** Story 2B.3

**Technical Notes:**
- Create error handling utilities
- Add ORPC error middleware
- Implement React error boundary with telemetry
- Add `x-correlation-id` header to responses
- Test: throw errors at various levels, verify capture in logs/traces

---

## Out of Scope (Deferred)

| Item | Rationale |
|------|-----------|
| OTLP collector deployment | Need traffic patterns first |
| Grafana/Jaeger backend | Can use console export initially |
| Metrics collection | Focus on logs/traces first |
| Dashboards | Need data to visualize |
| Alerting | Need baseline to set thresholds |
| Performance profiling | Optimization comes later |

---

## Dependencies

**Depends on:**
- Epic 1: Foundation complete (CI/CD, testing, auth)

**Enables:**
- Epic 2: Project & Workspace Management (with observability from day 1)
- All future epics (debuggable features)

---

## Success Criteria

1. **Developer can see request flow** - Console shows trace with spans
2. **Logs are correlated** - trace_id connects related log entries
3. **Errors are captured** - Stack traces visible in telemetry
4. **No production impact** - Telemetry doesn't slow down app
5. **Future-proof** - Can add OTLP backend without code changes

---

## References

- [OpenTelemetry JS Documentation](https://opentelemetry.io/docs/languages/js/)
- [Next.js Instrumentation](https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation)
- [Vercel OTEL Package](https://www.npmjs.com/package/@vercel/otel)
- Epic 1 Retrospective: `docs/sprint-artifacts/epic-1-retrospective-2025-12-07.md`

---

*Created during Epic 1 Retrospective (2025-12-07)*
