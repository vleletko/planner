import { SpanStatusCode, trace } from "@opentelemetry/api";
import { ORPCError } from "@orpc/server";

/**
 * Get the current trace ID from the active span context.
 * Returns undefined if no active span exists.
 */
export function getTraceId(): string | undefined {
  const span = trace.getActiveSpan();
  if (!span) {
    return;
  }
  return span.spanContext().traceId;
}

/**
 * Checks if an error represents an internal server error (bug/crash).
 *
 * Used for OpenTelemetry span status:
 * - INTERNAL_SERVER_ERROR → span status ERROR (alerts, dashboards)
 * - All other ORPCErrors → span status OK (expected behavior, no alert)
 * - Non-ORPCError exceptions → treated as internal errors (unhandled)
 *
 * This prevents 4xx errors (validation, auth, not found) and transient
 * 5xx errors (503 service unavailable) from triggering false alerts.
 */
export function isInternalServerError(error: unknown): boolean {
  if (!(error instanceof ORPCError)) {
    return true; // Unhandled exceptions are internal errors
  }
  return error.code === "INTERNAL_SERVER_ERROR";
}

export type RecordSpanErrorOptions = {
  /** Additional attributes to set on the span */
  attributes?: Record<string, string>;
  /** If true, sets span status to ERROR (triggers alerts). Defaults to true for safety. */
  isInternalError?: boolean;
};

/**
 * Record an error on the active span with appropriate status and attributes.
 *
 * - Internal errors: span status = ERROR (triggers alerts)
 * - Expected errors: span status = OK (no alerts)
 */
export function recordSpanError(
  error: Error,
  options: RecordSpanErrorOptions = {}
): void {
  const span = trace.getActiveSpan();
  if (!span) {
    return;
  }

  const { attributes = {}, isInternalError = true } = options;

  // Record exception (includes stack trace)
  span.recordException(error);

  // Set span status
  if (isInternalError) {
    span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
  } else {
    span.setStatus({ code: SpanStatusCode.OK });
  }

  // Set error attributes
  span.setAttributes({
    "error.type": error.name,
    ...attributes,
  });
}
