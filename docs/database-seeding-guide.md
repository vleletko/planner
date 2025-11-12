# Database Seeding Guide: Drizzle ORM + Better Auth

A comprehensive guide to implementing production-grade database seeding for projects using Drizzle ORM and Better Auth.

## Table of Contents

1. [Overview](#overview)
2. [Core Concepts](#core-concepts)
3. [Drizzle ORM Seeding Best Practices](#drizzle-orm-seeding-best-practices)
4. [Better Auth User Seeding](#better-auth-user-seeding)
5. [Code Organization](#code-organization)
6. [Advanced Patterns](#advanced-patterns)
7. [Environment-Specific Seeding](#environment-specific-seeding)
8. [Implementation Examples](#implementation-examples)
9. [References](#references)

---

## Overview

Database seeding is the process of populating a database with initial data for development, testing, or production environments. This guide covers modern approaches using Drizzle ORM and Better Auth in 2025.

### Key Principles

- **Idempotency**: Seeds should be safely re-runnable without creating duplicates
- **Determinism**: For testing, seeds should generate consistent data
- **Separation of Concerns**: Keep seed logic separate from migrations
- **Environment Awareness**: Different data for dev, test, and production
- **Type Safety**: Leverage TypeScript for compile-time validation

---

## Core Concepts

### What is Database Seeding?

Database seeding populates your database with:
- **Initial/Required Data**: Essential records for app functionality (e.g., default roles, settings)
- **Development Data**: Realistic data for local development (10-50 records per table)
- **Test Data**: Controlled, deterministic data for automated tests
- **Production Seeds**: Minimal required data for production deployments

### Idempotency

**Definition**: Your seed script should produce the same result regardless of how many times it runs.

**Why It Matters**:
- Prevents duplicate records during development
- Safe to run after database refreshes
- Can be used in CI/CD pipelines
- Supports iterative development workflows

**How to Achieve**:
```typescript
// ✅ Good: Check for existence before inserting
const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
if (existing.length === 0) {
  await db.insert(users).values(userData);
}

// ✅ Better: Use upsert (insert or update)
await db.insert(users).values(userData).onConflictDoUpdate({
  target: users.email,
  set: { updatedAt: new Date() }
});

// ❌ Bad: Always insert
await db.insert(users).values(userData); // Creates duplicates!
```

---

## Drizzle ORM Seeding Best Practices

### Approach 1: Official drizzle-seed Package (Recommended for 2025)

The official `drizzle-seed` package provides deterministic fake data generation.

#### Installation

```bash
npm install drizzle-seed
# or
bun add drizzle-seed
```

**Requirements**: `drizzle-orm` version 0.38.0 or higher

#### Basic Usage

```typescript
import { seed } from "drizzle-seed";
import { db } from "./db";
import * as schema from "./schema";

// Seed with default settings (10 records per table)
await seed(db, schema);

// Seed with custom count
await seed(db, schema, { count: 100 });

// Seed with deterministic output
await seed(db, schema, { seed: 12345 });
```

#### Advanced Usage with Refinements

```typescript
await seed(db, schema).refine((f) => ({
  users: {
    columns: {
      name: f.fullName(),
      email: f.email(),
      createdAt: f.date({ minDate: "2024-01-01", maxDate: "2024-12-31" }),
    },
    count: 50,
  },
  posts: {
    columns: {
      title: f.loremIpsum({ sentencesCount: 1 }),
      content: f.loremIpsum({ sentencesCount: 10 }),
    },
    with: {
      comments: 5, // Create 5 comments per post
    },
  },
}));
```

#### Built-in Generator Functions

Drizzle-seed provides extensive generators:

**Personal Data**:
- `fullName()`, `firstName()`, `lastName()`
- `email()`, `phoneNumber()`
- `jobTitle()`

**Location**:
- `streetAddress()`, `city()`, `state()`, `country()`, `postcode()`

**Company**:
- `companyName()`

**Numbers & Dates**:
- `int({ minValue, maxValue })`
- `number({ minValue, maxValue, precision })`
- `date({ minDate, maxDate })`

**Text**:
- `loremIpsum({ sentencesCount })`

**Utilities**:
- `valuesFromArray(array)` - Pick random value from array
- `default(value)` - Use specific default value
- `weightedRandom()` - Apply probability distributions

#### Weighted Random for Realistic Data

```typescript
await seed(db, schema).refine((f) => ({
  products: {
    columns: {
      // 70% of products cost $100-300, 30% cost $10-100
      price: f.weightedRandom([
        { weight: 0.7, value: f.number({ minValue: 100, maxValue: 300 }) },
        { weight: 0.3, value: f.number({ minValue: 10, maxValue: 100 }) },
      ]),
    },
  },
}));
```

#### Database Reset

```typescript
import { reset } from "drizzle-seed";

// Reset database before seeding (removes all data)
await reset(db, schema);
await seed(db, schema);
```

**Reset Strategies by Database**:
- **PostgreSQL**: `TRUNCATE ... CASCADE`
- **MySQL**: Disables `FOREIGN_KEY_CHECKS`, then `TRUNCATE`
- **SQLite**: Disables `foreign_keys` pragma, uses `DELETE FROM`

### Approach 2: Faker.js + Manual Seeding

For maximum control, use `@faker-js/faker` with Drizzle's insert operations.

#### Installation

```bash
npm install -D @faker-js/faker
```

#### Basic Pattern

```typescript
import { faker } from "@faker-js/faker";
import { db } from "./db";
import { users } from "./schema";

async function seedUsers() {
  const userData = Array.from({ length: 50 }).map(() => ({
    id: faker.string.uuid(),
    name: faker.person.fullName(),
    email: faker.internet.email(),
    avatar: faker.image.avatar(),
    createdAt: new Date(),
    updatedAt: new Date(),
  }));

  await db.insert(users).values(userData);
}
```

#### Idempotent Pattern with Faker

```typescript
import { faker } from "@faker-js/faker";
import { db } from "./db";
import { users } from "./schema";
import { eq } from "drizzle-orm";

async function seedUsersIdempotent() {
  const testEmails = [
    "admin@example.com",
    "user@example.com",
    "test@example.com",
  ];

  for (const email of testEmails) {
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(users).values({
        id: faker.string.uuid(),
        name: faker.person.fullName(),
        email,
        emailVerified: true,
        image: faker.image.avatar(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log(`✅ Created user: ${email}`);
    } else {
      console.log(`⏭️  User already exists: ${email}`);
    }
  }
}
```

### Approach 3: Factory Pattern with @praha/drizzle-factory

For explicit test data generation (focuses on generating only needed data for each test).

```typescript
import { createFactory } from "@praha/drizzle-factory";
import { users } from "./schema";

const userFactory = createFactory(users, {
  name: () => faker.person.fullName(),
  email: () => faker.internet.email(),
});

// In tests
const testUser = await userFactory.create();
const manyUsers = await userFactory.createMany(10);
```

### Handling Relationships and Foreign Keys

When seeding tables with foreign key relationships:

#### 1. Expose All Related Tables

```typescript
// ✅ Good: Both parent and child tables exposed
await seed(db, { users, posts, comments });

// ❌ Bad: Child table missing, can't generate foreign keys
await seed(db, { posts });
```

#### 2. Use the `with` Option

```typescript
await seed(db, schema).refine((f) => ({
  users: {
    count: 10,
    with: {
      posts: 5, // Each user gets 5 posts
    },
  },
  posts: {
    with: {
      comments: [
        { weight: 0.7, count: [3, 4, 5] }, // 70% of posts get 3-5 comments
        { weight: 0.3, count: [0, 1, 2] }, // 30% get 0-2 comments
      ],
    },
  },
}));
```

#### 3. Define Foreign Key Actions

In your schema, specify cascade behavior:

```typescript
import { pgTable, text, integer } from "drizzle-orm/pg-core";

export const posts = pgTable("posts", {
  id: integer("id").primaryKey(),
  authorId: integer("author_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
});
```

#### 4. Manual Foreign Key Handling

```typescript
// Insert parents first
const [user1, user2] = await db.insert(users).values([
  { name: "User 1", email: "user1@example.com" },
  { name: "User 2", email: "user2@example.com" },
]).returning();

// Then insert children with valid foreign keys
await db.insert(posts).values([
  { authorId: user1.id, title: "Post by User 1" },
  { authorId: user2.id, title: "Post by User 2" },
]);
```

---

## Better Auth User Seeding

Better Auth uses a specific schema structure with separate tables for users, accounts, and sessions.

### Understanding Better Auth Schema

Better Auth stores authentication data across multiple tables:

```typescript
// User table - Core user information
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

// Account table - Provider-specific auth data (including passwords)
export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(), // "credential" for email/password
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  password: text("password"), // Hashed password stored here
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  // ... other fields
});

// Session table - Active sessions
export const session = pgTable("session", {
  id: text("id").primaryKey(),
  token: text("token").notNull().unique(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at").notNull(),
  // ... other fields
});
```

### Password Hashing in Better Auth

Better Auth uses **scrypt** algorithm by default for password hashing. This is:
- Memory-hard and CPU-intensive
- Resistant to brute-force attacks
- Configurable if needed

### Method 1: Using Better Auth API (Recommended)

The safest way to seed users is through Better Auth's built-in API.

#### Using signUp.email (Server-Side)

```typescript
import { auth } from "./auth"; // Your Better Auth instance

async function seedUsersWithAuth() {
  const testUsers = [
    {
      name: "Admin User",
      email: "admin@example.com",
      password: "SecurePassword123!",
    },
    {
      name: "Test User",
      email: "test@example.com",
      password: "TestPassword123!",
    },
  ];

  for (const userData of testUsers) {
    try {
      const result = await auth.api.signUpEmail({
        body: userData,
      });
      console.log(`✅ Created user: ${userData.email}`);
    } catch (error) {
      // User might already exist
      console.log(`⏭️  User already exists or error: ${userData.email}`);
    }
  }
}
```

#### Using Admin Plugin (Recommended for Admin Tasks)

First, add the admin plugin to your Better Auth config:

```typescript
import { betterAuth } from "better-auth";
import { admin } from "better-auth/plugins";

export const auth = betterAuth({
  // ... other config
  plugins: [
    admin({
      defaultRole: "user",
    }),
  ],
});
```

Then seed users:

```typescript
import { auth } from "./auth";

async function seedUsersWithAdmin() {
  const users = [
    {
      email: "admin@example.com",
      password: "SecurePassword123!",
      name: "Admin User",
      role: "admin",
    },
    {
      email: "user@example.com",
      password: "UserPassword123!",
      name: "Regular User",
      role: "user",
    },
  ];

  for (const userData of users) {
    try {
      const newUser = await auth.api.createUser({
        body: userData,
      });
      console.log(`✅ Created user: ${userData.email}`);
    } catch (error) {
      console.log(`⏭️  User already exists: ${userData.email}`);
    }
  }
}
```

### Method 2: Direct Database Seeding (Advanced)

For direct database seeding, you need to hash passwords manually.

#### Understanding Password Storage

- Passwords are NOT in the `user` table
- Passwords are stored in the `account` table
- The `providerId` must be set to `"credential"` for email/password auth
- Passwords must be hashed using the same algorithm Better Auth uses

#### Using Better Auth's Hash Function

```typescript
import { db } from "./db";
import { user, account } from "./schema/auth";
import { auth } from "./auth";
import { nanoid } from "nanoid"; // or your preferred ID generator

async function seedUsersDirectly() {
  const testUsers = [
    {
      name: "Test User",
      email: "test@example.com",
      password: "TestPassword123!",
    },
  ];

  for (const userData of testUsers) {
    // Check if user exists
    const existing = await db
      .select()
      .from(user)
      .where(eq(user.email, userData.email))
      .limit(1);

    if (existing.length > 0) {
      console.log(`⏭️  User already exists: ${userData.email}`);
      continue;
    }

    const userId = nanoid();
    const now = new Date();

    // Create user record
    await db.insert(user).values({
      id: userId,
      name: userData.name,
      email: userData.email,
      emailVerified: true,
      image: null,
      createdAt: now,
      updatedAt: now,
    });

    // Hash password using Better Auth's configured hash function
    // This requires access to Better Auth's internal configuration
    const hashedPassword = await auth.options.emailAndPassword?.password?.hash(
      userData.password
    );

    // Create account record with hashed password
    await db.insert(account).values({
      id: nanoid(),
      accountId: userId,
      providerId: "credential", // Important: must be "credential" for email/password
      userId: userId,
      password: hashedPassword,
      createdAt: now,
      updatedAt: now,
    });

    console.log(`✅ Created user: ${userData.email}`);
  }
}
```

#### Custom Password Hashing

If you need custom hashing, configure Better Auth:

```typescript
import { betterAuth } from "better-auth";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

export const auth = betterAuth({
  emailAndPassword: {
    enabled: true,
    password: {
      hash: async (password: string) => {
        const salt = randomBytes(16).toString("hex");
        const buf = (await scryptAsync(password, salt, 64)) as Buffer;
        return `${buf.toString("hex")}.${salt}`;
      },
      verify: async ({ hash, password }: { hash: string; password: string }) => {
        const [hashedPassword, salt] = hash.split(".");
        const buf = (await scryptAsync(password, salt, 64)) as Buffer;
        return buf.toString("hex") === hashedPassword;
      },
    },
  },
});
```

### Complete Better Auth Seed Example

```typescript
import dotenv from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { eq } from "drizzle-orm";
import { user, account } from "./schema/auth";
import { auth } from "./auth";
import { nanoid } from "nanoid";

dotenv.config();

async function seedBetterAuthUsers() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);

  try {
    console.log("🌱 Seeding Better Auth users...");

    const testUsers = [
      {
        name: "Admin User",
        email: "admin@example.com",
        password: "AdminPassword123!",
        emailVerified: true,
      },
      {
        name: "Test User",
        email: "test@example.com",
        password: "TestPassword123!",
        emailVerified: true,
      },
      {
        name: "Demo User",
        email: "demo@example.com",
        password: "DemoPassword123!",
        emailVerified: false,
      },
    ];

    for (const userData of testUsers) {
      // Check for existing user
      const existing = await db
        .select()
        .from(user)
        .where(eq(user.email, userData.email))
        .limit(1);

      if (existing.length > 0) {
        console.log(`⏭️  User already exists: ${userData.email}`);
        continue;
      }

      // Use Better Auth API for safety and consistency
      try {
        await auth.api.signUpEmail({
          body: {
            name: userData.name,
            email: userData.email,
            password: userData.password,
          },
        });
        console.log(`✅ Created user: ${userData.email}`);
      } catch (error) {
        console.error(`❌ Failed to create user ${userData.email}:`, error);
      }
    }

    console.log("✅ Better Auth user seeding completed");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

seedBetterAuthUsers().catch(console.error);
```

---

## Code Organization

### Recommended Project Structure

```
packages/db/
├── src/
│   ├── schema/
│   │   ├── auth.ts          # Better Auth tables
│   │   ├── users.ts         # Extended user data
│   │   ├── posts.ts         # Application tables
│   │   └── index.ts         # Export all schemas
│   ├── seeds/
│   │   ├── index.ts         # Main seed runner
│   │   ├── auth.seed.ts     # Auth-specific seeds
│   │   ├── users.seed.ts    # User data seeds
│   │   ├── posts.seed.ts    # Post data seeds
│   │   └── factories/
│   │       ├── user.factory.ts
│   │       └── post.factory.ts
│   ├── utils/
│   │   ├── seed-helpers.ts  # Reusable seed utilities
│   │   └── faker-helpers.ts # Custom Faker utilities
│   ├── index.ts             # DB connection export
│   ├── seed.ts              # Seed script entry point
│   └── migrate.ts           # Migration runner
├── drizzle.config.ts
└── package.json
```

### Main Seed Runner Pattern

**`src/seeds/index.ts`**:
```typescript
import dotenv from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { seedAuth } from "./auth.seed";
import { seedUsers } from "./users.seed";
import { seedPosts } from "./posts.seed";

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

export async function runSeeds() {
  console.log("🌱 Starting database seeding...\n");

  try {
    // Seed in order of dependencies
    await seedAuth(db);
    await seedUsers(db);
    await seedPosts(db);

    console.log("\n✅ All seeds completed successfully");
  } catch (error) {
    console.error("\n❌ Seeding failed:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runSeeds().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
```

### Individual Seed Files

**`src/seeds/auth.seed.ts`**:
```typescript
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import { user, account } from "../schema/auth";
import { auth } from "../../auth";

export async function seedAuth(db: NodePgDatabase) {
  console.log("👤 Seeding authentication users...");

  const authUsers = [
    {
      name: "Admin User",
      email: "admin@example.com",
      password: "AdminPassword123!",
    },
    {
      name: "Test User",
      email: "test@example.com",
      password: "TestPassword123!",
    },
  ];

  for (const userData of authUsers) {
    const existing = await db
      .select()
      .from(user)
      .where(eq(user.email, userData.email))
      .limit(1);

    if (existing.length === 0) {
      try {
        await auth.api.signUpEmail({ body: userData });
        console.log(`  ✅ Created: ${userData.email}`);
      } catch (error) {
        console.error(`  ❌ Failed: ${userData.email}`, error);
      }
    } else {
      console.log(`  ⏭️  Exists: ${userData.email}`);
    }
  }
}
```

**`src/seeds/users.seed.ts`**:
```typescript
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { faker } from "@faker-js/faker";
import { users } from "../schema/users";

export async function seedUsers(db: NodePgDatabase) {
  console.log("👥 Seeding user profiles...");

  // Check if we need to seed
  const count = await db.select({ count: sql<number>`count(*)` }).from(users);
  if (count[0].count > 2) {
    console.log("  ⏭️  Users already seeded");
    return;
  }

  const userData = Array.from({ length: 20 }).map(() => ({
    id: faker.string.uuid(),
    name: faker.person.fullName(),
    bio: faker.lorem.sentence(),
    avatar: faker.image.avatar(),
    createdAt: new Date(),
    updatedAt: new Date(),
  }));

  await db.insert(users).values(userData);
  console.log(`  ✅ Created ${userData.length} users`);
}
```

### Factory Pattern for Reusability

**`src/seeds/factories/user.factory.ts`**:
```typescript
import { faker } from "@faker-js/faker";
import type { InferInsertModel } from "drizzle-orm";
import type { user } from "../../schema/auth";

type UserInsert = InferInsertModel<typeof user>;

export function createUserData(overrides?: Partial<UserInsert>): UserInsert {
  const now = new Date();

  return {
    id: faker.string.uuid(),
    name: faker.person.fullName(),
    email: faker.internet.email(),
    emailVerified: faker.datatype.boolean({ probability: 0.8 }),
    image: faker.image.avatar(),
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

export function createUserDataBatch(
  count: number,
  overrides?: Partial<UserInsert>
): UserInsert[] {
  return Array.from({ length: count }, () => createUserData(overrides));
}
```

Usage:
```typescript
import { createUserData, createUserDataBatch } from "./factories/user.factory";

// Single user with custom email
const admin = createUserData({ email: "admin@example.com", emailVerified: true });

// Batch of users
const testUsers = createUserDataBatch(50);
```

### Utility Helpers

**`src/utils/seed-helpers.ts`**:
```typescript
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { sql } from "drizzle-orm";

/**
 * Check if a table has any records
 */
export async function tableHasData(
  db: NodePgDatabase,
  tableName: string
): Promise<boolean> {
  const result = await db.execute(
    sql.raw(`SELECT EXISTS(SELECT 1 FROM ${tableName}) as has_data`)
  );
  return result.rows[0].has_data;
}

/**
 * Get count of records in a table
 */
export async function getTableCount(
  db: NodePgDatabase,
  tableName: string
): Promise<number> {
  const result = await db.execute(
    sql.raw(`SELECT COUNT(*) as count FROM ${tableName}`)
  );
  return Number.parseInt(result.rows[0].count);
}

/**
 * Check if seed should run based on existing data
 */
export async function shouldSeed(
  db: NodePgDatabase,
  tableName: string,
  threshold = 0
): Promise<boolean> {
  const count = await getTableCount(db, tableName);
  return count <= threshold;
}
```

Usage:
```typescript
import { shouldSeed } from "../utils/seed-helpers";

export async function seedPosts(db: NodePgDatabase) {
  if (!(await shouldSeed(db, "posts", 5))) {
    console.log("  ⏭️  Posts already seeded");
    return;
  }

  // Proceed with seeding...
}
```

---

## Advanced Patterns

### 1. Deterministic Seeding for Tests

Use a fixed seed for consistent test data:

```typescript
import { seed } from "drizzle-seed";

// Always generates same data
await seed(db, schema, { seed: 12345, count: 10 });
```

### 2. Weighted Random Distribution

Create realistic data distributions:

```typescript
await seed(db, schema).refine((f) => ({
  orders: {
    columns: {
      status: f.weightedRandom([
        { weight: 0.6, value: "delivered" },
        { weight: 0.2, value: "pending" },
        { weight: 0.15, value: "processing" },
        { weight: 0.05, value: "cancelled" },
      ]),
      amount: f.weightedRandom([
        { weight: 0.7, value: f.number({ minValue: 10, maxValue: 100 }) },
        { weight: 0.25, value: f.number({ minValue: 100, maxValue: 500 }) },
        { weight: 0.05, value: f.number({ minValue: 500, maxValue: 2000 }) },
      ]),
    },
  },
}));
```

### 3. Date Range Generation

Create data across time periods:

```typescript
await seed(db, schema).refine((f) => ({
  posts: {
    columns: {
      createdAt: f.date({
        minDate: "2024-01-01",
        maxDate: "2024-12-31",
      }),
    },
  },
}));
```

### 4. Custom Faker Utilities

**`src/utils/faker-helpers.ts`**:
```typescript
import { faker } from "@faker-js/faker";

/**
 * Generate a realistic username
 */
export function username(): string {
  return faker.internet
    .userName()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_");
}

/**
 * Generate a realistic slug from a title
 */
export function slug(title?: string): string {
  const base = title || faker.lorem.words(3);
  return base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Generate a date within the last N days
 */
export function recentDate(days = 30): Date {
  return faker.date.recent({ days });
}

/**
 * Generate a future date within N days
 */
export function futureDate(days = 30): Date {
  return faker.date.soon({ days });
}

/**
 * Pick a random item from array
 */
export function randomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Generate a realistic bio
 */
export function bio(): string {
  return faker.helpers.arrayElement([
    faker.company.catchPhrase(),
    faker.lorem.sentence(),
    `${faker.person.jobTitle()} at ${faker.company.name()}`,
  ]);
}
```

### 5. Transaction-Based Seeding

For complex, multi-table seeds:

```typescript
import { db } from "./db";

async function seedWithTransaction() {
  await db.transaction(async (tx) => {
    // All seeds in transaction
    const [user1] = await tx.insert(users).values({
      name: "Test User",
      email: "test@example.com",
    }).returning();

    await tx.insert(posts).values({
      authorId: user1.id,
      title: "First Post",
    });

    await tx.insert(comments).values({
      postId: 1,
      authorId: user1.id,
      content: "Great post!",
    });
  });
}
```

### 6. Conditional Seeding Based on Environment

```typescript
const seedCounts = {
  development: { users: 50, posts: 200 },
  test: { users: 10, posts: 30 },
  staging: { users: 100, posts: 500 },
  production: { users: 0, posts: 0 }, // No fake data in production
};

const env = process.env.NODE_ENV || "development";
const counts = seedCounts[env];

if (counts.users > 0) {
  await seed(db, schema, { count: counts.users });
}
```

---

## Environment-Specific Seeding

### Strategy 1: Separate Seed Files

```
src/seeds/
├── dev/
│   ├── users.seed.ts       # 50+ users with realistic data
│   └── posts.seed.ts       # 200+ posts
├── test/
│   ├── users.seed.ts       # 10 controlled users
│   └── posts.seed.ts       # 30 posts for testing
├── staging/
│   ├── users.seed.ts       # Production-like volume
│   └── posts.seed.ts
└── production/
    ├── required.seed.ts    # Only essential data
    └── defaults.seed.ts
```

**Main seed runner**:
```typescript
const env = process.env.NODE_ENV || "development";

export async function runSeeds() {
  console.log(`🌱 Seeding for environment: ${env}\n`);

  switch (env) {
    case "development":
      await import("./dev/users.seed").then((m) => m.seed(db));
      await import("./dev/posts.seed").then((m) => m.seed(db));
      break;

    case "test":
      await import("./test/users.seed").then((m) => m.seed(db));
      await import("./test/posts.seed").then((m) => m.seed(db));
      break;

    case "staging":
      await import("./staging/users.seed").then((m) => m.seed(db));
      await import("./staging/posts.seed").then((m) => m.seed(db));
      break;

    case "production":
      await import("./production/required.seed").then((m) => m.seed(db));
      break;

    default:
      throw new Error(`Unknown environment: ${env}`);
  }
}
```

### Strategy 2: Configuration-Based Seeding

**`src/seeds/config.ts`**:
```typescript
export const seedConfig = {
  development: {
    users: { count: 50, verified: 0.8 },
    posts: { count: 200, perUser: [3, 10] },
    comments: { count: 500, perPost: [0, 8] },
  },
  test: {
    users: { count: 10, verified: 1.0 },
    posts: { count: 30, perUser: [2, 4] },
    comments: { count: 60, perPost: [1, 3] },
  },
  staging: {
    users: { count: 100, verified: 0.85 },
    posts: { count: 500, perUser: [3, 10] },
    comments: { count: 1000, perPost: [0, 10] },
  },
  production: {
    users: { count: 0, verified: 0 },
    posts: { count: 0, perUser: [0, 0] },
    comments: { count: 0, perPost: [0, 0] },
  },
} as const;

export function getConfig() {
  const env = process.env.NODE_ENV || "development";
  return seedConfig[env] || seedConfig.development;
}
```

Usage:
```typescript
import { getConfig } from "./config";

const config = getConfig();

await seed(db, schema).refine((f) => ({
  users: {
    count: config.users.count,
    columns: {
      emailVerified: f.weightedRandom([
        { weight: config.users.verified, value: true },
        { weight: 1 - config.users.verified, value: false },
      ]),
    },
  },
}));
```

### Strategy 3: Environment Variables

```typescript
const SEED_USERS = Number.parseInt(process.env.SEED_USERS || "10");
const SEED_POSTS = Number.parseInt(process.env.SEED_POSTS || "50");
const SEED_ENABLED = process.env.SEED_ENABLED !== "false";

if (SEED_ENABLED) {
  await seed(db, schema).refine((f) => ({
    users: { count: SEED_USERS },
    posts: { count: SEED_POSTS },
  }));
}
```

**.env.development**:
```bash
SEED_ENABLED=true
SEED_USERS=50
SEED_POSTS=200
```

**.env.production**:
```bash
SEED_ENABLED=false
```

### Strategy 4: CLI Arguments

```typescript
// src/seed.ts
import { runSeeds } from "./seeds";

const args = process.argv.slice(2);
const env = args.find((arg) => arg.startsWith("--env="))?.split("=")[1];
const reset = args.includes("--reset");

if (env) {
  process.env.NODE_ENV = env;
}

if (reset) {
  console.log("🗑️  Resetting database...");
  await import("drizzle-seed").then((m) => m.reset(db, schema));
}

await runSeeds();
```

Usage:
```bash
# Development seeding
npm run db:seed

# Test environment seeding
npm run db:seed -- --env=test

# Reset and seed
npm run db:seed -- --reset

# Staging with reset
npm run db:seed -- --env=staging --reset
```

---

## Implementation Examples

### Example 1: Basic Project Seed Script

**`packages/db/src/seed.ts`**:
```typescript
import dotenv from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { eq } from "drizzle-orm";
import { user } from "./schema/auth";
import { auth } from "../../auth/src";

dotenv.config({ path: "../../apps/web/.env" });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

async function seed() {
  console.log("🌱 Seeding database...");

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);

  try {
    // Seed test users
    const testUsers = [
      {
        name: "Test User",
        email: "test@example.com",
        password: "TestPassword123!",
      },
      {
        name: "Admin User",
        email: "admin@example.com",
        password: "AdminPassword123!",
      },
    ];

    for (const userData of testUsers) {
      const existing = await db
        .select()
        .from(user)
        .where(eq(user.email, userData.email))
        .limit(1);

      if (existing.length === 0) {
        await auth.api.signUpEmail({ body: userData });
        console.log(`✅ Created user: ${userData.email}`);
      } else {
        console.log(`⏭️  User already exists: ${userData.email}`);
      }
    }

    console.log("✅ Seeding completed successfully");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seed();
```

### Example 2: Production-Ready Multi-Table Seed

**`packages/db/src/seeds/index.ts`**:
```typescript
import dotenv from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../schema";
import { seedAuth } from "./auth.seed";
import { seedProjects } from "./projects.seed";
import { seedTasks } from "./tasks.seed";
import { shouldSeed } from "../utils/seed-helpers";

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

export async function runSeeds() {
  const env = process.env.NODE_ENV || "development";
  console.log(`🌱 Starting database seeding (${env})...\n`);

  try {
    // Always seed auth users (idempotent)
    await seedAuth(db);

    // Only seed sample data in dev/test
    if (env === "development" || env === "test") {
      if (await shouldSeed(db, "projects", 5)) {
        await seedProjects(db);
      } else {
        console.log("📦 Projects already seeded");
      }

      if (await shouldSeed(db, "tasks", 20)) {
        await seedTasks(db);
      } else {
        console.log("✅ Tasks already seeded");
      }
    }

    console.log("\n✅ All seeds completed successfully");
  } catch (error) {
    console.error("\n❌ Seeding failed:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runSeeds().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
```

**`packages/db/src/seeds/projects.seed.ts`**:
```typescript
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { faker } from "@faker-js/faker";
import { projects, user } from "../schema";
import { randomItem } from "../utils/faker-helpers";

export async function seedProjects(db: NodePgDatabase) {
  console.log("📦 Seeding projects...");

  // Get existing users to assign as project owners
  const users = await db.select({ id: user.id }).from(user).limit(10);

  if (users.length === 0) {
    console.log("  ⚠️  No users found, skipping projects seed");
    return;
  }

  const projectData = Array.from({ length: 15 }).map(() => ({
    id: faker.string.uuid(),
    name: faker.company.catchPhrase(),
    description: faker.lorem.paragraph(),
    ownerId: randomItem(users).id,
    status: randomItem(["active", "completed", "archived"]),
    startDate: faker.date.past(),
    endDate: faker.date.future(),
    createdAt: new Date(),
    updatedAt: new Date(),
  }));

  await db.insert(projects).values(projectData);
  console.log(`  ✅ Created ${projectData.length} projects`);
}
```

### Example 3: Test-Specific Seed with Factories

**`tests/helpers/seed.ts`**:
```typescript
import { seed } from "drizzle-seed";
import { reset } from "drizzle-seed";
import { db } from "@planner/db";
import * as schema from "@planner/db/schema";

/**
 * Reset and seed database for tests
 */
export async function seedTestDatabase() {
  // Reset all data
  await reset(db, schema);

  // Seed with deterministic data
  await seed(db, schema, {
    seed: 99999, // Fixed seed for consistent tests
    count: 10,
  }).refine((f) => ({
    users: {
      columns: {
        name: f.fullName(),
        email: f.email(),
        emailVerified: f.default(true),
      },
      count: 5,
    },
    projects: {
      columns: {
        name: f.companyName(),
        status: f.valuesFromArray(["active", "completed"]),
      },
      count: 10,
      with: {
        tasks: [
          { weight: 0.5, count: [3, 5] },
          { weight: 0.5, count: [6, 10] },
        ],
      },
    },
  }));
}
```

Usage in tests:
```typescript
import { describe, it, beforeEach, expect } from "vitest";
import { seedTestDatabase } from "./helpers/seed";
import { db } from "@planner/db";

describe("Project API", () => {
  beforeEach(async () => {
    await seedTestDatabase();
  });

  it("should list all projects", async () => {
    const projects = await db.query.projects.findMany();
    expect(projects).toHaveLength(10); // Deterministic count
  });
});
```

---

## Package.json Scripts

Add these scripts to your `packages/db/package.json`:

```json
{
  "scripts": {
    "db:push": "drizzle-kit push",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "bun run src/migrate.ts",
    "db:seed": "bun run src/seed.ts",
    "db:seed:dev": "NODE_ENV=development bun run src/seed.ts",
    "db:seed:test": "NODE_ENV=test bun run src/seed.ts",
    "db:seed:staging": "NODE_ENV=staging bun run src/seed.ts",
    "db:reset": "bun run src/seed.ts --reset",
    "db:studio": "drizzle-kit studio"
  }
}
```

---

## Best Practices Checklist

### General

- ✅ Use idempotent seeding (check for existing data)
- ✅ Separate seed logic from migrations
- ✅ Use transactions for multi-table seeds
- ✅ Log progress with clear messages
- ✅ Handle errors gracefully
- ✅ Close database connections properly
- ✅ Use TypeScript for type safety
- ✅ Keep seed scripts in version control

### Better Auth Specific

- ✅ Use Better Auth API (`auth.api.signUpEmail`) for user creation
- ✅ Understand password storage (account table, not user table)
- ✅ Set `providerId: "credential"` for email/password accounts
- ✅ Hash passwords using Better Auth's configured algorithm
- ✅ Never commit real credentials to version control
- ✅ Use strong passwords even for test data

### Drizzle ORM Specific

- ✅ Use `drizzle-seed` for deterministic seeding
- ✅ Expose all related tables to seed function
- ✅ Define foreign key cascade actions
- ✅ Use `.refine()` for custom seeding logic
- ✅ Leverage weighted random for realistic distributions
- ✅ Use `reset()` carefully (only in dev/test)

### Environment Management

- ✅ Different seed data for each environment
- ✅ No fake data in production
- ✅ Environment-specific user counts
- ✅ Use environment variables for configuration
- ✅ CLI flags for seed control (`--reset`, `--env=test`)

### Code Organization

- ✅ Separate seed files per domain/table
- ✅ Use factory pattern for reusable data generation
- ✅ Extract helper utilities
- ✅ Main seed runner coordinates execution
- ✅ Keep individual seed functions focused

---

## Recommended Libraries

### Essential

- **drizzle-orm** (^0.38.0+) - ORM with type safety
- **drizzle-seed** - Official seeding package
- **@faker-js/faker** - Realistic fake data generation
- **nanoid** - Secure ID generation
- **dotenv** - Environment variable management

### Optional

- **@praha/drizzle-factory** - Factory pattern for test data
- **zod** - Runtime type validation
- **tsx** - TypeScript execution (alternative to bun)

### Installation Commands

```bash
# Core dependencies
npm install drizzle-orm drizzle-seed nanoid dotenv

# Development dependencies
npm install -D @faker-js/faker drizzle-kit @types/node

# Optional
npm install -D @praha/drizzle-factory zod tsx
```

---

## Common Pitfalls and Solutions

### Pitfall 1: Duplicate Records on Re-run

**Problem**: Running seed script multiple times creates duplicates.

**Solution**: Always check for existing records:
```typescript
const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
if (existing.length === 0) {
  await db.insert(users).values(userData);
}
```

### Pitfall 2: Foreign Key Violations

**Problem**: Seeding child records before parent records exist.

**Solution**: Seed in dependency order and expose all tables:
```typescript
// Wrong order
await seedPosts(db);
await seedUsers(db); // Posts reference users!

// Correct order
await seedUsers(db);
await seedPosts(db);
```

### Pitfall 3: Better Auth Password Not Working

**Problem**: Manually created password doesn't authenticate.

**Solution**: Always use Better Auth API or correctly hash passwords:
```typescript
// ✅ Use Better Auth API
await auth.api.signUpEmail({ body: { name, email, password } });

// ❌ Don't insert plain text passwords
await db.insert(account).values({ password: "plain-text" }); // Won't work!
```

### Pitfall 4: Memory Issues with Large Seeds

**Problem**: Seeding thousands of records causes memory errors.

**Solution**: Use batching:
```typescript
const BATCH_SIZE = 1000;
for (let i = 0; i < totalUsers; i += BATCH_SIZE) {
  const batch = createUserDataBatch(Math.min(BATCH_SIZE, totalUsers - i));
  await db.insert(users).values(batch);
}
```

### Pitfall 5: Inconsistent Test Data

**Problem**: Tests fail intermittently due to random seed data.

**Solution**: Use fixed seed for deterministic generation:
```typescript
// ✅ Deterministic for tests
await seed(db, schema, { seed: 12345 });

// ❌ Random data causes flaky tests
await seed(db, schema); // Different data each run
```

---

## References

### Official Documentation

- [Drizzle ORM Seed Overview](https://orm.drizzle.team/docs/seed-overview)
- [Drizzle ORM Seeding with Foreign Keys](https://orm.drizzle.team/docs/guides/seeding-with-partially-exposed-tables)
- [Drizzle ORM Relations](https://orm.drizzle.team/docs/relations)
- [Better Auth User & Accounts](https://www.better-auth.com/docs/concepts/users-accounts)
- [Better Auth Email & Password](https://www.better-auth.com/docs/authentication/email-password)
- [Better Auth Security](https://www.better-auth.com/docs/reference/security)
- [Better Auth Admin Plugin](https://www.better-auth.com/docs/plugins/admin)

### Community Resources

- [Seeding Database With Drizzle ORM - DEV Community](https://dev.to/anasrin/seeding-database-with-drizzle-orm-fga)
- [Database Seeder with DrizzleORM and Faker.js - GitHub Gist](https://gist.github.com/ekaone/240012284c6d2370ddc28bcc69590bb9)
- [Simplifying Test Data Generation with Drizzle ORM](https://dev.to/karabash/simplifying-test-data-generation-with-drizzle-orm-pe3)
- [Drizzle ORM PostgreSQL Best Practices Guide (2025)](https://gist.github.com/productdevbook/7c9ce3bbeb96b3fabc3c7c2aa2abc717)

### Libraries

- [@faker-js/faker](https://fakerjs.dev/) - Fake data generation
- [drizzle-seed](https://orm.drizzle.team/docs/seed-overview) - Official seeding package
- [@praha/drizzle-factory](https://github.com/praha-inc/drizzle-factory) - Factory pattern for Drizzle

### Additional Reading

- [Database Seeds - RedwoodJS Docs](https://docs.redwoodjs.com/docs/database-seeds/)
- [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [Idempotency Keys in REST APIs](https://zuplo.com/learning-center/implementing-idempotency-keys-in-rest-apis-a-complete-guide)

---

## Conclusion

This guide provides comprehensive coverage of database seeding with Drizzle ORM and Better Auth. Key takeaways:

1. **Use `drizzle-seed`** for modern, deterministic seeding
2. **Better Auth API** is the safest way to create users
3. **Idempotency** is crucial for production-grade seeds
4. **Organization matters** - separate concerns, use factories
5. **Environment-specific** seeding prevents production data issues

Start with simple seeds and progressively add complexity as needed. Always prioritize idempotency and type safety.

Happy seeding! 🌱
