import dotenv from "dotenv";
import { defineConfig } from "drizzle-kit";

dotenv.config({
  path: "../../apps/web/.env",
});

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL environment variable is required. Please check your .env file."
  );
}

export default defineConfig({
  schema: "./src/schema",
  out: "./src/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
