import { describe, expect, test } from "bun:test";
import { ORPCError } from "@orpc/server";

import {
  PROJECT_PERMISSIONS,
  type ProjectRole,
  requireAllowedProjectRole,
} from "./project";

describe("project authz role enforcement", () => {
  test("throws FORBIDDEN when role not allowed", () => {
    const role: ProjectRole = "member";

    expect(() =>
      requireAllowedProjectRole({
        role,
        allowedRoles: ["owner", "admin"],
        permission: PROJECT_PERMISSIONS.PROJECT_UPDATE,
      })
    ).toThrow(ORPCError);

    try {
      requireAllowedProjectRole({
        role,
        allowedRoles: ["owner", "admin"],
        permission: PROJECT_PERMISSIONS.PROJECT_UPDATE,
      });
      throw new Error("Expected requireAllowedProjectRole to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(ORPCError);
      expect((error as ORPCError).code).toBe("FORBIDDEN");
      expect((error as ORPCError).message).toContain("Contact project owner");
    }
  });

  test("returns role when allowed", () => {
    const role: ProjectRole = "admin";

    expect(
      requireAllowedProjectRole({
        role,
        allowedRoles: ["owner", "admin"],
        permission: PROJECT_PERMISSIONS.PROJECT_UPDATE,
      })
    ).toBe(role);
  });

  test("system admin override bypasses allowedRoles", () => {
    const role: ProjectRole = "member";

    expect(
      requireAllowedProjectRole({
        role,
        allowedRoles: ["owner"],
        permission: PROJECT_PERMISSIONS.PROJECT_DELETE,
        isSystemAdmin: true,
      })
    ).toBe(role);
  });
});
