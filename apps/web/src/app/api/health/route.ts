import { db, sql } from "@planner/db";
import { createLogger } from "@planner/logger";
import { APP_VERSION } from "@/instrumentation.utils";

const log = createLogger("health");

export async function GET() {
  log.debug({ endpoint: "/api/health" }, "Health check requested");

  // Check database connectivity
  let dbStatus: "ok" | "error" = "ok";
  let dbLatencyMs: number | null = null;

  try {
    const start = performance.now();
    await db.execute(sql`SELECT 1`);
    dbLatencyMs = Math.round(performance.now() - start);
  } catch (error) {
    dbStatus = "error";
    log.error({ err: error }, "Database health check failed");
  }

  const overallStatus = dbStatus === "ok" ? "ok" : "degraded";
  const httpStatus = overallStatus === "ok" ? 200 : 503;

  return Response.json(
    {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
      version: APP_VERSION,
      checks: {
        database: {
          status: dbStatus,
          latencyMs: dbLatencyMs,
        },
      },
    },
    { status: httpStatus }
  );
}
