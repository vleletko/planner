import type { Instrumentation } from "next";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./instrumentation.node");
  }
}

/**
 * Next.js server error handler for observability.
 * Logs all server errors (Server Components, Route Handlers, Server Actions)
 * via pino for OTLP export.
 */
export const onRequestError: Instrumentation.onRequestError = async (
  error,
  request,
  context
) => {
  // Only log on Node.js runtime (Edge would need separate handling)
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }

  // Dynamic import to avoid issues with Edge runtime
  const { createLogger, getTraceId } = await import("@planner/logger");
  const log = createLogger("next-server");

  // Extract digest if available (React-processed errors have this)
  const digest =
    error instanceof Error && "digest" in error ? error.digest : undefined;

  // Get trace ID from active span for error correlation
  const traceId = getTraceId();

  // Use OTEL semantic conventions for exception and HTTP attributes
  // See: https://opentelemetry.io/docs/specs/semconv/exceptions/exceptions-logs/
  // See: https://opentelemetry.io/docs/specs/semconv/http/http-spans/
  log.error(
    {
      // OTEL exception semantic conventions (for SigNoz exception tracking)
      "exception.type": error instanceof Error ? error.name : "Error",
      "exception.message":
        error instanceof Error ? error.message : String(error),
      "exception.stacktrace": error instanceof Error ? error.stack : undefined,
      // OTEL HTTP semantic conventions
      "http.request.method": request.method,
      "url.path": request.path,
      "http.route": context.routePath,
      // Additional context
      digest,
      traceId,
      // Next.js specific context
      "next.routerKind": context.routerKind,
      "next.routeType": context.routeType,
      "next.renderSource": context.renderSource,
    },
    "Server error"
  );
};
