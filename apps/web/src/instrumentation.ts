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
  const { createLogger } = await import("@planner/logger");
  const { getTraceId } = await import("@planner/api/lib/trace-utils");
  const log = createLogger("next-server");

  // Extract digest if available (React-processed errors have this)
  const digest =
    error instanceof Error && "digest" in error ? error.digest : undefined;

  // Get trace ID from active span for error correlation
  const traceId = getTraceId();

  log.error(
    {
      err: error,
      digest,
      traceId,
      request: {
        path: request.path,
        method: request.method,
      },
      context: {
        routerKind: context.routerKind,
        routePath: context.routePath,
        routeType: context.routeType,
        renderSource: context.renderSource,
      },
    },
    "Server error"
  );
};
