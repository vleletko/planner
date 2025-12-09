import { db } from "@planner/db";
// biome-ignore lint/performance/noNamespaceImport: Schema object needs all tables for drizzle adapter
import * as schema from "@planner/db/schema/auth";
import { createLogger } from "@planner/logger";
import { type BetterAuthOptions, betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";

const authLogger = createLogger("better-auth");

/**
 * Better-Auth Configuration
 *
 * Authentication system using Better-Auth 1.3.28 with PostgreSQL storage via Drizzle ORM.
 *
 * Security Features:
 * - Session-based authentication with httpOnly cookies (XSS protection)
 * - sameSite=lax cookie flag (CSRF protection)
 * - secure flag enabled in production (HTTPS only)
 * - Password hashing using scrypt algorithm (161-character hashes)
 * - 7-day session expiration (default)
 *
 * Plugins:
 * - nextCookies: Integrates with Next.js App Router for automatic session management
 *
 * Environment Variables:
 * - BETTER_AUTH_SECRET: Secret key for session signing (required)
 * - BETTER_AUTH_URL: Application URL for redirects (required)
 * - CORS_ORIGIN: Trusted origin for CORS (required)
 * - DATABASE_URL: PostgreSQL connection string (inherited from Drizzle config)
 *
 * Database Tables (managed by Better-Auth):
 * - users: User accounts with email, name, email verification
 * - sessions: Active sessions with tokens and expiration
 * - accounts: Authentication providers (credential, OAuth)
 *
 * API Endpoints (auto-generated at /api/auth/*):
 * - POST /api/auth/sign-up: Create new user account
 * - POST /api/auth/sign-in: Authenticate and create session
 * - POST /api/auth/sign-out: Destroy session and clear cookie
 * - GET /api/auth/session: Get current session data
 *
 * @see https://better-auth.com
 * @see docs/architecture.md#Authentication-Flow
 */
export const auth = betterAuth<BetterAuthOptions>({
  // Database adapter: Drizzle ORM with PostgreSQL
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  // CORS: Allow requests from configured origin
  trustedOrigins: [process.env.CORS_ORIGIN || ""],
  // Email/password authentication enabled
  emailAndPassword: {
    enabled: true,
  },
  rateLimit: {
    enabled: false,
    window: 10, // 10 seconds
    max: 500, // 50 requests per window
  },
  // Next.js integration for automatic session cookie management
  plugins: [nextCookies()],
  // Route Better Auth logs to Pino for OpenTelemetry capture
  logger: {
    log: (level, message, ...args) => {
      // Map Better-Auth log levels to pino methods with fallback to info
      const levelMap: Record<string, "error" | "warn" | "debug" | "info"> = {
        error: "error",
        warn: "warn",
        debug: "debug",
        info: "info",
      };
      const logLevel = levelMap[level] ?? "info";
      authLogger[logLevel]({ args }, message);
    },
  },
});
