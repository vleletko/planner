import type { Pool } from "pg";

/**
 * Reset database by dropping all tables in public schema
 *
 * WARNING: This is destructive! Only use in ephemeral environments (preview, e2e, dev)
 *
 * Safety checks:
 * - Requires explicit RESET_DB=true environment variable
 * - Errors if SEED_PROFILE=none (production) to prevent accidental data loss
 */
export async function resetDatabase(pool: Pool): Promise<void> {
  const resetEnabled = process.env.RESET_DB === "true";
  const seedProfile = process.env.SEED_PROFILE || "none";

  // Safety check: Don't reset if seeding is disabled (production indicator)
  if (resetEnabled && seedProfile === "none") {
    throw new Error(
      "SAFETY ERROR: Cannot reset database when SEED_PROFILE=none. " +
        "This combination suggests production environment. " +
        "Set SEED_PROFILE=test to confirm ephemeral environment."
    );
  }

  if (!resetEnabled) {
    console.log("⏭️  Database reset skipped (RESET_DB != true)");
    return;
  }

  console.log("🗑️  Resetting database (dropping all tables)...");

  // Drop drizzle schema (contains migrations journal) and all tables in public
  // This ensures migrations are re-applied from scratch
  await pool.query(`
    DO $$
    DECLARE
      r RECORD;
    BEGIN
      -- Disable triggers temporarily
      SET session_replication_role = 'replica';

      -- Drop drizzle schema (migrations journal)
      DROP SCHEMA IF EXISTS drizzle CASCADE;

      -- Drop all tables in public schema
      FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE';
      END LOOP;

      -- Re-enable triggers
      SET session_replication_role = 'origin';
    END $$;
  `);

  console.log("✅ Database reset complete");
}
