import { ORPCError } from "@orpc/server";

export type ProjectRole = "owner" | "admin" | "member";

export const PROJECT_PERMISSIONS = {
  PROJECT_READ: "project:read",
  PROJECT_UPDATE: "project:update",

  MEMBERS_INVITE: "members:invite",
  MEMBERS_REMOVE: "members:remove",
  MEMBERS_CHANGE_ROLE: "members:change-role",

  PROJECT_TRANSFER_OWNERSHIP: "project:transfer-ownership",
  PROJECT_DELETE: "project:delete",
  PROJECT_ARCHIVE: "project:archive",

  // Future project-scoped routers (Epic 3+)
  STATUSES_MANAGE: "statuses:manage",
  CARD_TYPES_MANAGE: "card-types:manage",
  FIELDS_MANAGE: "fields:manage",
  CARDS_MANAGE: "cards:manage",
  RESOURCES_MANAGE: "resources:manage",
} as const;

export type ProjectPermission =
  (typeof PROJECT_PERMISSIONS)[keyof typeof PROJECT_PERMISSIONS];

const PROJECT_PERMISSION_MATRIX: Record<
  ProjectPermission,
  readonly ProjectRole[]
> = {
  [PROJECT_PERMISSIONS.PROJECT_READ]: ["owner", "admin", "member"],
  [PROJECT_PERMISSIONS.PROJECT_UPDATE]: ["owner", "admin"],

  [PROJECT_PERMISSIONS.MEMBERS_INVITE]: ["owner", "admin"],
  [PROJECT_PERMISSIONS.MEMBERS_REMOVE]: ["owner", "admin"],
  [PROJECT_PERMISSIONS.MEMBERS_CHANGE_ROLE]: ["owner", "admin"],

  // Owner-only until later stories explicitly widen this.
  [PROJECT_PERMISSIONS.PROJECT_TRANSFER_OWNERSHIP]: ["owner"],
  [PROJECT_PERMISSIONS.PROJECT_DELETE]: ["owner"],
  [PROJECT_PERMISSIONS.PROJECT_ARCHIVE]: ["owner"],

  // Member actions (future): everyone in the project can manage project-scoped resources.
  [PROJECT_PERMISSIONS.STATUSES_MANAGE]: ["owner", "admin", "member"],
  [PROJECT_PERMISSIONS.CARD_TYPES_MANAGE]: ["owner", "admin", "member"],
  [PROJECT_PERMISSIONS.FIELDS_MANAGE]: ["owner", "admin", "member"],
  [PROJECT_PERMISSIONS.CARDS_MANAGE]: ["owner", "admin", "member"],
  [PROJECT_PERMISSIONS.RESOURCES_MANAGE]: ["owner", "admin", "member"],
};

export function formatAllowedProjectRoles(
  roles: readonly ProjectRole[]
): string {
  if (roles.length === 0) {
    return "";
  }

  if (roles.length === 1) {
    return roles[0];
  }

  if (roles.length === 2) {
    return `${roles[0]} or ${roles[1]}`;
  }

  const allButLast = roles.slice(0, -1);
  const last = roles.at(-1);
  if (!last) {
    return allButLast.join(", ");
  }
  return `${allButLast.join(", ")}, or ${last}`;
}

const PERMISSION_ACTION: Record<ProjectPermission, string> = {
  [PROJECT_PERMISSIONS.PROJECT_READ]: "access this project",
  [PROJECT_PERMISSIONS.PROJECT_UPDATE]: "edit project settings",

  [PROJECT_PERMISSIONS.MEMBERS_INVITE]: "invite users to the project",
  [PROJECT_PERMISSIONS.MEMBERS_REMOVE]: "remove project members",
  [PROJECT_PERMISSIONS.MEMBERS_CHANGE_ROLE]: "change member roles",

  [PROJECT_PERMISSIONS.PROJECT_TRANSFER_OWNERSHIP]:
    "transfer project ownership",
  [PROJECT_PERMISSIONS.PROJECT_DELETE]: "delete this project",
  [PROJECT_PERMISSIONS.PROJECT_ARCHIVE]: "archive this project",

  [PROJECT_PERMISSIONS.STATUSES_MANAGE]: "manage statuses",
  [PROJECT_PERMISSIONS.CARD_TYPES_MANAGE]: "manage card types",
  [PROJECT_PERMISSIONS.FIELDS_MANAGE]: "manage fields",
  [PROJECT_PERMISSIONS.CARDS_MANAGE]: "manage cards",
  [PROJECT_PERMISSIONS.RESOURCES_MANAGE]: "manage resources",
};

export function permissionDeniedMessage({
  action,
  permission,
  allowedRoles,
}: {
  action?: string;
  permission?: ProjectPermission;
  allowedRoles?: readonly ProjectRole[];
}): string {
  const derivedAction =
    action ??
    (permission ? PERMISSION_ACTION[permission] : "perform this action");

  const allowedRolesHint =
    allowedRoles && allowedRoles.length > 0
      ? ` (requires ${formatAllowedProjectRoles(allowedRoles)})`
      : "";

  return `You don't have permission to ${derivedAction}${allowedRolesHint}. Contact project owner.`;
}

export function requireAllowedProjectRole({
  role,
  allowedRoles,
  permission,
  action,
  isSystemAdmin = false,
}: {
  role: ProjectRole;
  allowedRoles: readonly ProjectRole[];
  permission: ProjectPermission;
  action?: string;
  isSystemAdmin?: boolean;
}): ProjectRole {
  if (isSystemAdmin) {
    return role;
  }

  if (!allowedRoles.includes(role)) {
    throw new ORPCError("FORBIDDEN", {
      message: permissionDeniedMessage({ action, permission, allowedRoles }),
    });
  }

  return role;
}

export function canProjectRole({
  role,
  permission,
  isSystemAdmin = false,
}: {
  role: ProjectRole;
  permission: ProjectPermission;
  /**
   * Forward-compatible support for a future global admin concept.
   * Not currently represented in the DB schema.
   */
  isSystemAdmin?: boolean;
}): boolean {
  if (isSystemAdmin) {
    return true;
  }

  const allowedRoles = PROJECT_PERMISSION_MATRIX[permission];
  return allowedRoles.includes(role);
}
