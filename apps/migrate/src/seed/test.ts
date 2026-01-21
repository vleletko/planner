/**
 * Test seed data
 *
 * Used for: dev, preview, e2e environments
 * Contains realistic test users for manual and automated testing
 */

export type SeedUserData = {
  name: string;
  email: string;
  password: string;
  emailVerified?: boolean;
  role?: "user" | "admin";
};

/**
 * Test users dataset
 *
 * Mix of verified and unverified users for realistic testing:
 * - test@example.com: Primary test account (verified)
 * - admin@example.com: Admin testing (verified)
 * - demo@example.com: Demo/presentation account (verified)
 * - unverified@example.com: Email verification flow testing (unverified)
 */
export const TEST_USERS: SeedUserData[] = [
  {
    name: "Test User",
    email: "test@example.com",
    password: "TestPassword123!",
    emailVerified: true,
  },
  {
    name: "Admin User",
    email: "admin@example.com",
    password: "AdminPassword123!",
    emailVerified: true,
    role: "admin",
  },
  {
    name: "Demo User",
    email: "demo@example.com",
    password: "DemoPassword123!",
    emailVerified: true,
  },
  {
    name: "Unverified User",
    email: "unverified@example.com",
    password: "UnverifiedPassword123!",
    emailVerified: false,
  },
];
