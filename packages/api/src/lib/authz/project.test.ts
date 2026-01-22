import { describe, expect, test } from "bun:test";

import {
  canProjectRole,
  PROJECT_PERMISSIONS,
  type ProjectPermission,
  type ProjectRole,
} from "./project";

describe("project authz permission matrix", () => {
  test("owner can do everything except system-only is irrelevant", () => {
    const role: ProjectRole = "owner";

    for (const permission of Object.values(PROJECT_PERMISSIONS)) {
      expect(canProjectRole({ role, permission })).toBe(true);
    }
  });

  test("admin can update settings and manage members", () => {
    const role: ProjectRole = "admin";

    expect(
      canProjectRole({ role, permission: PROJECT_PERMISSIONS.PROJECT_UPDATE })
    ).toBe(true);

    expect(
      canProjectRole({ role, permission: PROJECT_PERMISSIONS.MEMBERS_INVITE })
    ).toBe(true);

    expect(
      canProjectRole({
        role,
        permission: PROJECT_PERMISSIONS.MEMBERS_CHANGE_ROLE,
      })
    ).toBe(true);

    expect(
      canProjectRole({ role, permission: PROJECT_PERMISSIONS.MEMBERS_REMOVE })
    ).toBe(true);
  });

  test("admin cannot perform owner-only permissions", () => {
    const role: ProjectRole = "admin";

    expect(
      canProjectRole({
        role,
        permission: PROJECT_PERMISSIONS.PROJECT_TRANSFER_OWNERSHIP,
      })
    ).toBe(false);

    expect(
      canProjectRole({ role, permission: PROJECT_PERMISSIONS.PROJECT_DELETE })
    ).toBe(false);
  });

  test("member is read-only for settings", () => {
    const role: ProjectRole = "member";

    expect(
      canProjectRole({ role, permission: PROJECT_PERMISSIONS.PROJECT_READ })
    ).toBe(true);

    expect(
      canProjectRole({ role, permission: PROJECT_PERMISSIONS.PROJECT_UPDATE })
    ).toBe(false);
  });

  test("project-scoped management requires at least member", () => {
    const memberRole: ProjectRole = "member";

    // Note: STATUSES_MANAGE, CARD_TYPES_MANAGE, FIELDS_MANAGE are NOT here
    // These are global schema permissions managed at system admin level only
    const projectScopedPermissions: ProjectPermission[] = [
      PROJECT_PERMISSIONS.CARDS_MANAGE,
      PROJECT_PERMISSIONS.RESOURCES_MANAGE,
    ];

    for (const permission of projectScopedPermissions) {
      expect(canProjectRole({ role: memberRole, permission })).toBe(true);
    }
  });

  test("system admin override grants all permissions", () => {
    const role: ProjectRole = "member";

    for (const permission of Object.values(PROJECT_PERMISSIONS)) {
      expect(canProjectRole({ role, permission, isSystemAdmin: true })).toBe(
        true
      );
    }
  });
});
