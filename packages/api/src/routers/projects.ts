import { ORPCError } from "@orpc/server";
import {
  and,
  count,
  db,
  eq,
  ilike,
  inArray,
  isNotNull,
  isNull,
  projectMembers,
  projects,
  sql,
  user,
} from "@planner/db";
import { createLogger } from "@planner/logger";
import { z } from "zod";
import { protectedProcedure } from "../index";
import {
  requireCanDelete,
  requireCanManageMembers,
  requireCanTransferOwnership,
  requireCanUpdate,
  requireCanView,
} from "../lib/authz/project.server";
import {
  PROJECT_CONSTRAINTS,
  PROJECT_KEY_REGEX,
} from "../lib/validation/project";

const log = createLogger("projects-router");

function toIsoString(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "string" || typeof value === "number") {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date.toISOString();
    }
  }

  log.error({ value }, "Invalid date value for joinedAt");
  throw new Error("Invalid joinedAt value returned from database");
}

// Constraint names for friendly error messages
const UNIQUE_PROJECT_MEMBER_CONSTRAINT = "unique_project_member";
const UNIQUE_PROJECT_KEY_CONSTRAINT = "projects_key_unique";
const UNIQUE_PROJECT_NAME_CONSTRAINT = "unique_project_name_per_user";

function isUniqueViolation(error: unknown, constraint?: string): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const { code, constraint: errorConstraint } = error as {
    code?: string;
    constraint?: string;
  };

  if (code !== "23505") {
    return false;
  }

  return constraint ? errorConstraint === constraint : true;
}

/**
 * Projects router - handles all project CRUD operations
 */
export const projectsRouter = {
  /**
   * List all projects for the current user
   * Returns projects where the user is a member
   * Supports optional filtering by name and status (archived projects require admin)
   */
  list: protectedProcedure
    .input(
      z
        .object({
          name: z.string().optional(),
          status: z.enum(["active", "archived", "all"]).optional(),
        })
        .optional()
    )
    .handler(async ({ context, input }) => {
      const userId = context.session.user.id;
      const nameFilter = input?.name?.trim();
      const statusFilter = input?.status ?? "active";

      // For archived/all status, verify user is system admin
      if (statusFilter !== "active") {
        const userRecord = await db
          .select({ role: user.role })
          .from(user)
          .where(eq(user.id, userId))
          .limit(1);

        if (userRecord.length === 0 || userRecord[0].role !== "admin") {
          throw new ORPCError("FORBIDDEN", {
            message: "System admin access required to view archived projects",
          });
        }
      }

      // Build WHERE conditions dynamically
      const conditions = [eq(projectMembers.userId, userId)];

      // Name filter (case-insensitive)
      if (nameFilter && nameFilter.length > 0) {
        conditions.push(ilike(projects.name, `%${nameFilter}%`));
      }

      // Status filter
      if (statusFilter === "active") {
        conditions.push(isNull(projects.deletedAt));
      } else if (statusFilter === "archived") {
        conditions.push(isNotNull(projects.deletedAt));
      }
      // "all" - no deletedAt filter

      const result = await db
        .select({
          id: projects.id,
          key: projects.key,
          name: projects.name,
          description: projects.description,
          createdAt: projects.createdAt,
          deletedAt: projects.deletedAt,
          role: projectMembers.role,
          ownerId: projects.ownerId,
        })
        .from(projects)
        .innerJoin(projectMembers, eq(projectMembers.projectId, projects.id))
        .where(and(...conditions))
        .orderBy(sql`${projects.createdAt} DESC`);

      // Get member counts for each project
      const projectIds = result.map((p) => p.id);
      const memberCounts =
        projectIds.length > 0
          ? await db
              .select({
                projectId: projectMembers.projectId,
                memberCount: count(projectMembers.id),
              })
              .from(projectMembers)
              .where(inArray(projectMembers.projectId, projectIds))
              .groupBy(projectMembers.projectId)
          : [];

      const memberCountMap = new Map(
        memberCounts.map((mc) => [mc.projectId, Number(mc.memberCount)])
      );

      return result.map((p) => ({
        id: p.id,
        key: p.key,
        name: p.name,
        description: p.description,
        createdAt: p.createdAt,
        deletedAt: p.deletedAt,
        role: p.role,
        memberCount: memberCountMap.get(p.id) ?? 1,
      }));
    }),

  /**
   * Check if a project key is available
   */
  checkKeyAvailable: protectedProcedure
    .input(
      z.object({
        key: z
          .string()
          .min(1)
          .max(PROJECT_CONSTRAINTS.MAX_KEY_LENGTH)
          .toUpperCase()
          .regex(PROJECT_KEY_REGEX, {
            message: "Key must start with a letter",
          }),
      })
    )
    .handler(async ({ input }) => {
      const existing = await db
        .select({ id: projects.id })
        .from(projects)
        .where(eq(projects.key, input.key))
        .limit(1);

      return { available: existing.length === 0 };
    }),

  /**
   * Create a new project
   * Key and name uniqueness enforced by DB constraints for race-condition safety.
   * checkKeyAvailable query provides UX feedback while typing (different purpose).
   */
  create: protectedProcedure
    .input(
      z.object({
        key: z
          .string()
          .min(1)
          .max(PROJECT_CONSTRAINTS.MAX_KEY_LENGTH)
          .toUpperCase()
          .regex(PROJECT_KEY_REGEX, {
            message:
              "Key must be 1-7 uppercase letters/numbers, starting with a letter",
          }),
        name: z.string().min(1).max(PROJECT_CONSTRAINTS.MAX_NAME_LENGTH),
        description: z
          .string()
          .max(PROJECT_CONSTRAINTS.MAX_DESCRIPTION_LENGTH)
          .optional(),
      })
    )
    .handler(async ({ context, input }) => {
      const userId = context.session.user.id;

      try {
        // Create project and add owner as member in a single transaction
        // Constraint violations are caught and converted to friendly errors
        const newProject = await db.transaction(async (tx) => {
          const [project] = await tx
            .insert(projects)
            .values({
              key: input.key,
              name: input.name,
              description: input.description,
              ownerId: userId,
            })
            .returning({
              id: projects.id,
              key: projects.key,
              name: projects.name,
            });

          // Add owner as project member
          await tx.insert(projectMembers).values({
            projectId: project.id,
            userId,
            role: "owner",
          });

          return project;
        });

        log.info(
          { projectId: newProject.id, key: input.key, userId },
          "Project created"
        );

        return newProject;
      } catch (error) {
        // Convert constraint violations to friendly error messages
        if (isUniqueViolation(error, UNIQUE_PROJECT_KEY_CONSTRAINT)) {
          throw new ORPCError("BAD_REQUEST", {
            message: "Project key already exists",
          });
        }
        if (isUniqueViolation(error, UNIQUE_PROJECT_NAME_CONSTRAINT)) {
          throw new ORPCError("BAD_REQUEST", {
            message: "Project name must be unique",
          });
        }
        throw error;
      }
    }),

  /**
   * Get a single project by ID
   * Verifies user is a member of the project (system admins can access any project)
   */
  get: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .handler(async ({ context, input }) => {
      const { role } = await requireCanView(
        input.projectId,
        context.session.user
      );

      // Get project with owner info (exclude soft-deleted)
      const result = await db
        .select({
          id: projects.id,
          key: projects.key,
          name: projects.name,
          description: projects.description,
          createdAt: projects.createdAt,
          ownerId: projects.ownerId,
          ownerName: user.name,
          ownerEmail: user.email,
        })
        .from(projects)
        .innerJoin(user, eq(user.id, projects.ownerId))
        .where(
          and(eq(projects.id, input.projectId), isNull(projects.deletedAt))
        )
        .limit(1);

      if (result.length === 0) {
        throw new ORPCError("NOT_FOUND", {
          message: "Project not found",
        });
      }

      // Get member count
      const [memberCountResult] = await db
        .select({ memberCount: count(projectMembers.id) })
        .from(projectMembers)
        .where(eq(projectMembers.projectId, input.projectId));

      const project = result[0];

      return {
        id: project.id,
        key: project.key,
        name: project.name,
        description: project.description,
        createdAt: project.createdAt,
        owner: {
          id: project.ownerId,
          name: project.ownerName,
          email: project.ownerEmail,
        },
        memberCount: Number(memberCountResult?.memberCount ?? 0),
        role,
      };
    }),

  /**
   * Update a project
   * Owner or admin can update. Key is immutable. System admins can update any project.
   */
  update: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        name: z
          .string()
          .min(1)
          .max(PROJECT_CONSTRAINTS.MAX_NAME_LENGTH)
          .optional(),
        description: z
          .string()
          .max(PROJECT_CONSTRAINTS.MAX_DESCRIPTION_LENGTH)
          .optional(),
        // Note: no key field - key is immutable after creation
      })
    )
    .handler(async ({ context, input }) => {
      await requireCanUpdate(input.projectId, context.session.user);

      // Get project to check existence and get ownerId for name uniqueness (exclude soft-deleted)
      const project = await db
        .select({ ownerId: projects.ownerId })
        .from(projects)
        .where(
          and(eq(projects.id, input.projectId), isNull(projects.deletedAt))
        )
        .limit(1);

      if (project.length === 0) {
        throw new ORPCError("NOT_FOUND", {
          message: "Project not found",
        });
      }

      // Check name uniqueness if name is being changed
      // Use project owner's ID (not editing user) for uniqueness scope
      // Only check against active (non-deleted) projects
      if (input.name) {
        const existingName = await db
          .select({ id: projects.id })
          .from(projects)
          .where(
            and(
              eq(projects.ownerId, project[0].ownerId),
              eq(projects.name, input.name),
              sql`${projects.id} != ${input.projectId}`,
              isNull(projects.deletedAt)
            )
          )
          .limit(1);

        if (existingName.length > 0) {
          throw new ORPCError("BAD_REQUEST", {
            message: "Project name must be unique",
          });
        }
      }

      // Build update object
      const updateData: {
        name?: string;
        description?: string;
        updatedAt: Date;
      } = {
        updatedAt: new Date(),
      };

      if (input.name !== undefined) {
        updateData.name = input.name;
      }
      if (input.description !== undefined) {
        updateData.description = input.description;
      }

      const [updated] = await db
        .update(projects)
        .set(updateData)
        .where(eq(projects.id, input.projectId))
        .returning({
          id: projects.id,
          key: projects.key,
          name: projects.name,
          description: projects.description,
          updatedAt: projects.updatedAt,
        });

      log.info(
        { projectId: input.projectId, userId: context.session.user.id },
        "Project updated"
      );

      return updated;
    }),

  /**
   * List project members
   * System admins can view members of any project.
   */
  listMembers: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .handler(async ({ context, input }) => {
      await requireCanView(input.projectId, context.session.user);

      const members = await db
        .select({
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: projectMembers.role,
          joinedAt: projectMembers.joinedAt,
        })
        .from(projectMembers)
        .innerJoin(user, eq(user.id, projectMembers.userId))
        .where(eq(projectMembers.projectId, input.projectId))
        .orderBy(sql`${projectMembers.joinedAt} ASC`);

      return members.map((member) => ({
        user: {
          id: member.id,
          name: member.name,
          email: member.email,
          image: member.image,
        },
        role: member.role,
        joinedAt: toIsoString(member.joinedAt),
      }));
    }),

  /**
   * Search users by email/name for invitation
   * System admins can search for any project.
   */
  searchInviteCandidates: protectedProcedure
    .input(z.object({ projectId: z.string(), query: z.string() }))
    .handler(async ({ context, input }) => {
      await requireCanManageMembers(
        input.projectId,
        context.session.user,
        "invite"
      );

      const query = input.query.trim();
      if (query.length < 2) {
        throw new ORPCError("BAD_REQUEST", {
          message: "Search query must be at least 2 characters",
        });
      }

      const search = `%${query.toLowerCase()}%`;

      const results = await db
        .select({
          id: user.id,
          name: user.name,
          email: user.email,
          avatar: user.image,
          isMember: sql<boolean>`(${projectMembers.userId} is not null)`.as(
            "isMember"
          ),
        })
        .from(user)
        .leftJoin(
          projectMembers,
          and(
            eq(projectMembers.userId, user.id),
            eq(projectMembers.projectId, input.projectId)
          )
        )
        .where(
          sql`(lower(${user.email}) like ${search} or lower(${user.name}) like ${search})`
        )
        .orderBy(sql`${user.email} ASC`)
        .limit(10);

      return results;
    }),

  /**
   * Invite a user to the project (immediate membership)
   * System admins can invite to any project.
   */
  inviteMember: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        userId: z.string(),
        role: z.enum(["member", "admin"]).optional(),
      })
    )
    .handler(async ({ context, input }) => {
      const inviterId = context.session.user.id;

      await requireCanManageMembers(
        input.projectId,
        context.session.user,
        "invite"
      );

      const role = input.role ?? "member";

      const existingUser = await db
        .select({ id: user.id })
        .from(user)
        .where(eq(user.id, input.userId))
        .limit(1);

      if (existingUser.length === 0) {
        throw new ORPCError("BAD_REQUEST", {
          message: "User not found",
        });
      }

      const existingMember = await db
        .select({ id: projectMembers.id })
        .from(projectMembers)
        .where(
          and(
            eq(projectMembers.projectId, input.projectId),
            eq(projectMembers.userId, input.userId)
          )
        )
        .limit(1);

      if (existingMember.length > 0) {
        throw new ORPCError("BAD_REQUEST", {
          message: "User is already a member",
        });
      }

      let member: {
        id: string;
        userId: string;
        role: "owner" | "admin" | "member";
        joinedAt: Date;
      };

      try {
        const [createdMember] = await db
          .insert(projectMembers)
          .values({
            projectId: input.projectId,
            userId: input.userId,
            role,
            invitedBy: inviterId,
          })
          .returning({
            id: projectMembers.id,
            userId: projectMembers.userId,
            role: projectMembers.role,
            joinedAt: projectMembers.joinedAt,
          });
        member = createdMember;
      } catch (error) {
        if (isUniqueViolation(error, UNIQUE_PROJECT_MEMBER_CONSTRAINT)) {
          throw new ORPCError("BAD_REQUEST", {
            message: "User is already a member",
          });
        }
        throw error;
      }

      return {
        id: member.id,
        userId: member.userId,
        role: member.role,
        joinedAt: toIsoString(member.joinedAt),
      };
    }),

  /**
   * Change member role
   * System admins can change roles in any project.
   */
  changeMemberRole: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        userId: z.string(),
        role: z.enum(["member", "admin"]),
      })
    )
    .handler(async ({ context, input }) => {
      await requireCanManageMembers(
        input.projectId,
        context.session.user,
        "change_role"
      );

      const membership = await db
        .select({ id: projectMembers.id, role: projectMembers.role })
        .from(projectMembers)
        .where(
          and(
            eq(projectMembers.projectId, input.projectId),
            eq(projectMembers.userId, input.userId)
          )
        )
        .limit(1);

      if (membership.length === 0) {
        throw new ORPCError("NOT_FOUND", {
          message: "User is not a member of this project",
        });
      }

      if (membership[0].role === "owner") {
        throw new ORPCError("BAD_REQUEST", {
          message: "Cannot change project owner role",
        });
      }

      await db
        .update(projectMembers)
        .set({
          role: input.role,
        })
        .where(eq(projectMembers.id, membership[0].id));

      return { success: true, role: input.role };
    }),

  /**
   * Transfer project ownership to another member
   * Only the current owner can transfer ownership
   */
  transferOwnership: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        newOwnerId: z.string(),
      })
    )
    .handler(async ({ context, input }) => {
      const currentOwnerId = context.session.user.id;

      await requireCanTransferOwnership(input.projectId, context.session.user);

      // Validation: Cannot transfer to self
      if (input.newOwnerId === currentOwnerId) {
        throw new ORPCError("BAD_REQUEST", {
          message: "Cannot transfer ownership to yourself",
        });
      }

      // Validate new owner is an existing project member
      const newOwnerMembership = await db
        .select({ id: projectMembers.id, role: projectMembers.role })
        .from(projectMembers)
        .where(
          and(
            eq(projectMembers.projectId, input.projectId),
            eq(projectMembers.userId, input.newOwnerId)
          )
        )
        .limit(1);

      if (newOwnerMembership.length === 0) {
        throw new ORPCError("NOT_FOUND", {
          message: "User is not a member of this project",
        });
      }

      // Validation: New owner should not already be owner
      if (newOwnerMembership[0].role === "owner") {
        throw new ORPCError("BAD_REQUEST", {
          message: "User is already the owner",
        });
      }

      // Get current owner membership for update
      const currentOwnerMembership = await db
        .select({ id: projectMembers.id })
        .from(projectMembers)
        .where(
          and(
            eq(projectMembers.projectId, input.projectId),
            eq(projectMembers.userId, currentOwnerId)
          )
        )
        .limit(1);

      // Atomic role swap in transaction
      const updatedProject = await db.transaction(async (tx) => {
        // 1. Update projects.ownerId
        const [project] = await tx
          .update(projects)
          .set({
            ownerId: input.newOwnerId,
            updatedAt: new Date(),
          })
          .where(eq(projects.id, input.projectId))
          .returning({
            id: projects.id,
            key: projects.key,
            name: projects.name,
          });

        // 2. Update old owner's role to member
        await tx
          .update(projectMembers)
          .set({ role: "member" })
          .where(eq(projectMembers.id, currentOwnerMembership[0].id));

        // 3. Update new owner's role to owner
        await tx
          .update(projectMembers)
          .set({ role: "owner" })
          .where(eq(projectMembers.id, newOwnerMembership[0].id));

        return project;
      });

      // Get new owner details for response
      const [newOwner] = await db
        .select({
          id: user.id,
          name: user.name,
          email: user.email,
        })
        .from(user)
        .where(eq(user.id, input.newOwnerId))
        .limit(1);

      log.info(
        {
          projectId: input.projectId,
          previousOwnerId: currentOwnerId,
          newOwnerId: input.newOwnerId,
        },
        "Project ownership transferred"
      );

      return {
        project: updatedProject,
        newOwner: {
          id: newOwner.id,
          name: newOwner.name,
          email: newOwner.email,
        },
      };
    }),

  /**
   * Remove a member from the project
   * System admins can remove members from any project.
   */
  removeMember: protectedProcedure
    .input(z.object({ projectId: z.string(), userId: z.string() }))
    .handler(async ({ context, input }) => {
      const actorId = context.session.user.id;

      await requireCanManageMembers(
        input.projectId,
        context.session.user,
        "remove"
      );

      if (input.userId === actorId) {
        throw new ORPCError("BAD_REQUEST", {
          message: "Cannot remove yourself",
        });
      }

      const membership = await db
        .select({ id: projectMembers.id, role: projectMembers.role })
        .from(projectMembers)
        .where(
          and(
            eq(projectMembers.projectId, input.projectId),
            eq(projectMembers.userId, input.userId)
          )
        )
        .limit(1);

      if (membership.length === 0) {
        throw new ORPCError("NOT_FOUND", {
          message: "User is not a member of this project",
        });
      }

      if (membership[0].role === "owner") {
        throw new ORPCError("BAD_REQUEST", {
          message: "Cannot remove project owner",
        });
      }

      await db
        .delete(projectMembers)
        .where(eq(projectMembers.id, membership[0].id));

      return { success: true };
    }),

  /**
   * Get project impact summary for delete confirmation dialog
   * Returns counts of resources that will be affected by deletion
   * System admins can view impact for any project.
   */
  getImpact: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .handler(async ({ context, input }) => {
      await requireCanDelete(input.projectId, context.session.user);

      // Verify project exists and is not deleted
      const project = await db
        .select({ id: projects.id })
        .from(projects)
        .where(
          and(eq(projects.id, input.projectId), isNull(projects.deletedAt))
        )
        .limit(1);

      if (project.length === 0) {
        throw new ORPCError("NOT_FOUND", {
          message: "Project not found",
        });
      }

      // Get member count
      const [memberResult] = await db
        .select({ count: count(projectMembers.id) })
        .from(projectMembers)
        .where(eq(projectMembers.projectId, input.projectId));

      return {
        cardCount: 0, // Cards don't exist yet (Epic 3+)
        memberCount: Number(memberResult?.count ?? 0),
        resourceCount: 0, // Resources don't exist yet (Epic 3+)
      };
    }),

  /**
   * Soft-delete (archive) a project
   * Owner or system admin. Sets deletedAt timestamp, project can be restored within 30 days.
   */
  delete: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .handler(async ({ context, input }) => {
      await requireCanDelete(input.projectId, context.session.user);

      // Verify project exists and is not already deleted
      const project = await db
        .select({ id: projects.id, deletedAt: projects.deletedAt })
        .from(projects)
        .where(eq(projects.id, input.projectId))
        .limit(1);

      if (project.length === 0) {
        throw new ORPCError("NOT_FOUND", {
          message: "Project not found",
        });
      }

      if (project[0].deletedAt !== null) {
        throw new ORPCError("BAD_REQUEST", {
          message: "Project is already archived",
        });
      }

      // Soft-delete: set deletedAt timestamp
      await db
        .update(projects)
        .set({ deletedAt: new Date(), updatedAt: new Date() })
        .where(eq(projects.id, input.projectId));

      log.info(
        { projectId: input.projectId, userId: context.session.user.id },
        "Project archived"
      );

      return { success: true };
    }),

  /**
   * List archived (soft-deleted) projects
   * System admin only - shows projects pending permanent deletion
   */
  listArchived: protectedProcedure.handler(async ({ context }) => {
    const userId = context.session.user.id;

    // Fetch user role from database (admin plugin adds role column)
    const userRecord = await db
      .select({ role: user.role })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (userRecord.length === 0 || userRecord[0].role !== "admin") {
      throw new ORPCError("FORBIDDEN", {
        message: "System admin access required",
      });
    }

    const archivedProjects = await db
      .select({
        id: projects.id,
        key: projects.key,
        name: projects.name,
        description: projects.description,
        ownerId: projects.ownerId,
        createdAt: projects.createdAt,
        deletedAt: projects.deletedAt,
        ownerName: user.name,
        ownerEmail: user.email,
      })
      .from(projects)
      .innerJoin(user, eq(user.id, projects.ownerId))
      .where(isNotNull(projects.deletedAt))
      .orderBy(sql`${projects.deletedAt} DESC`);

    return archivedProjects.map((p) => ({
      id: p.id,
      key: p.key,
      name: p.name,
      description: p.description,
      createdAt: p.createdAt,
      deletedAt: p.deletedAt,
      owner: {
        id: p.ownerId,
        name: p.ownerName,
        email: p.ownerEmail,
      },
    }));
  }),

  /**
   * Restore an archived project
   * System admin only - removes deletedAt timestamp
   */
  restore: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .handler(async ({ context, input }) => {
      const userId = context.session.user.id;

      // Fetch user role from database (admin plugin adds role column)
      const userRecord = await db
        .select({ role: user.role })
        .from(user)
        .where(eq(user.id, userId))
        .limit(1);

      if (userRecord.length === 0 || userRecord[0].role !== "admin") {
        throw new ORPCError("FORBIDDEN", {
          message: "System admin access required",
        });
      }

      // Verify project exists and IS archived
      const project = await db
        .select({
          id: projects.id,
          key: projects.key,
          name: projects.name,
          deletedAt: projects.deletedAt,
        })
        .from(projects)
        .where(eq(projects.id, input.projectId))
        .limit(1);

      if (project.length === 0) {
        throw new ORPCError("NOT_FOUND", {
          message: "Project not found",
        });
      }

      if (project[0].deletedAt === null) {
        throw new ORPCError("BAD_REQUEST", {
          message: "Project is not archived",
        });
      }

      // Restore: clear deletedAt timestamp
      const [restored] = await db
        .update(projects)
        .set({ deletedAt: null, updatedAt: new Date() })
        .where(eq(projects.id, input.projectId))
        .returning({
          id: projects.id,
          key: projects.key,
          name: projects.name,
        });

      log.info(
        { projectId: input.projectId, userId: context.session.user.id },
        "Project restored"
      );

      return restored;
    }),
};
