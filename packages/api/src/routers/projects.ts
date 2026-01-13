import { ORPCError } from "@orpc/server";
import {
  and,
  count,
  db,
  eq,
  projectMembers,
  projects,
  sql,
  user,
} from "@planner/db";
import { createLogger } from "@planner/logger";
import { inArray } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure } from "../index";
import {
  PROJECT_CONSTRAINTS,
  PROJECT_KEY_REGEX,
} from "../lib/validation/project";

const log = createLogger("projects-router");

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
      memberCounts.map((mc) => [mc.projectId, mc.memberCount])
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

      // Check user is member
      const membership = await db
        .select({ role: projectMembers.role })
        .from(projectMembers)
        .where(
          and(
            eq(projectMembers.projectId, input.projectId),
            eq(projectMembers.userId, userId)
          )
        )
        .limit(1);

      if (membership.length === 0) {
        throw new ORPCError("FORBIDDEN", {
          message: "You don't have access to this project",
        });
      }

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
        memberCount: memberCountResult.memberCount,
        role: membership[0].role,
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

      // Verify user is owner or admin
      const membership = await db
        .select({ role: projectMembers.role })
        .from(projectMembers)
        .where(
          and(
            eq(projectMembers.projectId, input.projectId),
            eq(projectMembers.userId, userId)
          )
        )
        .limit(1);

      if (membership.length === 0) {
        throw new ORPCError("FORBIDDEN", {
          message: "You don't have access to this project",
        });
      }

      const userRole = membership[0].role;
      if (userRole !== "owner" && userRole !== "admin") {
        throw new ORPCError("FORBIDDEN", {
          message: "Only owner or admin can edit project",
        });
      }

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
};
