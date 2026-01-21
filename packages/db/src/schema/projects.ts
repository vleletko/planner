import { randomUUID } from "node:crypto";
import { index, pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";
import { user } from "./auth";

/**
 * Projects table - represents a project workspace
 * Key is globally unique and immutable after creation (Jira-style identifier)
 *
 * Soft-delete: Projects can be archived via deletedAt timestamp.
 * - deletedAt = null: Active project
 * - deletedAt = timestamp: Archived project (can be restored within 30 days)
 * - Key remains reserved forever (even for deleted projects)
 * - Name can be reused after soft-delete (partial unique index)
 */
export const projects = pgTable(
  "projects",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    key: text("key").notNull().unique(), // Global uniqueness, reserved forever (even for deleted)
    name: text("name").notNull(), // Max 100 chars
    description: text("description"), // Nullable, max 500 chars
    ownerId: text("owner_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    deletedAt: timestamp("deleted_at"), // Soft-delete: null = active, timestamp = archived
  },
  (table) => [
    // Note: Name uniqueness is enforced via a partial index (active projects only)
    // This is created via raw SQL migration since Drizzle doesn't support partial unique indexes
    // unique("unique_project_name_per_user").on(table.ownerId, table.name),
    index("idx_projects_owner").on(table.ownerId),
  ]
);

/**
 * Project members join table - links users to projects with roles
 */
export const projectMembers = pgTable(
  "project_members",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: text("role").notNull().$type<"owner" | "admin" | "member">(),
    invitedBy: text("invited_by").references(() => user.id),
    joinedAt: timestamp("joined_at").notNull().defaultNow(),
  },
  (table) => [
    unique("unique_project_member").on(table.projectId, table.userId),
    index("idx_project_members_user").on(table.userId),
    index("idx_project_members_project").on(table.projectId),
  ]
);
