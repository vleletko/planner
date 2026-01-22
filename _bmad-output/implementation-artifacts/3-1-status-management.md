# Story 3.1: Status Management

**Epic:** 3 - Global Schema Configuration
**Status:** ready-for-dev
**Created:** 2026-01-22
**Prerequisites:** Story 2.5 (Project Deletion with Safety Checks) - COMPLETED

---

## Story Overview

As a **system administrator**,
I want to create and manage global workflow statuses,
So that I can define the stages work items move through across **all projects**.

### Key Points
- Statuses are **GLOBAL** entities (no project_id)
- Management restricted to **SYSTEM ADMIN ONLY** (user.role === "admin")
- All users can **read** statuses (public read)
- Default statuses: Backlog, In Progress, Done
- Changes affect ALL projects immediately

---

## Acceptance Criteria

### AC1: View Status List
**Given** I am a system administrator
**When** I navigate to Admin → Schema → Statuses
**Then** I see the current list of global statuses in order with default statuses (Backlog, In Progress, Done)

### AC2: Create Status
**And** I can create a new status by:
- Clicking "Add Status" button (primary button style: teal background, white text)
- Entering status name (required, min 3 characters)
- Selecting status color from palette (must meet WCAG AA contrast: 4.5:1 for text)
- Status appears at end of list with smooth fade-in animation

### AC3: Reorder Statuses
**And** I can reorder statuses by:
- Dragging status to new position (using @dnd-kit with keyboard support)
- Visual feedback: card tilts 3-5° during drag, elevated shadow (shadow-xl)
- Order saves automatically with optimistic UI
- Board columns update to match new order

### AC4: Edit Status
**And** I can edit a status by:
- Clicking status to edit (inline editing pattern - UX Spec Section 5.1)
- Field transforms to input with teal border on focus
- Changing name and color
- Save on blur or Enter key, Cancel with Escape
- Changes save and reflect immediately on board with optimistic UI

### AC5: Delete Status (No Cards)
**And** I can delete a status only if:
- No cards currently have that status
- Confirmation dialog appears (shadcn/ui Dialog component)
- Dialog has destructive button (rose-500 background, white text)
- Status is removed from list with fade-out animation

### AC6: Delete Status (Has Cards) - Error
**And** when I try to delete status with cards:
- Error toast notification (top-right, rose-50 background, rose-500 left border)
- Error message: "Cannot delete status with X cards. Move cards first."
- Toast auto-dismisses after 5s or manual close

---

## Technical Implementation

### Database Schema

Create `packages/db/src/schema/statuses.ts`:

```typescript
import { randomUUID } from "node:crypto";
import { boolean, index, integer, pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";
import { user } from "./auth";

/**
 * Global statuses table - NO project_id (system-wide entity)
 * Defines workflow stages that all projects share
 */
export const statuses = pgTable(
  "statuses",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    name: text("name").notNull(),            // Min 3 chars, max 50
    color: text("color").notNull(),          // Hex color code, WCAG AA compliant
    order: integer("order").notNull(),       // Display order (0-indexed)
    isActive: boolean("is_active").notNull().default(true), // Soft-disable without deletion
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    createdBy: text("created_by")
      .notNull()
      .references(() => user.id, { onDelete: "set null" }),
  },
  (table) => [
    unique("unique_status_name").on(table.name),  // Global name uniqueness
    index("idx_statuses_order").on(table.order),
    index("idx_statuses_active").on(table.isActive),
  ]
);
```

**Migration Notes:**
- Add to `packages/db/src/schema/index.ts` exports
- Generate migration: `bun run db:generate`
- Run migration: `bun run db:migrate`

### Authorization Layer

Create `packages/api/src/lib/authz/schema.ts`:

```typescript
import { ORPCError } from "@orpc/server";

/**
 * Check if user is a system admin.
 * All schema management (statuses, card types, fields) requires system admin.
 */
export function requireSystemAdmin(userRole: string | null | undefined): void {
  if (userRole !== "admin") {
    throw new ORPCError("FORBIDDEN", {
      message: "System administrator access required for schema management.",
    });
  }
}

/**
 * Pure check function for frontend use.
 */
export function isSystemAdmin(userRole: string | null | undefined): boolean {
  return userRole === "admin";
}
```

### ORPC Router

Create `packages/api/src/routers/statuses.ts`:

```typescript
import { ORPCError } from "@orpc/server";
import { db, eq, statuses, sql, count } from "@planner/db";
import { createLogger } from "@planner/logger";
import { z } from "zod";
import { protectedProcedure } from "../index";
import { requireSystemAdmin } from "../lib/authz/schema";

const log = createLogger("statuses-router");

// Validation constants
const STATUS_CONSTRAINTS = {
  MIN_NAME_LENGTH: 3,
  MAX_NAME_LENGTH: 50,
} as const;

// Color must be valid hex and WCAG AA compliant (validated client-side)
const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;

export const statusesRouter = {
  /**
   * List all statuses (PUBLIC READ - any authenticated user)
   * Returns statuses sorted by order
   */
  list: protectedProcedure.handler(async () => {
    const result = await db
      .select({
        id: statuses.id,
        name: statuses.name,
        color: statuses.color,
        order: statuses.order,
        isActive: statuses.isActive,
        createdAt: statuses.createdAt,
        updatedAt: statuses.updatedAt,
      })
      .from(statuses)
      .orderBy(sql`${statuses.order} ASC`);

    return result;
  }),

  /**
   * List active statuses only (PUBLIC READ - for board display)
   */
  listActive: protectedProcedure.handler(async () => {
    const result = await db
      .select({
        id: statuses.id,
        name: statuses.name,
        color: statuses.color,
        order: statuses.order,
      })
      .from(statuses)
      .where(eq(statuses.isActive, true))
      .orderBy(sql`${statuses.order} ASC`);

    return result;
  }),

  /**
   * Create a new status (SYSTEM ADMIN ONLY)
   */
  create: protectedProcedure
    .input(
      z.object({
        name: z
          .string()
          .min(STATUS_CONSTRAINTS.MIN_NAME_LENGTH)
          .max(STATUS_CONSTRAINTS.MAX_NAME_LENGTH),
        color: z.string().regex(hexColorRegex, {
          message: "Color must be a valid hex code (e.g., #14b8a6)",
        }),
      })
    )
    .handler(async ({ context, input }) => {
      const userId = context.session.user.id;
      const userRole = (context.session.user as { role?: string }).role;

      requireSystemAdmin(userRole);

      // Get max order for new status
      const maxOrderResult = await db
        .select({ maxOrder: sql<number>`COALESCE(MAX(${statuses.order}), -1)` })
        .from(statuses);
      const newOrder = (maxOrderResult[0]?.maxOrder ?? -1) + 1;

      // Check name uniqueness
      const existing = await db
        .select({ id: statuses.id })
        .from(statuses)
        .where(eq(statuses.name, input.name))
        .limit(1);

      if (existing.length > 0) {
        throw new ORPCError("BAD_REQUEST", {
          message: "Status name already exists",
        });
      }

      const [newStatus] = await db
        .insert(statuses)
        .values({
          name: input.name,
          color: input.color,
          order: newOrder,
          createdBy: userId,
        })
        .returning();

      log.info({ statusId: newStatus.id, name: input.name, userId }, "Status created");

      return newStatus;
    }),

  /**
   * Update a status (SYSTEM ADMIN ONLY)
   */
  update: protectedProcedure
    .input(
      z.object({
        statusId: z.string(),
        name: z
          .string()
          .min(STATUS_CONSTRAINTS.MIN_NAME_LENGTH)
          .max(STATUS_CONSTRAINTS.MAX_NAME_LENGTH)
          .optional(),
        color: z
          .string()
          .regex(hexColorRegex, {
            message: "Color must be a valid hex code",
          })
          .optional(),
        isActive: z.boolean().optional(),
      })
    )
    .handler(async ({ context, input }) => {
      const userRole = (context.session.user as { role?: string }).role;
      requireSystemAdmin(userRole);

      // Check status exists
      const existing = await db
        .select({ id: statuses.id })
        .from(statuses)
        .where(eq(statuses.id, input.statusId))
        .limit(1);

      if (existing.length === 0) {
        throw new ORPCError("NOT_FOUND", {
          message: "Status not found",
        });
      }

      // Check name uniqueness if changing name
      if (input.name) {
        const nameConflict = await db
          .select({ id: statuses.id })
          .from(statuses)
          .where(eq(statuses.name, input.name))
          .limit(1);

        if (nameConflict.length > 0 && nameConflict[0].id !== input.statusId) {
          throw new ORPCError("BAD_REQUEST", {
            message: "Status name already exists",
          });
        }
      }

      const updateData: Partial<typeof statuses.$inferInsert> = {
        updatedAt: new Date(),
      };

      if (input.name !== undefined) updateData.name = input.name;
      if (input.color !== undefined) updateData.color = input.color;
      if (input.isActive !== undefined) updateData.isActive = input.isActive;

      const [updated] = await db
        .update(statuses)
        .set(updateData)
        .where(eq(statuses.id, input.statusId))
        .returning();

      log.info({ statusId: input.statusId, userId: context.session.user.id }, "Status updated");

      return updated;
    }),

  /**
   * Delete a status (SYSTEM ADMIN ONLY)
   * Only allowed if no cards have this status
   */
  delete: protectedProcedure
    .input(z.object({ statusId: z.string() }))
    .handler(async ({ context, input }) => {
      const userRole = (context.session.user as { role?: string }).role;
      requireSystemAdmin(userRole);

      // Check status exists
      const existing = await db
        .select({ id: statuses.id, name: statuses.name })
        .from(statuses)
        .where(eq(statuses.id, input.statusId))
        .limit(1);

      if (existing.length === 0) {
        throw new ORPCError("NOT_FOUND", {
          message: "Status not found",
        });
      }

      // TODO: When cards table exists, check for cards with this status
      // const cardCount = await db.select({ count: count() }).from(cards).where(eq(cards.statusId, input.statusId));
      // if (cardCount[0].count > 0) {
      //   throw new ORPCError("BAD_REQUEST", {
      //     message: `Cannot delete status with ${cardCount[0].count} cards. Move cards first.`,
      //   });
      // }

      await db.delete(statuses).where(eq(statuses.id, input.statusId));

      log.info({ statusId: input.statusId, userId: context.session.user.id }, "Status deleted");

      return { success: true };
    }),

  /**
   * Reorder statuses (SYSTEM ADMIN ONLY)
   * Receives array of status IDs in new order
   */
  reorder: protectedProcedure
    .input(
      z.object({
        statusIds: z.array(z.string()).min(1),
      })
    )
    .handler(async ({ context, input }) => {
      const userRole = (context.session.user as { role?: string }).role;
      requireSystemAdmin(userRole);

      // Update order in transaction
      await db.transaction(async (tx) => {
        for (let i = 0; i < input.statusIds.length; i++) {
          await tx
            .update(statuses)
            .set({ order: i, updatedAt: new Date() })
            .where(eq(statuses.id, input.statusIds[i]));
        }
      });

      log.info(
        { count: input.statusIds.length, userId: context.session.user.id },
        "Statuses reordered"
      );

      return { success: true };
    }),
};
```

**Router Registration:**

Update `packages/api/src/routers/index.ts`:
```typescript
import { statusesRouter } from "./statuses";

export const appRouter = {
  projects: projectsRouter,
  statuses: statusesRouter,  // Add this
};
```

### Frontend Components

#### 1. Admin Layout (`apps/web/src/app/admin/layout.tsx`)

```typescript
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession();

  // Type assertion for admin plugin role
  const userRole = (session?.user as { role?: string } | undefined)?.role;

  if (userRole !== "admin") {
    redirect("/projects");  // Non-admins redirected
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Admin sidebar/nav here */}
      {children}
    </div>
  );
}
```

#### 2. Status Management Page (`apps/web/src/app/admin/schema/statuses/page.tsx`)

- Use TanStack Query for data fetching
- Implement @dnd-kit for drag-and-drop reordering
- Use shadcn/ui components: Button, Dialog, Input, Card
- Follow inline editing pattern from UX spec

#### 3. Status List Component

Key implementation points:
- DndContext from @dnd-kit for reordering
- SortableContext with verticalListSortingStrategy
- useSortable hook for each status item
- Optimistic updates via queryClient.setQueryData

#### 4. Color Picker Component

- Use shadcn/ui Select or custom palette picker
- Pre-defined WCAG AA compliant colors:
  - `#14b8a6` (Teal - primary)
  - `#6b7280` (Gray)
  - `#10b981` (Emerald - success)
  - `#f59e0b` (Amber - warning)
  - `#f43f5e` (Rose - error)
  - `#3b82f6` (Blue)
  - `#8b5cf6` (Purple)
  - `#ec4899` (Pink)

---

## File Structure

```
packages/
├── db/src/schema/
│   ├── index.ts           # Add statuses export
│   └── statuses.ts        # NEW: Status schema
├── api/src/
│   ├── lib/authz/
│   │   └── schema.ts      # NEW: Schema authorization helpers
│   └── routers/
│       ├── index.ts       # Register statuses router
│       └── statuses.ts    # NEW: Statuses ORPC router

apps/web/src/
├── app/admin/
│   ├── layout.tsx         # NEW: Admin layout with auth guard
│   └── schema/
│       └── statuses/
│           └── page.tsx   # NEW: Status management page
├── components/admin/
│   └── statuses/
│       ├── status-list.tsx           # NEW: Main list with DnD
│       ├── status-item.tsx           # NEW: Sortable status row
│       ├── status-form-dialog.tsx    # NEW: Create/edit dialog
│       ├── delete-status-dialog.tsx  # NEW: Delete confirmation
│       └── color-picker.tsx          # NEW: WCAG-compliant picker
```

---

## Patterns from Codebase

### Authorization Pattern (from `project.server.ts`)

```typescript
// Extract user role from session (admin plugin adds role at runtime)
const userRole = (context.session.user as { role?: string }).role;
requireSystemAdmin(userRole);
```

### ORPC Router Pattern (from `projects.ts`)

```typescript
export const statusesRouter = {
  list: protectedProcedure.handler(async () => { ... }),
  create: protectedProcedure.input(z.object({ ... })).handler(async ({ context, input }) => { ... }),
};
```

### Query Patterns (from `project-settings-content.tsx`)

```typescript
// Query
const { data: statuses, isLoading } = useQuery(
  orpc.statuses.list.queryOptions({})
);

// Mutation with optimistic update
const createMutation = useMutation({
  mutationFn: (data) => orpc.statuses.create.call(data),
  onMutate: async (newStatus) => {
    await queryClient.cancelQueries({ queryKey: ["statuses"] });
    const previous = queryClient.getQueryData(["statuses"]);
    queryClient.setQueryData(["statuses"], (old) => [...old, { ...newStatus, id: "temp" }]);
    return { previous };
  },
  onError: (err, variables, context) => {
    queryClient.setQueryData(["statuses"], context?.previous);
    toast.error(err.message);
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ["statuses"] });
  },
});
```

---

## UX Design References

| Element | UX Spec Reference | Implementation |
|---------|-------------------|----------------|
| Inline Editing | Section 5.1 | Click to edit, blur to save |
| Drag-and-Drop | Section 7.10 | @dnd-kit, 3-5° tilt, shadow-xl |
| Button Hierarchy | Section 7.2 | Primary (teal), Secondary (gray), Destructive (rose) |
| Toast Notifications | Section 7.3 | sonner, top-right position |
| Color System | Section 3.1 | Teal-500 primary, Rose-500 error |

---

## Testing Strategy

### Unit Tests (`packages/api/src/routers/statuses.test.ts`)

1. **Authorization Tests**
   - Non-admin cannot create/update/delete/reorder
   - Admin can perform all operations
   - Any authenticated user can list statuses

2. **CRUD Tests**
   - Create status with valid data
   - Create fails with duplicate name
   - Update status name and color
   - Delete status without cards
   - Reorder multiple statuses

### E2E Tests (`apps/web/tests/admin/statuses.spec.ts`)

1. **Access Control**
   - Non-admin redirected from /admin/schema/statuses
   - Admin can access page

2. **Status Management Flow**
   - View existing statuses
   - Create new status
   - Edit status inline
   - Reorder via drag-and-drop
   - Delete status

3. **Error Handling**
   - Duplicate name error displayed
   - Network error toast shown

---

## Default Status Seeding

Create database seed for default statuses (run once):

```sql
-- Migration or seed script
INSERT INTO statuses (id, name, color, "order", is_active, created_at, updated_at, created_by)
VALUES
  (gen_random_uuid(), 'Backlog', '#6b7280', 0, true, NOW(), NOW(), 'system'),
  (gen_random_uuid(), 'In Progress', '#f59e0b', 1, true, NOW(), NOW(), 'system'),
  (gen_random_uuid(), 'Done', '#10b981', 2, true, NOW(), NOW(), 'system')
ON CONFLICT DO NOTHING;
```

**Note:** `created_by` should reference a system user or the first admin user.

---

## Dependencies

### New Packages Required

```bash
# In apps/web
bun add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

**Note:** Check if @dnd-kit is already in package.json. If not, install.

---

## Checklist

- [ ] Create `statuses` schema in `packages/db/src/schema/statuses.ts`
- [ ] Export from `packages/db/src/schema/index.ts`
- [ ] Generate and run migration
- [ ] Create `packages/api/src/lib/authz/schema.ts`
- [ ] Create `packages/api/src/routers/statuses.ts`
- [ ] Register router in `packages/api/src/routers/index.ts`
- [ ] Create admin layout with auth guard
- [ ] Create status management page
- [ ] Create status list component with DnD
- [ ] Create status form dialog
- [ ] Create delete confirmation dialog
- [ ] Create color picker component
- [ ] Write unit tests for router
- [ ] Write E2E tests for admin flow
- [ ] Seed default statuses
- [ ] Run full verification: `bun run check && bun run check-types && bun run test && bun run build`

---

## Notes from Previous Epics

### From Epic 2 Retrospective

- **E2E-First Testing**: Prefer E2E tests over mocked unit tests for CRUD routers
- **Centralized AuthZ**: Created reusable pattern in `packages/api/src/lib/authz/`
- **Transaction Wrapping**: Use `db.transaction()` for atomic operations
- **Constraint Handling**: Convert DB constraint violations to friendly error messages

### Admin Role Discovery

The codebase has two admin concepts:
- **System Admin**: `user.role === "admin"` (Better Auth admin plugin)
- **Project Admin**: `project_members.role === "admin"` (project-scoped)

This story uses **System Admin** for schema management.

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| @dnd-kit not installed | Check package.json, install if missing |
| Admin plugin role typing | Use type assertion as shown in patterns |
| Cards table doesn't exist yet | Add TODO comment for card count check |
| Color contrast validation | Provide pre-approved WCAG AA colors |

---

*Story generated by BMAD create-story workflow on 2026-01-22*
