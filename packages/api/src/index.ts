import { ORPCError, os } from "@orpc/server";
import {
  createLogger,
  getTraceId,
  isInternalServerError,
  recordSpanError,
} from "@planner/logger";
import type { Context } from "./context";

const log = createLogger("orpc");

export const o = os.$context<Context>();

/**
 * Error logging middleware - logs all procedure errors with context.
 * Applied to all procedures (public and protected).
 *
 * Client errors (ORPCError except INTERNAL_SERVER_ERROR) logged at warn level.
 * Server errors (INTERNAL_SERVER_ERROR or non-ORPCError) logged at error level.
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
    const isInternal = isInternalServerError(error);

    // Record error in active OTEL span for observability
    if (error instanceof Error) {
      const spanAttributes: Record<string, string> = { "rpc.path": procedure };
      if (error instanceof ORPCError) {
        spanAttributes["error.code"] = error.code;
      }
      recordSpanError(error, {
        attributes: spanAttributes,
        isInternalError: isInternal,
      });
    }

    if (error instanceof ORPCError && !isInternal) {
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
