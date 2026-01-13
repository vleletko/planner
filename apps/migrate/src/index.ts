import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import { resetDatabase } from "./reset";
import { runSeeding } from "./seed";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from apps/migrate directory
dotenv.config();

/**
 * Database Migration & Seeding Entry Point
 *
 * Environment variables:
 * - DATABASE_URL (required): PostgreSQL connection string
 * - RESET_DB (optional): Set to "true" to drop all tables before migrating
 * - SEED_PROFILE (optional): "none" (default) or "test"
 *
 * Flow:
 * 1. Safety checks (prevent accidental production reset)
 * 2. Reset database (if RESET_DB=true)
 * 3. Run migrations
 * 4. Run seeding (if SEED_PROFILE != none)
 */
async function main() {
  console.log("🚀 Database Migration & Seeding");
  console.log("================================");

  // Validate required environment
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL environment variable is required");
    process.exit(1);
  }

  // Log configuration
  const resetEnabled = process.env.RESET_DB === "true";
  const seedProfile = process.env.SEED_PROFILE || "none";
  console.log("📋 Configuration:");
  console.log(`   RESET_DB: ${resetEnabled}`);
  console.log(`   SEED_PROFILE: ${seedProfile}`);

  // Create database connection
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5,
    connectionTimeoutMillis: 10_000,
  });

  try {
    // Step 1: Reset database (if enabled)
    await resetDatabase(pool);

    // Step 2: Run migrations
    console.log("\n⏳ Running migrations...");
    const db = drizzle(pool);

    const require = createRequire(import.meta.url);
    const dbPackageJsonPath = require.resolve("@planner/db/package.json");
    const migrationsFolder = join(
      dirname(dbPackageJsonPath),
      "src",
      "migrations"
    );

    await migrate(db, { migrationsFolder });
    console.log("✅ Migrations complete");

    // Step 3: Run seeding
    await runSeeding(db);

    console.log("\n✅ Database setup complete!");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Database setup failed:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
