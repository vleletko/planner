import type { SeedUserData } from "@planner/migrate/seed/test";
import { TEST_USERS } from "@planner/migrate/seed/test";

export type { SeedUserData as TestUser } from "@planner/migrate/seed/test";

function getUser(index: number): SeedUserData {
  const user = TEST_USERS[index];
  if (!user) {
    throw new Error(`Test user at index ${index} not found`);
  }
  return user;
}

// Convenience exports - with runtime validation
export const testUser = getUser(0);
export const adminUser = getUser(1);
export const demoUser = getUser(2);
export const unverifiedUser = getUser(3);
