import pino from "pino";

const isProduction = process.env.NODE_ENV === "production";

/**
 * Root logger instance configured for OpenTelemetry integration.
 *
 * ## Environment-based Configuration
 * - **Development**: Pretty console output via pino-pretty, debug level
 * - **Production**: JSON logs to stdout, info level
 *
 * ## Trace Correlation
 * Trace context (trace_id, span_id) is automatically injected by
 * `@opentelemetry/instrumentation-pino` in `apps/web/src/instrumentation.node.ts`
 *
 * ## Log Level Guidelines
 * | Level   | Use For                                      | Production |
 * |---------|----------------------------------------------|------------|
 * | `debug` | Development details, verbose tracing         | Hidden     |
 * | `info`  | Normal operations, key events                | Visible    |
 * | `warn`  | Potential issues, unexpected but handled     | Visible    |
 * | `error` | Failures requiring attention                 | Visible    |
 *
 * ## Anti-Patterns
 * - Don't log sensitive data (passwords, tokens, PII)
 * - Don't log in hot loops (avoid debug logs inside iterations)
 * - Don't create logger per request (use module-level logger)
 * - Don't duplicate trace info (trace_id/span_id are automatic)
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
 *
 * Use this at the module level to create a logger scoped to a specific area.
 * The module name appears in all log output, making it easy to filter logs.
 *
 * @param module - Module name for log context (e.g., "auth", "db", "orpc")
 * @returns A pino child logger with the module binding
 *
 * @example
 * ```typescript
 * // At module level - create once
 * import { createLogger } from "@planner/logger";
 * const log = createLogger("projects");
 *
 * // In handlers - log with relevant attributes
 * log.info({ projectName: input.name }, "Creating project");
 * log.info({ projectId: result.id }, "Project created");
 * log.warn({ userId }, "User has no projects");
 * log.error({ err: error, projectId }, "Failed to create project");
 * ```
 */
export function createLogger(module: string): pino.Logger {
  return logger.child({ module });
}

export type { Logger } from "pino";
