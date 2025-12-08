import pino, { type Logger } from "pino";

const isProduction = process.env.NODE_ENV === "production";

/**
 * Root logger instance configured for Next.js + OpenTelemetry.
 *
 * - Development: Pretty console output via pino-pretty
 * - Production: JSON logs to stdout (collected by infrastructure)
 *
 * Trace context (trace_id, span_id) is automatically injected by
 * @opentelemetry/instrumentation-pino configured in instrumentation.node.ts
 *
 * Usage:
 * ```ts
 * import { logger } from "@/lib/logger";
 *
 * // Create a child logger with context
 * const log = logger.child({ module: "auth" });
 * log.info({ userId: "123" }, "User logged in");
 * ```
 */
export const logger: Logger = isProduction
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
 * Convenience wrapper for logger.child({ module: name })
 */
export function createLogger(module: string): Logger {
  return logger.child({ module });
}
