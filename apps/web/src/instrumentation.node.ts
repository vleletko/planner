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

const TRAILING_SLASH_REGEX = /\/$/;

function getDeploymentEnvironment(): string {
  if (process.env.NODE_ENV === "production" && !process.env.PREVIEW_ID) {
    return "production";
  }
  if (process.env.PREVIEW_ID) {
    return `preview-${process.env.PREVIEW_ID}`;
  }
  if (process.env.STAGING === "true") {
    return "staging";
  }
  return `${process.env.USER || "unknown"}-development`;
}

function getSampler(env: string) {
  if (env === "production") {
    return new ParentBasedSampler({
      root: new TraceIdRatioBasedSampler(0.1),
    });
  }
  if (env === "staging") {
    return new ParentBasedSampler({
      root: new TraceIdRatioBasedSampler(0.5),
    });
  }
  // Development and preview environments: sample everything
  return new AlwaysOnSampler();
}

const environment = getDeploymentEnvironment();
const otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;

// Parse OTLP headers from environment (format: "key1=value1,key2=value2")
function getOtlpHeaders(): Record<string, string> | undefined {
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

// Build trace exporter URL (append /v1/traces to base endpoint)
function getTraceExporterUrl(): string | undefined {
  if (!otlpEndpoint) {
    return;
  }
  const base = otlpEndpoint.replace(TRAILING_SLASH_REGEX, "");
  return `${base}/v1/traces`;
}

// Use OTLP exporter if endpoint is configured, otherwise console in development
const traceExporterUrl = getTraceExporterUrl();
const traceExporter = traceExporterUrl
  ? new OTLPTraceExporter({ url: traceExporterUrl, headers: getOtlpHeaders() })
  : new ConsoleSpanExporter();

const sdk = new NodeSDK({
  resource: resourceFromAttributes({
    [ATTR_SERVICE_NAME]: process.env.OTEL_SERVICE_NAME || "planner-web",
    [ATTR_SERVICE_VERSION]: process.env.APP_VERSION || "0.0.0",
    "deployment.environment": environment,
  }),
  sampler: getSampler(environment),
  traceExporter,
  instrumentations: [
    new HttpInstrumentation(),
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
