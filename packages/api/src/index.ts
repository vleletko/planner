import { ORPCError, os } from "@orpc/server";
import { createLogger } from "@planner/logger";
import type { Context } from "./context";

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
    const logContext = { err: error, procedure };

    if (error instanceof ORPCError) {
      // Client errors (validation, unauthorized, not found) - expected, log as warning
      log.warn(logContext, "RPC client error");
    } else {
      // Server errors - unexpected, log as error
      log.error(logContext, "RPC server error");
    }
    throw error;
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
