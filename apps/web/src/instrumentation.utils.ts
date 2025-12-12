/**
 * Utility functions for OpenTelemetry instrumentation configuration.
 * Extracted for testability.
 */

/** Logger type for error reporting in utility functions */
type ErrorLogger = {
  error: (ctx: { err: unknown }, msg: string) => void;
};

/**
 * Application version from build-time environment variable.
 * Falls back to "0.0.0-dev" for local development.
 */
export const APP_VERSION = process.env.APP_VERSION || "0.0.0-dev";

const TRAILING_SLASH_REGEX = /\/$/;

/**
 * Determines the deployment environment based on environment variables.
 * Priority: PREVIEW_ID > STAGING > NODE_ENV > fallback to user-development
 */
export function getDeploymentEnvironment(): string {
  if (process.env.PREVIEW_ID) {
    return `preview-${process.env.PREVIEW_ID}`;
  }
  if (process.env.STAGING === "true") {
    return "staging";
  }
  if (process.env.NODE_ENV === "production") {
    return "production";
  }
  return `${process.env.USER || "unknown"}-development`;
}

/**
 * Returns the appropriate sampler configuration based on environment.
 * - Production: 10% sampling
 * - Staging: 50% sampling
 * - Development/Preview: 100% sampling
 */
export function getSamplerConfig(env: string): {
  type: "ratio" | "always";
  ratio?: number;
} {
  if (env === "production") {
    return { type: "ratio", ratio: 0.1 };
  }
  if (env === "staging") {
    return { type: "ratio", ratio: 0.5 };
  }
  return { type: "always" };
}

/**
 * Parses OTLP headers from environment variable.
 * Format: "key1=value1,key2=value2"
 * Handles values containing "=" (e.g., base64 encoded tokens)
 */
export function getOtlpHeaders(): Record<string, string> | undefined {
  const headersEnv = process.env.OTEL_EXPORTER_OTLP_HEADERS;
  if (!headersEnv) {
    return;
  }

  const headers: Record<string, string> = {};
  for (const pair of headersEnv.split(",")) {
    const [key, ...valueParts] = pair.split("=");
    if (key && valueParts.length > 0) {
      headers[key.trim()] = valueParts.join("=").trim();
    }
  }
  return Object.keys(headers).length > 0 ? headers : undefined;
}

/**
 * Builds the trace exporter URL by appending /v1/traces to the base endpoint.
 * Handles trailing slashes correctly.
 */
export function getTraceExporterUrl(
  endpoint: string | undefined
): string | undefined {
  if (!endpoint) {
    return;
  }
  const base = endpoint.replace(TRAILING_SLASH_REGEX, "");
  return `${base}/v1/traces`;
}

/** Span-like type for trace ID extraction */
type SpanLike = {
  spanContext: () => { traceId: string };
};

/**
 * HTTP response hook that adds x-trace-id header for error correlation.
 * Extracted for testability from HttpInstrumentation responseHook.
 *
 * Accepts any response object - only adds header if setHeader method exists.
 */
export function addTraceIdHeader(
  span: SpanLike,
  response: unknown,
  logger: ErrorLogger
): void {
  try {
    const { traceId } = span.spanContext();
    if (
      response !== null &&
      typeof response === "object" &&
      "setHeader" in response &&
      typeof response.setHeader === "function"
    ) {
      response.setHeader("x-trace-id", traceId);
    }
  } catch (error) {
    logger.error({ err: error }, "Failed to set x-trace-id header");
  }
}
