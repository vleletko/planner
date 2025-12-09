import { createLogger } from "@planner/logger";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const log = createLogger("db");

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL environment variable is required. Please set it in your .env file."
  );
}

// Configure connection pool with reasonable limits
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum number of connections in the pool
  idleTimeoutMillis: 30_000, // Close idle connections after 30 seconds
  connectionTimeoutMillis: 10_000, // Fail fast if database unreachable (10 seconds)
});

// Handle pool errors to prevent application crashes
pool.on("error", (err) => {
  log.error({ err }, "Unexpected error on idle client");
});

// Create Drizzle client with the connection pool
export const db = drizzle(pool);

// Export pool for advanced use cases (e.g., transactions)
export { pool };

// Export sql template tag for raw SQL queries
// biome-ignore lint/performance/noBarrelFile: Database package requires sql utility export
export { sql } from "drizzle-orm";

// Export schema tables for type inference
export { account, session, user, verification } from "./schema/auth";
