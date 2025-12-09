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

import { createLogger } from "@planner/logger";

import {
  APP_VERSION,
  getDeploymentEnvironment,
  getOtlpHeaders,
  getSamplerConfig,
  getTraceExporterUrl,
} from "./instrumentation.utils";

// Create logger after imports but before SDK initialization
// This logger will be instrumented by PinoInstrumentation
const log = createLogger("process");

function getSampler(env: string) {
  const samplerConfig = getSamplerConfig(env);
  if (samplerConfig.type === "ratio" && samplerConfig.ratio !== undefined) {
    return new ParentBasedSampler({
      root: new TraceIdRatioBasedSampler(samplerConfig.ratio),
    });
  }
  return new AlwaysOnSampler();
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
        try {
          const { traceId } = span.spanContext();
          if (
            "setHeader" in response &&
            typeof response.setHeader === "function"
          ) {
            response.setHeader("x-trace-id", traceId);
          }
        } catch (error) {
          // Log error but don't break the response
          log.error({ err: error }, "Failed to set x-trace-id header");
        }
      },
    }),
    new UndiciInstrumentation(),
    new PgInstrumentation(),
    new PinoInstrumentation(),
  ],
});

sdk.start();
console.log("[OTEL] SDK initialized", {
  environment,
  exporter: traceExporterUrl || "console",
});

process.on("SIGTERM", () => {
  sdk
    .shutdown()
    .then(() => console.log("[OTEL] SDK shut down successfully"))
    .catch((error) => console.error("[OTEL] Error shutting down SDK:", error))
    .finally(() => process.exit(0));
});

/**
 * Global unhandled error handlers for observability.
 * These ensure errors are logged with full context before the process exits.
 */

process.on("uncaughtException", (error: Error, origin: string) => {
  log.fatal({ err: error, origin }, "Uncaught exception");

  // Attempt graceful OTEL shutdown to flush pending traces
  sdk
    .shutdown()
    .catch((shutdownError) =>
      log.error({ err: shutdownError }, "Error during emergency shutdown")
    )
    .finally(() => {
      process.exit(1);
    });
});

process.on(
  "unhandledRejection",
  (reason: unknown, promise: Promise<unknown>) => {
    const error = reason instanceof Error ? reason : new Error(String(reason));
    log.fatal(
      { err: error, promise: String(promise) },
      "Unhandled promise rejection"
    );

    // Attempt graceful OTEL shutdown to flush pending traces
    sdk
      .shutdown()
      .catch((shutdownError) =>
        log.error({ err: shutdownError }, "Error during emergency shutdown")
      )
      .finally(() => {
        process.exit(1);
      });
  }
);
