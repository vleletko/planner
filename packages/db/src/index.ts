import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

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
  console.error("Unexpected error on idle client", err);
});

// Create Drizzle client with the connection pool
export const db = drizzle(pool);

// Export pool for advanced use cases (e.g., transactions)
export { pool };

// Export schema tables for type inference
// biome-ignore lint/performance/noBarrelFile: Database package requires schema exports for type inference
export { account, session, user, verification } from "./schema/auth";
