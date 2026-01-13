import { defineConfig } from "drizzle-kit";

// DATABASE_URL is required - will be passed as environment variable
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

export default defineConfig({
  // Schema lives in @planner/db package
  schema: "../../packages/db/src/schema",
  // Migrations live in @planner/db package
  out: "../../packages/db/src/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
