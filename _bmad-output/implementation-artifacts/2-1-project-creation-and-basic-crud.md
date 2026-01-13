# Story 2.1: Project Creation and Basic CRUD

Status: completed

## Story

As a user,
I want to create and manage my own projects with unique identifiers,
so that I can organize my work into separate workspaces with recognizable keys.

**Scope Note:** This story adds a "project key" feature (Jira-style identifiers) beyond original Epic 2.1 requirements as a UX enhancement for professional project management.

## Acceptance Criteria

### AC1: Projects List Page
- **Given** I am logged in
- **When** I navigate to the projects page (`/projects`)
- **Then** I see a list of my projects (cards layout) showing project key
- **And** I see a "Create Project" button
- **And** if I have no projects, I see an empty state with CTA

### AC2: Project Creation Dialog
- **Given** I click "Create Project" button
- **When** the dialog opens
- **Then** I see a form with:
  - Project name field (required, min 1 char, max 100 chars)
  - Project key field (required, max 7 chars, uppercase, auto-suggested from name)
  - Description field (optional, max 500 chars, textarea)
  - Cancel and "Create project" buttons
- **And** the key is auto-generated from the project name
- **And** I can manually edit the key
- **And** key availability is checked on blur

### AC3: Project Creation Success
- **Given** I submit the form with valid name and unique key
- **When** the project is created
- **Then** the project is created with me as the owner
- **And** I am redirected to the project settings (`/projects/[id]/settings`)
- **And** I see a success toast "Project [Name] created"
- **Note:** Default statuses (Backlog, In Progress, Done) deferred to Story 3.1 (Status Management)

### AC4: Duplicate Key Validation
- **Given** I enter a project key that already exists
- **When** the key field loses focus (blur)
- **Then** I see inline error: "This key is already taken"
- **And** the form cannot be submitted

### AC5: Project Edit
- **Given** I am the owner of a project
- **When** I navigate to project settings → Overview tab
- **Then** I can edit project name and description
- **And** I see the project key displayed (read-only, not editable)
- **And** changes save successfully with toast feedback

### AC6: Project Details View - MODIFIED
- **Given** I am a project member
- **When** I click on a project card
- **Then** I am navigated to the project settings page (`/projects/[id]/settings`)
- **And** I see project key (read-only), name, and description
- **And** If I am a member (not owner/admin), I see a read-only view with disabled form fields
- **And** If I am an owner/admin, I can edit name and description
- **Note:** Project overview page (`/projects/[id]`) redirects to settings. See `_bmad-output/implementation-artifacts/epic-2-retrospective-topics.md` for architectural context (projects as namespaces, shared board model).

## Tasks / Subtasks

**Dependencies:** Task 1 (Database) → Tasks 2, 3 | Task 3 (API) → Tasks 5-8

### Task 1: Database Schema for Projects (AC: 1, 3)

- [x] Task 1.1: Create projects table schema
  - [x] 1.1.1: Create `packages/db/src/schema/projects.ts`
  - [x] 1.1.2: Define `projects` table with Drizzle:
    - `id` (text pk, randomUUID)
    - `key` (text, unique globally, max 7 chars uppercase)
    - `name` (text, max 100)
    - `description` (text nullable, max 500)
    - `ownerId` (fk user)
    - `createdAt`, `updatedAt`
  - [x] 1.1.3: Add unique constraint on `key` (global uniqueness)
  - [x] 1.1.4: Add unique constraint on (owner_id, name) for unique names per user
  - [x] 1.1.5: Add index on owner_id for efficient queries
  - [x] 1.1.6: Export from `packages/db/src/index.ts`

- [x] Task 1.2: Create project_members join table
  - [x] 1.2.1: Define `projectMembers` table:
    - `id` (text pk, randomUUID)
    - `projectId` (fk projects, cascade delete)
    - `userId` (fk user, cascade delete)
    - `role` (text: 'owner' | 'admin' | 'member')
    - `invitedBy` (fk user nullable)
    - `joinedAt`
  - [x] 1.2.2: Add unique constraint on (project_id, user_id)
  - [x] 1.2.3: Add indexes: idx_project_members_user, idx_project_members_project
  - [x] 1.2.4: Export from `packages/db/src/index.ts`

- [x] Task 1.3: Run database migration
  - [x] 1.3.1: Generate migration: `bun run --filter=db db:generate`
  - [x] 1.3.2: Apply migration: `bun run --filter=db db:push`
  - [x] 1.3.3: Verify tables created in database

### Task 2: Database Seeding for Projects (AC: 1, 6)

- [x] Task 2.1: Create projects seed data
  - [x] 2.1.1: Create `apps/migrate/src/seed/projects.ts`
  - [x] 2.1.2: Define `SeedProjectData` type with key, name, description, ownerEmail
  - [x] 2.1.3: Define `TEST_PROJECTS` array with 3-5 sample projects:
    - "MKT" - Marketing Campaign Q1 (test@example.com)
    - "PROD" - Product Launch (test@example.com)
    - "DEMO" - Demo Project (demo@example.com)
  - [x] 2.1.4: Export type and data

- [x] Task 2.2: Implement projects seeding function
  - [x] 2.2.1: Add `seedProject` function in `apps/migrate/src/seed/index.ts`
  - [x] 2.2.2: Check for existing project by key (idempotent)
  - [x] 2.2.3: Look up owner user by email
  - [x] 2.2.4: Insert project record with `randomUUID()` for id
  - [x] 2.2.5: Insert project_member record with role='owner'
  - [x] 2.2.6: Add `seedProjectsProfile` orchestrator function

- [x] Task 2.3: Integrate with seed runner
  - [x] 2.3.1: Call `seedProjectsProfile` in `runSeeding` after users
  - [x] 2.3.2: Add logging for seed progress
  - [x] 2.3.3: Test: `bun run --filter=migrate seed`

### Task 3: Projects ORPC Router (AC: 1-6)

- [x] Task 3.1: Create projects router file
  - [x] 3.1.1: Create `packages/api/src/routers/projects.ts`
  - [x] 3.1.2: Import `protectedProcedure` from `../index`
  - [x] 3.1.3: Import `db`, `eq`, `and`, `sql`, `count` from drizzle-orm
  - [x] 3.1.4: Import `z` from zod, `randomUUID` from node:crypto
  - [x] 3.1.5: Import `createLogger` from `@planner/logger`

- [x] Task 3.2: Implement `list` procedure
  - [x] 3.2.1: Create procedure with no input
  - [x] 3.2.2: Query projects where user is member (join project_members)
  - [x] 3.2.3: Include: id, key, name, description, createdAt, role, memberCount
  - [x] 3.2.4: Return array sorted by createdAt desc

- [x] Task 3.3: Implement `checkKeyAvailable` procedure
  - [x] 3.3.1: Input: `{ key: z.string().max(7).toUpperCase() }`
  - [x] 3.3.2: Query projects by key
  - [x] 3.3.3: Return `{ available: boolean }`

- [x] Task 3.4: Implement `create` procedure
  - [x] 3.4.1: Input schema:
    ```typescript
    z.object({
      key: z.string().min(1).max(7).toUpperCase().regex(/^[A-Z][A-Z0-9]*$/),
      name: z.string().min(1).max(100),
      description: z.string().max(500).optional(),
    })
    ```
  - [x] 3.4.2: Check key uniqueness, throw `ORPCError('BAD_REQUEST', { message: 'Project key already exists' })`
  - [x] 3.4.3: Check name uniqueness per user
  - [x] 3.4.4: Create in transaction:
    - Insert project with `randomUUID()`
    - Insert project_member with role='owner'
  - [x] 3.4.5: Return created project with id, key, name

- [x] Task 3.5: Implement `get` procedure
  - [x] 3.5.1: Input: `{ projectId: z.string() }`
  - [x] 3.5.2: Verify user is member
  - [x] 3.5.3: If not member, throw `ORPCError('FORBIDDEN')`
  - [x] 3.5.4: Return project with owner info, member count, user's role

- [x] Task 3.6: Implement `update` procedure
  - [x] 3.6.1: Input: `{ projectId, name?, description? }` (no key - immutable)
  - [x] 3.6.2: Verify user is owner
  - [x] 3.6.3: If name changed, check uniqueness per user
  - [x] 3.6.4: Update record, set updatedAt
  - [x] 3.6.5: Return updated project

- [x] Task 3.7: Register router
  - [x] 3.7.1: Import in `packages/api/src/routers/index.ts`
  - [x] 3.7.2: Add `projects: projectsRouter` to appRouter

### Task 4: Update UI Components for Project Key (AC: 1, 2, 5)

- [x] Task 4.1: Update ProjectCard component
  - [x] 4.1.1: Add `projectKey` prop to `ProjectCardProps`
  - [x] 4.1.2: Display key as badge/chip before or above project name
  - [x] 4.1.3: Style: small uppercase monospace, muted background
  - [x] 4.1.4: Update Storybook stories with key prop
  - [x] 4.1.5: Update mock data to include keys

- [x] Task 4.2: Update Project type in projects-list
  - [x] 4.2.1: Add `key: string` to `Project` type
  - [x] 4.2.2: Pass key to ProjectCard

- [x] Task 4.3: Update ProjectCreationDialog
  - [x] 4.3.1: Add key field between name and description
  - [x] 4.3.2: Add state for key, keyError, isCheckingKey
  - [x] 4.3.3: Auto-generate key from name (first letter of each word, uppercase, max 7)
  - [x] 4.3.4: Add `onCheckKeyAvailable` prop for blur validation (use `useDebouncedValue` from @tanstack/react-pacer, 300ms)
  - [x] 4.3.5: Show loading spinner during key check
  - [x] 4.3.6: Show error if key taken
  - [x] 4.3.7: Validate format: uppercase alphanumeric, starts with letter
  - [x] 4.3.8: Update `onSuccess` callback to include key
  - [x] 4.3.9: Update Storybook stories

- [x] Task 4.4: Update OverviewTab for settings
  - [x] 4.4.1: Add `projectKey` prop (read-only display)
  - [x] 4.4.2: Display key in a read-only field with "locked" indicator
  - [x] 4.4.3: Add tooltip: "Project key cannot be changed after creation"
  - [x] 4.4.4: Update Storybook stories

### Task 5: Projects List Page Integration (AC: 1)

- [x] Task 5.1: Wire up ProjectsList component
  - [x] 5.1.1: Update `/apps/web/src/app/projects/page.tsx`
  - [x] 5.1.2: Use `useQuery` to fetch projects via `client.projects.list()`
  - [x] 5.1.3: Map API response to `Project` type (include key)
  - [x] 5.1.4: Pass `isLoading` from query state

- [x] Task 5.2: Add navigation and create dialog
  - [x] 5.2.1: Pass `onProjectClick` → navigate to `/projects/[id]`
  - [x] 5.2.2: Add dialog state, pass `onCreateProject` to open it
  - [x] 5.2.3: Render `ProjectCreationDialog`

### Task 6: Project Creation Dialog Integration (AC: 2, 3, 4)

- [x] Task 6.1: Wire up creation flow
  - [x] 6.1.1: Create mutation for `client.projects.create`
  - [x] 6.1.2: Create query/mutation for `client.projects.checkKeyAvailable`
  - [x] 6.1.3: Pass `onCheckKeyAvailable` callback that calls the API
  - [x] 6.1.4: Handle debouncing (300ms) for key availability check
  - [x] 6.1.5: On success: close dialog, invalidate query, navigate, toast

- [x] Task 6.2: Handle errors
  - [x] 6.2.1: Key already exists → show as serverError
  - [x] 6.2.2: Name not unique → show as serverError
  - [x] 6.2.3: Other errors → error toast
  - [x] 6.2.4: Handle key conflict at submission time (key passed blur but taken before submit) → show inline error "This key was just taken"

### Task 7: Project Overview Page (AC: 6) - MODIFIED

**Note:** Project overview page now redirects to settings page. The dedicated overview content was removed as it served no purpose (projects are namespaces for cards, board is shared across all projects). See `_bmad-output/implementation-artifacts/epic-2-retrospective-topics.md` for architectural context.

- [x] Task 7.1: Project overview page redirects to settings
  - [x] 7.1.1: `/apps/web/src/app/projects/[projectId]/page.tsx` redirects to `/projects/[projectId]/settings`
  - [x] 7.1.2: `project-overview-content.tsx` deleted
  - [x] 7.1.3: Settings page now accessible to all project members (read-only for members, editable for owners/admins)
  - [x] 7.1.4: Back button added to settings layout for navigation to `/projects`

### Task 8: Project Settings Page (AC: 5)

- [x] Task 8.1: Create settings page
  - [x] 8.1.1: Create `/apps/web/src/app/projects/[projectId]/settings/page.tsx`
  - [x] 8.1.2: Verify user is owner (redirect if not)
  - [x] 8.1.3: Render `ProjectSettingsLayout`
  - [x] 8.1.4: Pass `OverviewTab` with `projectKey` prop
  - [x] 8.1.5: Pass placeholder for membersContent

- [x] Task 8.2: Wire up edit form
  - [x] 8.2.1: Create update mutation
  - [x] 8.2.2: Pass initial values from project data
  - [x] 8.2.3: Handle save with toast feedback
  - [x] 8.2.4: Invalidate project query on success

### Task 9: Testing and Verification (All ACs)

- [x] Task 9.1: Unit tests for projects router — **DESCOPED**

  > **Rationale:** Router unit tests descoped — E2E tests provide sufficient coverage for CRUD routers.
  > The router procedures are thin wrappers around database queries. True unit tests would require
  > mocking Drizzle ORM which provides low value (tests the mock, not the query). The E2E tests
  > (Task 9.4) verify all router functionality end-to-end including create, duplicate key validation,
  > list filtering, update flow, and access control. This is a deliberate architectural decision:
  > for database-heavy CRUD operations, E2E tests are more valuable than mocked unit tests.

  - [x] 9.1.1-9.1.5: Covered by E2E tests in Task 9.4 (see mapping below)
    - Create with valid input → E2E: "can create a new project with auto-generated key"
    - Duplicate key validation → E2E: "shows error for duplicate project key"
    - List returns user's projects → E2E: "displays seeded projects for logged in user"
    - Update flow → E2E: "can edit project name and description"
    - Access control → E2E: "owner can edit", "member sees read-only settings"

- [x] Task 9.2: Update Storybook interaction tests
  - [x] 9.2.1: Add tests for key field in ProjectCreationDialog
  - [x] 9.2.2: Add tests for key display in ProjectCard
  - [x] 9.2.3: Add tests for read-only key in OverviewTab

- [x] Task 9.3: Manual verification
  - [x] 9.3.1: Create project → verify key displayed
  - [x] 9.3.2: Enter duplicate key → verify error on blur
  - [x] 9.3.3: Edit project → verify key is read-only
  - [x] 9.3.4: Seed projects → verify list shows all data

- [x] Task 9.4: E2E tests (Playwright)
  - [x] 9.4.1: Test projects list page loads with seeded projects
  - [x] 9.4.2: Test create project flow end-to-end (open dialog → fill form → submit → redirect)
  - [x] 9.4.3: Test duplicate key validation shows error
  - [x] 9.4.4: Test project overview page displays all info
  - [x] 9.4.5: Test project settings edit and save flow
  - [x] 9.4.6: Test project key is not editable in settings

- [x] Task 9.5: Run full test suite
  - [x] 9.5.1: `bun run check && bun run check-types && bun run test && bun run test:storybook && bun run build`
  - [x] 9.5.2: `bun run test:e2e` (12/12 Chromium Projects tests pass)

## Dev Notes

### Technology Stack

| Technology | Purpose |
|------------|---------|
| Next.js 16 | App Router pages |
| React 19 | UI components |
| ORPC | Type-safe RPC API |
| Drizzle ORM | PostgreSQL ORM (SQL auto-generated) |
| PostgreSQL | Database |
| Better-Auth | Authentication |
| TanStack Query | Server state management |
| Zod | Input validation |
| sonner | Toast notifications |
| Playwright | E2E testing |

### Quick Reference

| Item | Value |
|------|-------|
| Key format | `/^[A-Z][A-Z0-9]{0,6}$/` (1-7 chars, starts with letter) |
| Max name | 100 characters |
| Max key | 7 characters |
| Max description | 500 characters |
| Key files | `packages/db/src/schema/projects.ts`, `packages/api/src/routers/projects.ts` |
| UI files | `project-card.tsx`, `project-creation-dialog.tsx`, `overview-tab.tsx` |

### Project Key Specification

| Property | Value |
|----------|-------|
| Max length | 7 characters |
| Format | Uppercase alphanumeric |
| Pattern | `/^[A-Z][A-Z0-9]*$/` (starts with letter) |
| Uniqueness | Global (enforced by DB) |
| Mutability | Immutable after creation |
| Examples | "MKT", "PROJ", "DEV1", "Q1CAMP" |

**Key Generation Algorithm (client-side):**
```typescript
function generateProjectKey(name: string): string {
  return name
    .split(/\s+/)
    .filter(word => word.length > 0)
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '') // Keep alphanumeric
    .replace(/^(\d+)/, '')     // Remove leading digits only
    .slice(0, 7) || 'PROJ';
}
// "Marketing Campaign Q1" → "MCQ"
// "Product Launch" → "PL"
// "Marketing 2025 Campaign" → "M2C"
// "Q1 Planning" → "P" (leading digit stripped)
```

### Existing UI Components (from Story 2-0)

```
apps/web/src/components/projects/
├── project-card.tsx              # MODIFY - add key prop
├── projects-list.tsx             # MODIFY - add key to Project type
├── project-creation-dialog.tsx   # MODIFY - add key field
├── project-settings/
│   ├── project-settings-layout.tsx
│   └── overview-tab.tsx          # MODIFY - add projectKey prop
├── mock-data.ts                  # MODIFY - add keys to mock data
└── utils.ts
```

### Component Props Updates

**ProjectCardProps** - ADD `projectKey`:
```typescript
type ProjectCardProps = {
  projectKey: string;  // NEW - renamed from 'key' to avoid reserved word
  name: string;
  description?: string;
  memberCount: number;
  createdAt: Date;
  role: ProjectRole;
  onClick?: () => void;
};
```

**Project type** (in `projects-list.tsx`) - ADD `key: string` field (see Task 4.2)

**ProjectCreationDialogProps** - ADD key handling:
```typescript
type ProjectCreationDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (project: { key: string; name: string; description?: string }) => void;  // MODIFIED
  onCheckKeyAvailable?: (key: string) => Promise<boolean>;  // NEW
  isSubmitting?: boolean;
  serverError?: string | null;
};
```

**OverviewTabProps** - ADD projectKey:
```typescript
type OverviewTabProps = {
  projectKey: string;  // NEW - read-only display
  initialName: string;
  initialDescription?: string;
  onSave?: (data: { name: string; description?: string }) => void;
  isSaving?: boolean;
  saveSuccess?: boolean;
};
```

### Drizzle Schema

```typescript
// packages/db/src/schema/projects.ts
import { index, pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";
import { randomUUID } from "node:crypto";
import { user } from "./auth";

export const projects = pgTable("projects", {
  id: text("id").primaryKey().$defaultFn(() => randomUUID()),
  key: text("key").notNull().unique(),  // Global uniqueness
  name: text("name").notNull(),
  description: text("description"),
  ownerId: text("owner_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  unique("unique_project_name_per_user").on(table.ownerId, table.name),
  index("idx_projects_owner").on(table.ownerId),
]);

export const projectMembers = pgTable("project_members", {
  id: text("id").primaryKey().$defaultFn(() => randomUUID()),
  projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  role: text("role").notNull().$type<"owner" | "admin" | "member">(),
  invitedBy: text("invited_by").references(() => user.id),
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
}, (table) => [
  unique("unique_project_member").on(table.projectId, table.userId),
  index("idx_project_members_user").on(table.userId),
  index("idx_project_members_project").on(table.projectId),
]);
```

### Seeding Pattern

```typescript
// apps/migrate/src/seed/projects.ts
export type SeedProjectData = {
  key: string;
  name: string;
  description?: string;
  ownerEmail: string;
};

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
];
```

### ORPC Router Pattern

```typescript
// packages/api/src/routers/projects.ts
export const projectsRouter = {
  list: protectedProcedure.handler(async ({ context }) => { /* ... */ }),

  checkKeyAvailable: protectedProcedure
    .input(z.object({ key: z.string().max(7).toUpperCase() }))
    .handler(async ({ input }) => {
      const existing = await db.query.projects.findFirst({
        where: eq(projects.key, input.key),
      });
      return { available: !existing };
    }),

  create: protectedProcedure
    .input(z.object({
      key: z.string().min(1).max(7).toUpperCase().regex(/^[A-Z][A-Z0-9]*$/),
      name: z.string().min(1).max(100),
      description: z.string().max(500).optional(),
    }))
    .handler(async ({ context, input }) => { /* ... */ }),

  get: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .handler(async ({ context, input }) => { /* ... */ }),

  update: protectedProcedure
    .input(z.object({
      projectId: z.string(),
      name: z.string().min(1).max(100).optional(),
      description: z.string().max(500).optional(),
      // NO key field - immutable
    }))
    .handler(async ({ context, input }) => { /* ... */ }),
};
```

### E2E Test Pattern

```typescript
// apps/e2e/src/projects.spec.ts
import { test, expect } from "./fixtures/auth.fixture";

test.describe("Projects", () => {
  test("can create a new project", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/projects");

    // Click create button
    await authenticatedPage.getByRole("button", { name: /create/i }).click();

    // Fill form
    await authenticatedPage.getByLabel(/project name/i).fill("Test Project");
    await authenticatedPage.getByLabel(/key/i).fill("TEST");

    // Submit
    await authenticatedPage.getByRole("button", { name: /create project/i }).click();

    // Verify redirect to project page
    await expect(authenticatedPage).toHaveURL(/\/projects\/[a-z0-9-]+/);

    // Verify toast
    await expect(authenticatedPage.getByText(/created/i)).toBeVisible();
  });
});
```

### File Structure After Implementation

```
packages/
├── api/src/routers/
│   ├── index.ts          # MODIFY - add projectsRouter
│   └── projects.ts       # NEW
└── db/src/
    ├── index.ts          # MODIFY - export new tables
    └── schema/
        ├── auth.ts       # existing
        └── projects.ts   # NEW

apps/
├── e2e/src/
│   └── projects.spec.ts  # NEW - E2E tests
├── migrate/src/seed/
│   ├── index.ts          # MODIFY - add seedProjectsProfile
│   ├── test.ts           # existing
│   └── projects.ts       # NEW
└── web/src/
    ├── app/projects/
    │   ├── page.tsx                    # MODIFY
    │   └── [projectId]/
    │       ├── page.tsx                # NEW
    │       └── settings/
    │           └── page.tsx            # NEW
    └── components/projects/
        ├── project-card.tsx            # MODIFY - add key
        ├── projects-list.tsx           # MODIFY - add key to type
        ├── project-creation-dialog.tsx # MODIFY - add key field
        ├── project-settings/
        │   └── overview-tab.tsx        # MODIFY - add projectKey
        └── mock-data.ts                # MODIFY - add keys
```

### Error Handling

| Error Code | Scenario | User Message |
|------------|----------|--------------|
| BAD_REQUEST | Duplicate project key | "Project key already exists" |
| BAD_REQUEST | Duplicate project name (per user) | "Project name must be unique" |
| BAD_REQUEST | Invalid key format | "Key must be 1-7 uppercase letters/numbers, starting with a letter" |
| FORBIDDEN | Non-owner editing | "Only owner can edit project" |
| FORBIDDEN | Non-member accessing | "You don't have access to this project" |
| NOT_FOUND | Project doesn't exist | "Project not found" |

### References

- [Source: docs/epics/epic-2-project-workspace-management.md#Story 2.1]
- [Source: docs/PRD.md#1-project-management]
- [Source: docs/architecture.md]
- [Source: _bmad-output/implementation-artifacts/2-0-epic-2-ux-design.md]
- [Source: _bmad-output/implementation-artifacts/epic-2-design-handoff.md]
- [Source: docs/database-seeding-guide.md]
- [Source: apps/migrate/src/seed/index.ts]
- [Source: apps/e2e/README.md] - E2E testing guide

## Dev Agent Record

### Context Reference

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

### Completion Notes List

### File List

**New Files:**
- `packages/db/src/schema/projects.ts` - Projects and projectMembers schema
- `packages/db/src/migrations/0001_stormy_sebastian_shaw.sql` - Projects migration
- `packages/db/src/migrations/meta/0001_snapshot.json` - Migration snapshot
- `packages/api/src/routers/projects.ts` - Projects CRUD router
- `apps/migrate/src/seed/projects.ts` - Projects seed data
- `apps/web/src/app/projects/projects-content.tsx` - Projects page client component
- `apps/web/src/app/projects/[projectId]/page.tsx` - Project overview (redirects to settings)
- `apps/web/src/app/projects/[projectId]/settings/page.tsx` - Project settings page
- `apps/web/src/app/projects/[projectId]/settings/project-settings-content.tsx` - Settings client component
- `apps/web/src/components/ui/alert.tsx` - Alert component for read-only notice
- `apps/e2e/src/poms/projects.page.ts` - Projects page object model
- `apps/e2e/src/poms/project-settings.page.ts` - Project settings POM
- `apps/e2e/tests/projects/projects.spec.ts` - Projects E2E tests
- `apps/web/src/lib/validation/project.ts` - Shared project validation utilities
- `packages/api/src/lib/validation/project.ts` - Shared project validation constants (API-side)

**Modified Files:**
- `packages/db/src/index.ts` - Export projects schema
- `packages/db/src/seed.ts` - Updated seed runner
- `packages/db/src/migrations/meta/_journal.json` - Migration journal
- `packages/api/src/routers/index.ts` - Register projects router
- `apps/migrate/package.json` - Package updates
- `apps/migrate/src/seed/index.ts` - Integrate projects seeding
- `apps/web/package.json` - Package updates
- `apps/web/src/app/projects/page.tsx` - Wire up API calls
- `apps/web/src/components/projects/mock-data.ts` - Add project keys
- `apps/web/src/components/projects/project-card.tsx` - Add projectKey prop
- `apps/web/src/components/projects/project-card.stories.tsx` - Update stories
- `apps/web/src/components/projects/projects-list.tsx` - Add key to Project type
- `apps/web/src/components/projects/projects-list.stories.tsx` - Update stories
- `apps/web/src/components/projects/project-creation-dialog.tsx` - Add key field
- `apps/web/src/components/projects/project-creation-dialog.interactions.stories.tsx` - Key tests
- `apps/web/src/components/projects/project-settings/overview-tab.tsx` - Add projectKey, isReadOnly
- `apps/web/src/components/projects/project-settings/overview-tab.stories.tsx` - Update stories
- `apps/web/src/components/projects/project-settings/members-tab.tsx` - Styling updates
- `apps/web/src/components/projects/project-settings/members-tab.stories.tsx` - Update stories
- `apps/web/src/components/projects/project-settings/project-settings-layout.tsx` - Add back button
- `apps/web/src/components/projects/project-settings/project-settings-layout.stories.tsx` - Update stories
- `apps/e2e/src/fixtures/pom.fixture.ts` - POM fixture updates
- `apps/e2e/src/poms/base.page.ts` - Base POM updates
- `apps/e2e/src/utils/console-errors.ts` - Console error utils
- `apps/e2e/tests/auth/logout.spec.ts` - Test infrastructure updates
- `bun.lock` - Dependency lock file
- `docs/api-contracts.md` - Added projects router documentation
- `docs/development-guide.md` - Documentation updates

**Documentation:**
- `_bmad-output/implementation-artifacts/sprint-status.yaml` - Sprint tracking
- `_bmad-output/implementation-artifacts/2-1-project-creation-and-basic-crud.md` - This story
- `_bmad-output/implementation-artifacts/epic-2-retrospective-topics.md` - Retrospective notes
- `_bmad-output/implementation-artifacts/validation-report-2-1-2025-12-16.md` - Validation report

## Discoveries

| Discovery | Impact | Action |
|-----------|--------|--------|
| | | |

## Tech Debt Created

| Item | Reason | Tracking |
|------|--------|----------|
| Default statuses creation | Deferred to Story 3.1 (Status Management) | Epic 2, Story 3.1 |

## Change Log

- 2025-12-17: Code review #8: Added aria-label to key availability spinner for accessibility (project-creation-dialog.tsx:74)
- 2025-12-17: Code review #7: (1) Removed unused PROJECT_KEY_ERROR_MESSAGE constant from packages/api/src/lib/validation/project.ts, (2) Added missing file to File List (packages/api/src/lib/validation/project.ts)
- 2025-12-17: Code review #6: DRY refactoring - extracted duplicate validateName function and constants (MAX_NAME_LENGTH, MAX_DESCRIPTION_LENGTH) to shared module at `apps/web/src/lib/validation/project.ts`, updated File List with missing documentation files
- 2025-12-17: Code review #5: (1) Fixed sprint-status.yaml discrepancy - story now marked as 'done', (2) Replaced fixed wait anti-pattern (waitForTimeout 100ms) with dynamic wait (expect keyInput not toHaveValue empty) in projects.page.ts:74
- 2025-12-16: Code review #4 fixes: (1) Added maxLength HTML attribute to description Textarea in project-creation-dialog.tsx for consistency with overview-tab.tsx, (2) Extracted debounce timeout to named constant KEY_CHECK_DEBOUNCE_MS
- 2025-12-16: Code review #3 fixes: (1) Added regex validation to checkKeyAvailable router procedure for consistency with create, (2) Added AbortController for key availability check cancellation on dialog close and stale request handling, (3) Removed unused variables (isOwner, isAdmin) in project-settings-content.tsx, (4) Added maxLength HTML attribute to OverviewTab textarea, (5) Replaced E2E fixed waits with dynamic waitForKeyValidation() helper, (6) Added E2E test for invalid key format validation, (7) Added Storybook tests for key availability flow (KeyAvailabilityCheckSuccess, KeyAvailabilityCheckThenSubmit)
- 2025-12-16: Code review #2 fixes: (1) Added aria-label to back link for accessibility/E2E test reliability, (2) Task 9.1 descoped with rationale — unit tests not needed for CRUD routers when E2E coverage exists
- 2025-12-16: Code review fixes applied: (1) Wrapped project creation in db.transaction() for atomicity, (2) Allow admin role to edit projects (owner OR admin can edit name/description), (3) Populated File List section with all 39 changed files
- 2025-12-16: Project overview page removed - redirects to settings. Settings now supports read-only mode for members. Back button added. AC3, AC6, Task 7 updated.
- 2025-12-16: Applied validation fixes: AC3 deferral note, race condition handling (Task 6.2.4), key generation fix (preserve numbers), scope documentation, debounce spec, quick reference, task dependencies
- 2025-12-16: Story created via BMAD create-story workflow (YOLO mode)
- 2025-12-16: Added project key (Jira-style) with global uniqueness, immutable after creation
- 2025-12-16: Added E2E testing tasks with Playwright
