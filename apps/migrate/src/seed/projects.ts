/**
 * Projects seed data
 *
 * Used for: dev, preview, e2e environments
 * Contains sample projects for manual and automated testing
 */

export type SeedProjectMember = {
  email: string;
  role: "admin" | "member";
};

export type SeedProjectData = {
  key: string;
  name: string;
  description?: string;
  ownerEmail: string;
  /** Additional members to add (owner is automatically added) */
  members?: SeedProjectMember[];
};

/**
 * Test projects dataset
 *
 * Sample projects for testing project management features:
 * - MKT: Marketing campaign project (test@example.com)
 * - PROD: Product launch project (test@example.com)
 * - DEMO: Demo project (demo@example.com)
 * - TEAM: Team collaboration project (demo@example.com, with test@example.com as member)
 */
export const TEST_PROJECTS: SeedProjectData[] = [
  {
    key: "MKT",
    name: "Marketing Campaign Q1",
    description: "Planning and execution for Q1 marketing initiatives",
    ownerEmail: "test@example.com",
  },
  {
    key: "PROD",
    name: "Product Launch",
    description: "New product launch coordination",
    ownerEmail: "test@example.com",
  },
  {
    key: "DEMO",
    name: "Demo Project",
    ownerEmail: "demo@example.com",
  },
  {
    key: "TEAM",
    name: "Team Collaboration",
    description:
      "A project where test user is a member (for testing read-only access)",
    ownerEmail: "demo@example.com",
    members: [{ email: "test@example.com", role: "member" }],
  },
];
