import { SpanStatusCode, trace } from "@opentelemetry/api";

/**
 * Get the current trace ID from the active span context.
 * Returns undefined if no active span exists.
 */
export function getTraceId(): string | undefined {
  const span = trace.getActiveSpan();
  if (!span) {
    return;
  }

  const spanContext = span.spanContext();
  return spanContext.traceId;
}

/**
 * Add x-trace-id header to response for error correlation in support scenarios.
 * If no active span exists, returns the original response unchanged.
 */
export function withTraceIdHeader(response: Response): Response {
  const traceId = getTraceId();
  if (!traceId) {
    return response;
  }

  const headers = new Headers(response.headers);
  headers.set("x-trace-id", traceId);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/**
 * Record an error on the active span with appropriate status and attributes.
 *
 * @param error - The error to record
 * @param attributes - Additional attributes to set on the span
 * @param isClientError - If true, sets span status to OK (expected behavior); otherwise ERROR
 */
export function recordSpanError(
  error: Error,
  attributes: Record<string, string>,
  isClientError: boolean
): void {
  const span = trace.getActiveSpan();
  if (!span) {
    return;
  }

  // Record the exception (includes stack trace)
  span.recordException(error);

  // Set span status based on error type
  // Client errors (4xx) are expected behavior, so status is OK
  // Server errors (5xx) are unexpected failures, so status is ERROR
  if (isClientError) {
    span.setStatus({ code: SpanStatusCode.OK });
  } else {
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: error.message,
    });
  }

  // Add error attributes
  span.setAttributes({
    "error.type": error.name,
    ...attributes,
  });
}
