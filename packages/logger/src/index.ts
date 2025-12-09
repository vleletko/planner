import pino from "pino";

const isProduction = process.env.NODE_ENV === "production";

/**
 * Root logger instance configured for OpenTelemetry integration.
 *
 * - Development: Pretty console output via pino-pretty, debug level
 * - Production: JSON logs to stdout, info level
 *
 * Trace context (trace_id, span_id) is automatically injected by
 * @opentelemetry/instrumentation-pino in apps/web/src/instrumentation.node.ts
 */
export const logger: pino.Logger = isProduction
  ? pino({ level: "info" })
  : pino({
      level: "debug",
      transport: {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:standard",
          ignore: "pid,hostname",
        },
      },
    });

/**
 * Create a child logger with module context.
 * @param module - Module name for log context (e.g., "auth", "db", "orpc")
 */
export function createLogger(module: string): pino.Logger {
  return logger.child({ module });
}

export type { Logger } from "pino";
