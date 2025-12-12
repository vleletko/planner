# Story 1B.4: Error Handling & Spans

Status: done

## Story

As a developer,
I want errors properly captured in traces and logs,
So that I can debug issues effectively in any environment.

## Acceptance Criteria

1. **Error Recording in Spans**
   - Given an error occurs in an ORPC procedure
   - When the error is caught by error handling middleware
   - Then the error is recorded in the current span with:
     - Error message
     - Stack trace (via span.recordException)
     - Error attributes (code, type, procedure path)
   - And the span status is set to ERROR

2. **API Error Response Consistency**
   - Given an ORPC error is returned to client
   - When the error response is constructed
   - Then response includes `x-trace-id` header for correlation
   - And HTTP status codes set span status appropriately:
     - 4xx client errors: span.status = OK (expected behavior)
     - 5xx server errors: span.status = ERROR
   - And error response body includes traceId field for support

3. **Unhandled Error Capture**
   - Given an unhandled exception or rejection occurs
   - When Node.js runtime catches it
   - Then error is logged with full context before crash
   - And graceful shutdown is attempted if possible
   - And error appears in OTEL traces if span context available

## Tasks / Subtasks

### Task 1: Enhance ORPC Error Middleware with Span Recording (AC: #1, #2)

- [x] Task 1.1: Add span error recording to existing error middleware
  - [x] 1.1.1: Import `trace` from `@opentelemetry/api`
  - [x] 1.1.2: Get active span in error catch block
  - [x] 1.1.3: Call `span.recordException(error)` for all errors
  - [x] 1.1.4: Set span status: `span.setStatus({ code: SpanStatusCode.ERROR })`
  - [x] 1.1.5: Add error attributes: `span.setAttributes({ 'error.type': errorType, 'rpc.path': procedure })`

- [x] Task 1.2: Add trace ID to error responses
  - [x] 1.2.1: Extract trace ID from active span context
  - [x] 1.2.2: Include traceId in ORPCError data payload
  - [x] 1.2.3: Add `x-trace-id` header to RPC handler response

- [x] Task 1.3: Differentiate span status by error type
  - [x] 1.3.1: For ORPCError (client errors): set span status OK (expected behavior)
  - [x] 1.3.2: For other errors (server errors): set span status ERROR
  - [x] 1.3.3: Add test: verify span status set correctly for each error type

### Task 2: Global Unhandled Error Handlers (AC: #3)

- [x] Task 2.1: Add Node.js unhandled error handlers
  - [x] 2.1.1: Add `uncaughtException` handler in instrumentation.node.ts
  - [x] 2.1.2: Add `unhandledRejection` handler
  - [x] 2.1.3: Log error with full stack trace before exit
  - [x] 2.1.4: Attempt graceful OTEL SDK shutdown
  - [x] 2.1.5: Exit with non-zero code after logging

### Task 3: Verification & Testing (All ACs)

- [x] Task 3.1: Manual verification in development
  - [x] 3.1.1: Throw error in ORPC procedure, verify span has error recorded
  - [x] 3.1.2: Check `x-trace-id` header in error responses
  - [x] 3.1.3: Verify trace_id in error response body

- [x] Task 3.2: Add unit tests
  - [x] 3.2.1: Test error middleware sets span status correctly
  - [x] 3.2.2: Test trace ID extraction utility

## Dev Notes

### Previous Story Context (1b-3)

Error logging middleware already exists in `packages/api/src/index.ts`:

```typescript
// packages/api/src/index.ts (EXISTING)
const errorLogging = o.middleware(async ({ context, next, path }) => {
  const procedure = path.join("/");
  log.debug({ procedure }, "Procedure called");

  try {
    const result = await next({ context });
    log.debug({ procedure }, "Procedure completed");
    return result;
  } catch (error) {
    const logContext = { err: error, procedure };

    if (error instanceof ORPCError) {
      log.warn(logContext, "RPC client error");
    } else {
      log.error(logContext, "RPC server error");
    }
    throw error;
  }
});
```

**This story enhances it to also record errors in OTEL spans.**

### OTEL Span Error Recording Pattern

```typescript
import { trace, SpanStatusCode } from "@opentelemetry/api";

// Get active span
const span = trace.getActiveSpan();

if (span) {
  // Record exception (includes stack trace)
  span.recordException(error);

  // Set span status
  span.setStatus({
    code: SpanStatusCode.ERROR,
    message: error.message,
  });

  // Add error attributes
  span.setAttributes({
    "error.type": error.name,
    "rpc.path": procedure,
  });
}
```

### Trace ID Extraction

```typescript
import { trace, context } from "@opentelemetry/api";

function getTraceId(): string | undefined {
  const span = trace.getActiveSpan();
  if (!span) return undefined;

  const spanContext = span.spanContext();
  return spanContext.traceId;
}
```

### Span Status Guidelines

| Error Type | Span Status | Rationale |
|------------|-------------|-----------|
| ORPCError (UNAUTHORIZED, NOT_FOUND, BAD_REQUEST) | OK | Client errors are expected behavior |
| ORPCError (INTERNAL_SERVER_ERROR) | ERROR | Server-side failure |
| Other errors (unhandled) | ERROR | Unexpected failure |

### Anti-Patterns

1. **Don't set span status ERROR for client errors** - 401/404 are expected flows
2. **Don't log passwords/tokens in error context** - Security risk
3. **Don't swallow errors** - Always re-throw after recording
4. **Don't create new spans for error handling** - Use the existing active span

### File Paths

```
packages/api/
└── src/
    └── index.ts                    # MODIFY - add span error recording

apps/web/
└── src/
    └── instrumentation.node.ts     # MODIFY - add unhandled error handlers
```

### Environment Variables

No new environment variables required.

### Dependencies

Already installed:
- `@opentelemetry/api` (provides trace, SpanStatusCode)
- `@planner/logger` (for structured logging)

### Bun Isolated Linker Discovery (from 1b-3)

**CRITICAL**: Do NOT add `@opentelemetry/api` as direct dependency to packages that already import from workspace packages using it. Bun's isolated linker creates duplicate instances causing type mismatches.

**Pattern**: Import OTEL types from `@opentelemetry/api` directly (it's a peer dep pattern).

### References

- [Source: docs/epics/epic-1b-observability.md#Story 1B.4] - Epic requirements
- [Source: docs/sprint-artifacts/1b-3-structured-logging-via-otel.md] - Previous story context
- [Source: docs/sprint-artifacts/1b-1-observability-research.md] - OTEL patterns
- [OpenTelemetry Span API](https://opentelemetry.io/docs/languages/js/instrumentation/#recording-exceptions)

## Dev Agent Record

### Context Reference
- Story file: docs/sprint-artifacts/1b-4-error-handling-spans.md
- Previous story: 1b-3-structured-logging-via-otel (logger package, error middleware)

### Agent Model Used
Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References
- All 55 unit tests pass (13 logger + 15 API + 27 web)
- Build passes
- Lint passes (no errors)

### Completion Notes List
1. Created `span.ts` in logger package with `getTraceId()`, `isInternalServerError()`, `recordSpanError()` functions
2. Added span error recording to ORPC error middleware - records exception, sets status, adds attributes
3. Differentiated span status: OK for expected errors (ORPCError except INTERNAL_SERVER_ERROR), ERROR for internal errors
4. Added traceId to error response body (in ORPCError data payload)
5. Added `x-trace-id` header via HttpInstrumentation.responseHook in instrumentation.node.ts
6. Added `uncaughtException` and `unhandledRejection` handlers with graceful OTEL shutdown and span error recording (AC #3)
7. Added `@opentelemetry/api` to workspace catalog and as peerDependency/devDependency

### Code Review Refactoring (2025-12-12)
8. Renamed `isExpectedClientError` → `isInternalServerError` for clarity
9. Moved span utilities from `packages/api/src/lib/trace-utils.ts` to `packages/logger/src/span.ts`
10. Consolidated duplicate `recordErrorInActiveSpan` function - now uses shared `recordSpanError`
11. Changed `recordSpanError` signature to options object pattern: `recordSpanError(error, { attributes, isInternalError })`

### File List
- `packages/logger/src/logger.ts` (RENAMED from index.ts) - Pino logger configuration
- `packages/logger/src/index.ts` (NEW) - Re-exports logger and span utilities
- `packages/logger/src/span.ts` (NEW) - Span utilities: getTraceId, isInternalServerError, recordSpanError
- `packages/logger/src/span.test.ts` (NEW) - Unit tests for span utilities
- `packages/logger/package.json` (MODIFIED) - Added @opentelemetry/api and @orpc/server as peer/dev dependencies
- `packages/api/src/index.ts` (MODIFIED) - Error middleware imports from @planner/logger
- `packages/api/src/lib/trace-utils.ts` (DELETED) - Moved to logger package
- `packages/api/src/lib/trace-utils.test.ts` (DELETED) - Moved to logger package
- `apps/web/src/instrumentation.node.ts` (MODIFIED) - Uses shared recordSpanError, removed duplicate function
- `apps/web/src/instrumentation.utils.ts` (MODIFIED) - OTEL configuration utilities, addTraceIdHeader helper
- `apps/web/src/instrumentation.utils.test.ts` (MODIFIED) - Added tests for addTraceIdHeader
- `apps/web/package.json` (MODIFIED) - Changed @opentelemetry/api to catalog:
- `package.json` (MODIFIED) - Added @opentelemetry/api to workspace catalog
- `biome.json` (MODIFIED) - Added override to allow barrel files in package entry points
- `apps/web/src/app/test-error/page.tsx` (DELETED) - Test page removed after verification

## Discoveries

<!-- Document unexpected learnings, findings, and insights discovered during implementation -->

| Discovery | Impact | Action |
|-----------|--------|--------|
| | | |

## Tech Debt Created

| Item | Reason | Tracking |
|------|--------|----------|
| Next.js Error Boundaries (error.tsx, global-error.tsx) | Deferred to focus on core OTEL error recording; Next.js dev overlay sufficient for development | Future story |

## Change Log

- 2025-12-09: Story created via BMAD create-story workflow
- 2025-12-09: Updated Task 2 based on Next.js docs research:
  - Removed custom ErrorBoundary class component (not needed in App Router)
  - Use `error.tsx` file convention instead (Next.js auto-creates boundary)
  - Added `global-error.tsx` for root layout errors
  - Removed error-logger.ts utility (use console.error in useEffect)
  - Added code examples for event handler error handling pattern
- 2025-12-09: Removed React Error Boundaries from scope (tech debt):
  - Removed AC #2 (React Error Boundaries)
  - Removed Task 2 (Next.js Error Boundaries)
  - Renumbered remaining ACs and tasks
  - Added tech debt entry for future error.tsx/global-error.tsx implementation
  - Reason: Focus on core OTEL value; Next.js dev overlay sufficient for now
- 2025-12-10: Code review fixes:
  - Fixed INTERNAL_SERVER_ERROR span status (now ERROR instead of OK)
  - Added error.code attribute to span attributes
  - Added isExpectedClientError helper function with tests
  - Deleted test-error page after manual verification complete
