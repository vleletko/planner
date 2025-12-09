import { ORPCError, os } from "@orpc/server";
import { createLogger } from "@planner/logger";
import type { Context } from "./context";
import { getTraceId, recordSpanError } from "./lib/trace-utils";

const log = createLogger("orpc");

export const o = os.$context<Context>();

/**
 * Error logging middleware - logs all procedure errors with context.
 * Applied to all procedures (public and protected).
 *
 * Client errors (ORPCError) logged at warn level - these are expected (validation, auth).
 * Server errors logged at error level - these require attention.
 */
const errorLogging = o.middleware(async ({ context, next, path }) => {
  const procedure = path.join("/");
  log.debug({ procedure }, "Procedure called");

  try {
    const result = await next({ context });
    log.debug({ procedure }, "Procedure completed");
    return result;
  } catch (error) {
    const traceId = getTraceId();
    const logContext = { err: error, procedure, traceId };
    const isClientError = error instanceof ORPCError;

    // Record error in active OTEL span for observability
    if (error instanceof Error) {
      recordSpanError(error, { "rpc.path": procedure }, isClientError);
    }

    if (isClientError) {
      // Client errors (validation, unauthorized, not found) - expected, log as warning
      log.warn(logContext, "RPC client error");
      // Re-throw ORPCError with traceId in data for client correlation
      throw new ORPCError(error.code, {
        message: error.message,
        data: { ...error.data, traceId },
        cause: error.cause,
      });
    }
    // Server errors - unexpected, log as error
    log.error(logContext, "RPC server error");
    // Wrap server errors in INTERNAL_SERVER_ERROR with traceId
    throw new ORPCError("INTERNAL_SERVER_ERROR", {
      message: "An unexpected error occurred",
      data: { traceId },
      cause: error,
    });
  }
});

export const publicProcedure = o.use(errorLogging);

const requireAuth = o.middleware(({ context, next }) => {
  if (!context.session?.user) {
    throw new ORPCError("UNAUTHORIZED");
  }
  return next({
    context: {
      session: context.session,
    },
  });
});

export const protectedProcedure = publicProcedure.use(requireAuth);
