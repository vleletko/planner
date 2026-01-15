import { ORPCError } from "@orpc/server";
import { and, db, eq, projectMembers } from "@planner/db";

import {
  type ProjectPermission,
  type ProjectRole,
  requireAllowedProjectRole,
} from "./project";

export async function requireProjectMember({
  projectId,
  userId,
}: {
  projectId: string;
  userId: string;
}): Promise<{ role: ProjectRole }> {
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

  if (membership.length === 0) {
    throw new ORPCError("FORBIDDEN", {
      message: "You don't have access to this project. Contact project owner.",
    });
  }

  return { role: membership[0].role };
}

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
  const { role } = await requireProjectMember({ projectId, userId });

  requireAllowedProjectRole({
    role,
    allowedRoles,
    permission,
    action,
    isSystemAdmin,
  });

  return { role };
}
