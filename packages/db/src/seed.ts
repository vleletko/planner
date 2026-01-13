import { randomUUID } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { projectMembers, projects } from "./schema/projects";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, "../../../apps/web/.env") });

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL environment variable is required. Please set it in your .env file."
  );
}

/**
 * User data interface for seeding
 */
type SeedUserData = {
  name: string;
  email: string;
  password: string;
  emailVerified?: boolean;
};

/**
 * Test users for seeding
 * Mix of verified and unverified users for realistic testing
 */
const TEST_USERS: SeedUserData[] = [
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

/**
 * Seed a single user using Better Auth Admin API
 *
 * This function:
 * - Checks if user already exists (idempotent)
 * - Uses Better Auth Admin API for proper user creation
 * - Handles password hashing automatically
 * - Creates both user and account records
 * - Supports custom emailVerified status
 *
 * @param db - Drizzle database instance
 * @param auth - Better Auth instance
 * @param userData - User data to seed
 * @returns Promise<boolean> - true if user was created, false if already exists
 */
async function seedUser(
  db: NodePgDatabase,
  userData: SeedUserData
): Promise<boolean> {
  // Dynamically import Better Auth to avoid circular dependencies
  // Using relative path to avoid circular dependency (auth package depends on db)
  // using path as string, to suppress TS6059 and TS6307
  const path = "../../auth/src/index.js";
  const { auth } = await import(path);
  const { user } = await import("@planner/db/schema/auth");

  try {
    // Check if user already exists (idempotent check)
    const existing = await db
      .select()
      .from(user)
      .where(eq(user.email, userData.email))
      .limit(1);

    if (existing.length > 0) {
      console.log(`  ⏭️  User already exists: ${userData.email}`);
      return false;
    }

    // Use Better Auth Admin API to create user
    // This properly handles password hashing, account creation, and verification status
    const result = await auth.api.signUpEmail({
      body: {
        name: userData.name,
        email: userData.email,
        password: userData.password,
      },
    });

    if (!result?.user?.id) {
      throw new Error("Failed to create user - no user ID returned");
    }

    const userId = result.user.id;

    // Set email verification status directly using Drizzle ORM
    if (userData.emailVerified) {
      await db
        .update(user)
        .set({ emailVerified: true })
        .where(eq(user.id, userId));
    }

    const verifiedStatus = userData.emailVerified ? "✅" : "📧";
    console.log(
      `  ${verifiedStatus} Created user: ${userData.email} (verified: ${userData.emailVerified ?? false})`
    );
    return true;
  } catch (error) {
    console.error(`  ❌ Failed to create user ${userData.email}:`, error);
    return false;
  }
}

/**
 * Seed authentication users using Better Auth Admin API
 *
 * Orchestrates seeding of multiple users by calling seedUser for each
 * Provides summary statistics after completion
 */
async function seedAuthUsers(db: NodePgDatabase) {
  console.log("\n👤 Seeding authentication users...");

  let createdCount = 0;
  let existingCount = 0;

  // Seed each user using the seedUser function
  for (const userData of TEST_USERS) {
    const wasCreated = await seedUser(db, userData);
    if (wasCreated) {
      createdCount += 1;
    } else {
      existingCount += 1;
    }
  }

  console.log(
    `\n📊 Auth seeding summary: ${createdCount} created, ${existingCount} already existed`
  );
}

/**
 * Project data interface for seeding
 */
type SeedProjectData = {
  key: string;
  name: string;
  description?: string;
  ownerEmail: string;
};

/**
 * Test projects for seeding
 * Sample projects for testing project management features
 */
const TEST_PROJECTS: SeedProjectData[] = [
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
];

/**
 * Seed a single project directly into the database
 */
async function seedProject(
  db: NodePgDatabase,
  projectData: SeedProjectData
): Promise<boolean> {
  const { user } = await import("@planner/db/schema/auth");

  try {
    // Check if project already exists by key (idempotent)
    const existing = await db
      .select()
      .from(projects)
      .where(eq(projects.key, projectData.key))
      .limit(1);

    if (existing.length > 0) {
      console.log(`  ⏭️  Project exists: ${projectData.key}`);
      return false;
    }

    // Look up owner user by email
    const ownerResult = await db
      .select()
      .from(user)
      .where(eq(user.email, projectData.ownerEmail))
      .limit(1);

    if (ownerResult.length === 0) {
      console.log(
        `  ⚠️  Owner not found: ${projectData.ownerEmail}, skipping ${projectData.key}`
      );
      return false;
    }

    const owner = ownerResult[0];
    const projectId = randomUUID();

    // Insert project
    await db.insert(projects).values({
      id: projectId,
      key: projectData.key,
      name: projectData.name,
      description: projectData.description,
      ownerId: owner.id,
    });

    // Insert project_member with role='owner'
    await db.insert(projectMembers).values({
      projectId,
      userId: owner.id,
      role: "owner",
    });

    console.log(`  ✅ Created: ${projectData.key} - ${projectData.name}`);
    return true;
  } catch (error) {
    console.error(`  ❌ Failed: ${projectData.key}`, error);
    return false;
  }
}

/**
 * Seed test projects
 */
async function seedProjects(db: NodePgDatabase): Promise<void> {
  console.log("\n📁 Seeding test projects...");

  let created = 0;
  let existing = 0;

  for (const projectData of TEST_PROJECTS) {
    const wasCreated = await seedProject(db, projectData);
    if (wasCreated) {
      created += 1;
    } else {
      existing += 1;
    }
  }

  console.log(
    `📊 Projects summary: ${created} created, ${existing} existing/skipped`
  );
}

/**
 * Main seed function
 * Orchestrates all seeding operations
 */
async function seed() {
  const env = process.env.NODE_ENV || "development";
  console.log(`🌱 Starting database seeding (${env})...`);

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const db = drizzle(pool);

  try {
    // Seed authentication users (idempotent)
    await seedAuthUsers(db);

    // Seed projects (after users, since projects need owners)
    await seedProjects(db);

    console.log("\n✅ All seeding completed successfully");
    console.log("\n📝 Test credentials (verified):");
    console.log("  • test@example.com / TestPassword123!");
    console.log("  • admin@example.com / AdminPassword123!");
    console.log("  • demo@example.com / DemoPassword123!");
    console.log("\n📝 Test credentials (unverified):");
    console.log("  • unverified@example.com / UnverifiedPassword123!");
    console.log("\n📁 Test projects:");
    console.log("  • MKT - Marketing Campaign Q1 (test@example.com)");
    console.log("  • PROD - Product Launch (test@example.com)");
    console.log("  • DEMO - Demo Project (demo@example.com)");
  } catch (error) {
    console.error("\n❌ Seeding failed:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run seed if executed directly
seed();
