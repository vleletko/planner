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

  test("future project-scoped management requires at least member", () => {
    const memberRole: ProjectRole = "member";

    const futurePermissions: ProjectPermission[] = [
      PROJECT_PERMISSIONS.STATUSES_MANAGE,
      PROJECT_PERMISSIONS.CARD_TYPES_MANAGE,
      PROJECT_PERMISSIONS.FIELDS_MANAGE,
      PROJECT_PERMISSIONS.CARDS_MANAGE,
      PROJECT_PERMISSIONS.RESOURCES_MANAGE,
    ];

    for (const permission of futurePermissions) {
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
