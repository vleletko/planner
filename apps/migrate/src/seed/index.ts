import { randomBytes, randomUUID, scrypt } from "node:crypto";
import { account, user } from "@planner/db/schema/auth";
import { projectMembers, projects } from "@planner/db/schema/projects";
import { eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { type SeedProjectData, TEST_PROJECTS } from "./projects";
import { type SeedUserData, TEST_USERS } from "./test";

/**
 * Seed profiles:
 * - none: No seeding (production)
 * - test: Test data for dev/preview/e2e
 */
type SeedProfile = "none" | "test";

/**
 * Hash password using Better Auth's scrypt parameters
 * Format: ${salt}:${hash} (same as Better Auth internal)
 * Config: N=16384, r=16, p=1, dkLen=64
 * maxmem = 128 * N * r * 2 (same as Better Auth)
 */
function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const normalized = password.normalize("NFKC");
  // Memory limit: 128 * N * r * 2 = 128 * 16384 * 16 * 2 = 67MB
  const maxmem = 128 * 16_384 * 16 * 2;

  return new Promise((resolve, reject) => {
    scrypt(
      normalized,
      salt,
      64,
      { N: 16_384, r: 16, p: 1, maxmem },
      (err, key) => {
        if (err) {
          reject(err);
        } else {
          resolve(`${salt}:${key.toString("hex")}`);
        }
      }
    );
  });
}

/**
 * Seed a single user directly into the database
 * Uses scrypt hash compatible with Better Auth
 */
async function seedUser(
  db: NodePgDatabase,
  userData: SeedUserData
): Promise<boolean> {
  try {
    // Check if user already exists (idempotent)
    const existing = await db
      .select()
      .from(user)
      .where(eq(user.email, userData.email))
      .limit(1);

    if (existing.length > 0) {
      console.log(`  ⏭️  User exists: ${userData.email}`);
      return false;
    }

    const now = new Date();
    const userId = randomUUID();
    const accountId = randomUUID();

    // Hash password using Better Auth compatible scrypt
    const hashedPassword = await hashPassword(userData.password);

    // Insert user
    await db.insert(user).values({
      id: userId,
      name: userData.name,
      email: userData.email,
      emailVerified: userData.emailVerified ?? false,
      createdAt: now,
      updatedAt: now,
    });

    // Insert account (credential provider)
    await db.insert(account).values({
      id: accountId,
      accountId: userData.email,
      providerId: "credential",
      userId,
      password: hashedPassword,
      createdAt: now,
      updatedAt: now,
    });

    const status = userData.emailVerified ? "✅" : "📧";
    console.log(`  ${status} Created: ${userData.email}`);
    return true;
  } catch (error) {
    console.error(`  ❌ Failed: ${userData.email}`, error);
    return false;
  }
}

/**
 * Seed a single project directly into the database
 */
async function seedProject(
  db: NodePgDatabase,
  projectData: SeedProjectData
): Promise<boolean> {
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

    // Insert additional members if specified
    if (projectData.members && projectData.members.length > 0) {
      for (const member of projectData.members) {
        const memberResult = await db
          .select()
          .from(user)
          .where(eq(user.email, member.email))
          .limit(1);

        if (memberResult.length === 0) {
          console.log(`    ⚠️  Member not found: ${member.email}, skipping`);
          continue;
        }

        await db.insert(projectMembers).values({
          projectId,
          userId: memberResult[0].id,
          role: member.role,
        });
        console.log(`    👤 Added member: ${member.email} (${member.role})`);
      }
    }

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
async function seedProjectsProfile(db: NodePgDatabase): Promise<void> {
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

  console.log(`📊 Summary: ${created} created, ${existing} existing/skipped`);
}

/**
 * Seed test users
 */
async function seedTestProfile(db: NodePgDatabase): Promise<void> {
  console.log("\n👤 Seeding test users...");

  let created = 0;
  let existing = 0;

  for (const userData of TEST_USERS) {
    const wasCreated = await seedUser(db, userData);
    if (wasCreated) {
      created += 1;
    } else {
      existing += 1;
    }
  }

  console.log(`📊 Summary: ${created} created, ${existing} existing`);
  console.log("\n📝 Test credentials:");
  console.log("  • test@example.com / TestPassword123!");
  console.log("  • admin@example.com / AdminPassword123!");
  console.log("  • demo@example.com / DemoPassword123!");
  console.log("  • unverified@example.com / UnverifiedPassword123!");

  // Seed projects after users (projects need owners)
  await seedProjectsProfile(db);
}

/**
 * Run seeding based on SEED_PROFILE environment variable
 */
export async function runSeeding(db: NodePgDatabase): Promise<void> {
  const profile = (process.env.SEED_PROFILE || "none") as SeedProfile;

  console.log(`\n🌱 Seed profile: ${profile}`);

  if (profile === "none") {
    console.log("⏭️  Seeding skipped (SEED_PROFILE=none)");
    return;
  }

  if (profile === "test") {
    await seedTestProfile(db);
    return;
  }

  console.log(`⚠️  Unknown seed profile: ${profile}, skipping`);
}
