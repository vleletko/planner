import { ORPCError } from "@orpc/server";
import {
  and,
  count,
  db,
  eq,
  inArray,
  projectMembers,
  projects,
  sql,
  user,
} from "@planner/db";
import { createLogger } from "@planner/logger";
import { z } from "zod";
import { protectedProcedure } from "../index";
import { PROJECT_PERMISSIONS } from "../lib/authz/project";
import {
  requireProjectMember,
  requireProjectRole,
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

const UNIQUE_PROJECT_MEMBER_CONSTRAINT = "unique_project_member";

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
   */
  list: protectedProcedure.handler(async ({ context }) => {
    const userId = context.session.user.id;

    const result = await db
      .select({
        id: projects.id,
        key: projects.key,
        name: projects.name,
        description: projects.description,
        createdAt: projects.createdAt,
        role: projectMembers.role,
        ownerId: projects.ownerId,
      })
      .from(projects)
      .innerJoin(projectMembers, eq(projectMembers.projectId, projects.id))
      .where(eq(projectMembers.userId, userId))
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
   * Validates key uniqueness and name uniqueness per user
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

      // Check key uniqueness
      const existingKey = await db
        .select({ id: projects.id })
        .from(projects)
        .where(eq(projects.key, input.key))
        .limit(1);

      if (existingKey.length > 0) {
        throw new ORPCError("BAD_REQUEST", {
          message: "Project key already exists",
        });
      }

      // Check name uniqueness per user
      const existingName = await db
        .select({ id: projects.id })
        .from(projects)
        .where(and(eq(projects.ownerId, userId), eq(projects.name, input.name)))
        .limit(1);

      if (existingName.length > 0) {
        throw new ORPCError("BAD_REQUEST", {
          message: "Project name must be unique",
        });
      }

      // Create project and add owner as member in a single transaction
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
    }),

  /**
   * Get a single project by ID
   * Verifies user is a member of the project
   */
  get: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .handler(async ({ context, input }) => {
      const userId = context.session.user.id;

      const { role } = await requireProjectMember({
        projectId: input.projectId,
        userId,
      });

      // Get project with owner info
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
        .where(eq(projects.id, input.projectId))
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
   * Owner or admin can update. Key is immutable.
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
      const userId = context.session.user.id;

      await requireProjectRole({
        projectId: input.projectId,
        userId,
        allowedRoles: ["owner", "admin"],
        permission: PROJECT_PERMISSIONS.PROJECT_UPDATE,
        action: "edit project settings",
      });

      // Get project to check existence and get ownerId for name uniqueness
      const project = await db
        .select({ ownerId: projects.ownerId })
        .from(projects)
        .where(eq(projects.id, input.projectId))
        .limit(1);

      if (project.length === 0) {
        throw new ORPCError("NOT_FOUND", {
          message: "Project not found",
        });
      }

      // Check name uniqueness if name is being changed
      // Use project owner's ID (not editing user) for uniqueness scope
      if (input.name) {
        const existingName = await db
          .select({ id: projects.id })
          .from(projects)
          .where(
            and(
              eq(projects.ownerId, project[0].ownerId),
              eq(projects.name, input.name),
              sql`${projects.id} != ${input.projectId}`
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

      log.info({ projectId: input.projectId, userId }, "Project updated");

      return updated;
    }),

  /**
   * List project members
   */
  listMembers: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .handler(async ({ context, input }) => {
      const userId = context.session.user.id;

      await requireProjectMember({ projectId: input.projectId, userId });

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
   */
  searchInviteCandidates: protectedProcedure
    .input(z.object({ projectId: z.string(), query: z.string() }))
    .handler(async ({ context, input }) => {
      const userId = context.session.user.id;

      await requireProjectRole({
        projectId: input.projectId,
        userId,
        allowedRoles: ["owner", "admin"],
        permission: PROJECT_PERMISSIONS.MEMBERS_INVITE,
      });

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

      await requireProjectRole({
        projectId: input.projectId,
        userId: inviterId,
        allowedRoles: ["owner", "admin"],
        permission: PROJECT_PERMISSIONS.MEMBERS_INVITE,
      });

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
      const actorId = context.session.user.id;

      await requireProjectRole({
        projectId: input.projectId,
        userId: actorId,
        allowedRoles: ["owner", "admin"],
        permission: PROJECT_PERMISSIONS.MEMBERS_CHANGE_ROLE,
      });

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

      await requireProjectRole({
        projectId: input.projectId,
        userId: currentOwnerId,
        allowedRoles: ["owner"],
        permission: PROJECT_PERMISSIONS.PROJECT_TRANSFER_OWNERSHIP,
      });

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
   */
  removeMember: protectedProcedure
    .input(z.object({ projectId: z.string(), userId: z.string() }))
    .handler(async ({ context, input }) => {
      const actorId = context.session.user.id;

      await requireProjectRole({
        projectId: input.projectId,
        userId: actorId,
        allowedRoles: ["owner", "admin"],
        permission: PROJECT_PERMISSIONS.MEMBERS_REMOVE,
      });

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
   * Delete project
   * API-only for E2E test cleanup (no UI implemented yet)
   */
  delete: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .handler(async ({ input }) => {
      await db.delete(projects).where(eq(projects.id, input.projectId));

      log.info({ projectId: input.projectId }, "Project deleted");

      return { success: true };
    }),
};
