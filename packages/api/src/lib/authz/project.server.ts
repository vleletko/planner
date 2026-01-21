import { ORPCError } from "@orpc/server";
import { and, db, eq, projectMembers, user } from "@planner/db";

import {
  canDeleteProject,
  canManageMembers,
  canTransferOwnership,
  canUpdateProject,
  canViewProject,
  checkSystemAdmin,
  type ProjectPermission,
  type ProjectRole,
  requireAllowedProjectRole,
  requireProjectAccess,
  type UserRole,
} from "./project";

/**
 * Session user shape from Better Auth with admin plugin.
 * The admin plugin adds the `role` field to the user at runtime,
 * but TypeScript doesn't know about it. We use a type that accepts
 * any object with at least an id, and extracts the role (defaults to "user").
 */
export type SessionUser = { id: string; role?: UserRole | string | null };

/**
 * Helper to extract SessionUser with role from Better Auth session user.
 * Handles the case where role might not be typed by Better Auth.
 */
export function toSessionUser(authUser: { id: string; role?: string | null }): {
  id: string;
  role: UserRole;
} {
  return {
    id: authUser.id,
    role: authUser.role === "admin" ? "admin" : "user",
  };
}

/**
 * Check if a user is a system admin by fetching their role from the database.
 * Use this when the user's role is not available in the session context.
 *
 * @deprecated Use session.user.role directly instead of fetching from DB
 */
export async function checkUserIsSystemAdmin(userId: string): Promise<boolean> {
  const userRecord = await db
    .select({ role: user.role })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  if (userRecord.length === 0) {
    return false;
  }

  return checkSystemAdmin(userRecord[0].role);
}

/**
 * Get user's role in a project, or null if not a member.
 */
export async function getProjectRole(
  projectId: string,
  userId: string
): Promise<ProjectRole | null> {
  const membership = await db
    .select({ role: projectMembers.role })
    .from(projectMembers)
    .where(
      and(
        eq(projectMembers.projectId, projectId),
        eq(projectMembers.userId, userId)
      )
    )
    .limit(1);

  return membership.length > 0 ? membership[0].role : null;
}

/**
 * Require that user has access to a project.
 * System admins can access any project even if not a member.
 *
 * @deprecated Use requireCanView instead
 */
export async function requireProjectMember({
  projectId,
  userId,
  isSystemAdmin = false,
}: {
  projectId: string;
  userId: string;
  isSystemAdmin?: boolean;
}): Promise<{ role: ProjectRole }> {
  const role = await getProjectRole(projectId, userId);
  const effectiveRole = requireProjectAccess({ role, isSystemAdmin });
  return { role: effectiveRole };
}

/**
 * @deprecated Use the new requireCan* functions instead
 */
export async function requireProjectRole({
  projectId,
  userId,
  allowedRoles,
  permission,
  action,
  isSystemAdmin = false,
}: {
  projectId: string;
  userId: string;
  allowedRoles: readonly ProjectRole[];
  permission: ProjectPermission;
  action?: string;
  isSystemAdmin?: boolean;
}): Promise<{ role: ProjectRole }> {
  const { role } = await requireProjectMember({
    projectId,
    userId,
    isSystemAdmin,
  });

  requireAllowedProjectRole({
    role,
    allowedRoles,
    permission,
    action,
    isSystemAdmin,
  });

  return { role };
}

// ============================================
// NEW DRY PERMISSION FUNCTIONS
// ============================================

/**
 * Require project view access (throws FORBIDDEN if not allowed)
 */
export async function requireCanView(
  projectId: string,
  sessionUser: SessionUser
): Promise<{ role: ProjectRole }> {
  const { id, role: systemRole } = toSessionUser(sessionUser);
  const projectRole = await getProjectRole(projectId, id);

  if (!canViewProject(projectRole, systemRole)) {
    throw new ORPCError("FORBIDDEN", {
      message: "You don't have access to this project. Contact project owner.",
    });
  }

  // Return effective role (synthetic admin for non-member system admins)
  return { role: projectRole ?? "admin" };
}

/**
 * Require project update permission (throws FORBIDDEN if not allowed)
 * Error message is action-specific but doesn't reveal required roles (security)
 */
export async function requireCanUpdate(
  projectId: string,
  sessionUser: SessionUser
): Promise<{ role: ProjectRole }> {
  const { id, role: systemRole } = toSessionUser(sessionUser);
  const projectRole = await getProjectRole(projectId, id);

  if (!canUpdateProject(projectRole, systemRole)) {
    throw new ORPCError("FORBIDDEN", {
      message: "You don't have permission to edit project settings.",
    });
  }

  return { role: projectRole ?? "admin" };
}

/**
 * Require manage members permission (throws FORBIDDEN if not allowed)
 * Error message is action-specific but doesn't reveal required roles (security)
 */
export async function requireCanManageMembers(
  projectId: string,
  sessionUser: SessionUser,
  action: "invite" | "remove" | "change_role"
): Promise<{ role: ProjectRole }> {
  const { id, role: systemRole } = toSessionUser(sessionUser);
  const projectRole = await getProjectRole(projectId, id);

  if (!canManageMembers(projectRole, systemRole)) {
    const actionMessages = {
      invite: "invite users to the project",
      remove: "remove project members",
      change_role: "change member roles",
    } as const;

    throw new ORPCError("FORBIDDEN", {
      message: `You don't have permission to ${actionMessages[action]}.`,
    });
  }

  return { role: projectRole ?? "admin" };
}

/**
 * Require delete permission (throws FORBIDDEN if not allowed)
 * Error message is action-specific but doesn't reveal required roles (security)
 */
export async function requireCanDelete(
  projectId: string,
  sessionUser: SessionUser
): Promise<{ role: ProjectRole }> {
  const { id, role: systemRole } = toSessionUser(sessionUser);
  const projectRole = await getProjectRole(projectId, id);

  if (!canDeleteProject(projectRole, systemRole)) {
    throw new ORPCError("FORBIDDEN", {
      message: "You don't have permission to delete this project.",
    });
  }

  return { role: projectRole ?? "admin" };
}

/**
 * Require transfer ownership permission (throws FORBIDDEN if not allowed)
 * Error message is action-specific but doesn't reveal required roles (security)
 */
export async function requireCanTransferOwnership(
  projectId: string,
  sessionUser: SessionUser
): Promise<{ role: ProjectRole }> {
  const { id, role: systemRole } = toSessionUser(sessionUser);
  const projectRole = await getProjectRole(projectId, id);

  if (!canTransferOwnership(projectRole, systemRole)) {
    throw new ORPCError("FORBIDDEN", {
      message: "You don't have permission to transfer project ownership.",
    });
  }

  return { role: projectRole ?? "admin" };
}
