// Load environment variables before anything else
// (instrumentation runs before Next.js loads .env files)
import { config } from "dotenv";

config();

import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { HttpInstrumentation } from "@opentelemetry/instrumentation-http";
import { PgInstrumentation } from "@opentelemetry/instrumentation-pg";
import { PinoInstrumentation } from "@opentelemetry/instrumentation-pino";
import { UndiciInstrumentation } from "@opentelemetry/instrumentation-undici";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { NodeSDK } from "@opentelemetry/sdk-node";
import {
  AlwaysOnSampler,
  ConsoleSpanExporter,
  ParentBasedSampler,
  TraceIdRatioBasedSampler,
} from "@opentelemetry/sdk-trace-node";
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from "@opentelemetry/semantic-conventions";
import type { Logger } from "pino";

import {
  APP_VERSION,
  addTraceIdHeader,
  getDeploymentEnvironment,
  getOtlpHeaders,
  getSamplerConfig,
  getTraceExporterUrl,
} from "./instrumentation.utils";

// Lazy logger - created on first use (after SDK starts, so pino is instrumented)
let _log: Logger | undefined;
function getLog(): Logger {
  if (!_log) {
    // Dynamic import to ensure pino is instrumented before we create the logger
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createLogger } = require("@planner/logger");
    _log = createLogger("otel");
  }
  return _log as Logger;
}

// Lazy span error recorder - avoid importing @planner/logger at module load time
// which would cause pino logger to be created before PinoInstrumentation is registered
function recordSpanError(
  error: Error,
  options: { attributes?: Record<string, string>; isInternalError?: boolean }
): void {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { recordSpanError: record } = require("@planner/logger");
  record(error, options);
}

function getSampler(env: string) {
  const samplerConfig = getSamplerConfig(env);
  if (samplerConfig.type === "ratio" && samplerConfig.ratio !== undefined) {
    return new ParentBasedSampler({
      root: new TraceIdRatioBasedSampler(samplerConfig.ratio),
    });
  }
  return new AlwaysOnSampler();
}

/**
 * Graceful shutdown helper - flushes OTEL data and exits.
 * Consolidates duplicate shutdown logic from signal/error handlers.
 * Includes timeout to prevent hanging if SDK shutdown stalls.
 */
async function gracefulShutdown(exitCode: number): Promise<never> {
  const SHUTDOWN_TIMEOUT_MS = 5000;

  const timeoutId = setTimeout(() => {
    getLog().warn("OTEL SDK shutdown timeout - forcing exit");
    process.exit(exitCode);
  }, SHUTDOWN_TIMEOUT_MS);

  try {
    await sdk.shutdown();
    getLog().info("OTEL SDK shut down successfully");
  } catch (err) {
    getLog().error({ err }, "Error during OTEL shutdown");
  } finally {
    clearTimeout(timeoutId);
  }
  process.exit(exitCode);
}

const environment = getDeploymentEnvironment();
const otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;

// Use OTLP exporter if endpoint is configured, otherwise console in development
const traceExporterUrl = getTraceExporterUrl(otlpEndpoint);
const traceExporter = traceExporterUrl
  ? new OTLPTraceExporter({ url: traceExporterUrl, headers: getOtlpHeaders() })
  : new ConsoleSpanExporter();

const sdk = new NodeSDK({
  resource: resourceFromAttributes({
    [ATTR_SERVICE_NAME]: process.env.OTEL_SERVICE_NAME || "planner-web",
    [ATTR_SERVICE_VERSION]: APP_VERSION,
    "deployment.environment": environment,
  }),
  sampler: getSampler(environment),
  traceExporter,
  instrumentations: [
    new HttpInstrumentation({
      // Add trace ID to response headers for error correlation in support scenarios
      responseHook: (span, response) => {
        addTraceIdHeader(span, response, getLog());
      },
    }),
    new UndiciInstrumentation(),
    new PgInstrumentation(),
    new PinoInstrumentation(),
  ],
});

sdk.start();
getLog().info(
  { environment, exporter: traceExporterUrl || "console" },
  "OTEL SDK initialized"
);

process.on("SIGTERM", () => {
  gracefulShutdown(0);
});

/**
 * Global unhandled error handlers for observability.
 * These ensure errors are logged with full context before the process exits.
 * Errors are also recorded in OTEL spans if span context is available.
 */

process.on("uncaughtException", (error: Error, origin: string) => {
  // Record in active span if available (AC #3)
  // Unhandled exceptions are always internal errors
  recordSpanError(error, {
    attributes: { "error.origin": origin },
    isInternalError: true,
  });

  getLog().fatal({ err: error, origin }, "Uncaught exception");
  gracefulShutdown(1);
});

process.on(
  "unhandledRejection",
  (reason: unknown, promise: Promise<unknown>) => {
    const error = reason instanceof Error ? reason : new Error(String(reason));

    // Record in active span if available (AC #3)
    // Unhandled rejections are always internal errors
    recordSpanError(error, {
      attributes: { "error.type": "unhandledRejection" },
      isInternalError: true,
    });

    getLog().fatal(
      { err: error, promise: String(promise) },
      "Unhandled promise rejection"
    );
    gracefulShutdown(1);
  }
);
