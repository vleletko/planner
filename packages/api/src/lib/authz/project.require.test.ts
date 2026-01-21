import { describe, expect, test } from "bun:test";
import { ORPCError } from "@orpc/server";

import {
  canDeleteProject,
  canManageMembers,
  canTransferOwnership,
  canUpdateProject,
  canViewProject,
  PROJECT_PERMISSIONS,
  type ProjectRole,
  requireAllowedProjectRole,
  requireProjectAccess,
} from "./project";

describe("requireProjectAccess", () => {
  test("system admin can access project they are not a member of", () => {
    const result = requireProjectAccess({ role: null, isSystemAdmin: true });
    expect(result).toBe("admin");
  });

  test("system admin who is a member keeps their actual role", () => {
    const result = requireProjectAccess({
      role: "member",
      isSystemAdmin: true,
    });
    expect(result).toBe("member");
  });

  test("system admin who is owner keeps owner role", () => {
    const result = requireProjectAccess({ role: "owner", isSystemAdmin: true });
    expect(result).toBe("owner");
  });

  test("non-admin non-member throws FORBIDDEN", () => {
    expect(() =>
      requireProjectAccess({ role: null, isSystemAdmin: false })
    ).toThrow(ORPCError);

    try {
      requireProjectAccess({ role: null, isSystemAdmin: false });
      throw new Error("Expected requireProjectAccess to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(ORPCError);
      expect((error as ORPCError).code).toBe("FORBIDDEN");
      expect((error as ORPCError).message).toContain("Contact project owner");
    }
  });

  test("non-admin member returns their role", () => {
    const result = requireProjectAccess({
      role: "owner",
      isSystemAdmin: false,
    });
    expect(result).toBe("owner");
  });

  test("non-admin admin role returns admin", () => {
    const result = requireProjectAccess({
      role: "admin",
      isSystemAdmin: false,
    });
    expect(result).toBe("admin");
  });
});

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

// ============================================
// PURE PERMISSION FUNCTION TESTS
// ============================================

describe("canViewProject", () => {
  test("allows any project member to view", () => {
    expect(canViewProject("owner", "user")).toBe(true);
    expect(canViewProject("admin", "user")).toBe(true);
    expect(canViewProject("member", "user")).toBe(true);
  });

  test("denies non-members", () => {
    expect(canViewProject(null, "user")).toBe(false);
  });

  test("allows system admin even without project role", () => {
    expect(canViewProject(null, "admin")).toBe(true);
  });

  test("allows system admin who is also a member", () => {
    expect(canViewProject("member", "admin")).toBe(true);
  });
});

describe("canUpdateProject", () => {
  test("allows project owner", () => {
    expect(canUpdateProject("owner", "user")).toBe(true);
  });

  test("allows project admin", () => {
    expect(canUpdateProject("admin", "user")).toBe(true);
  });

  test("denies project member", () => {
    expect(canUpdateProject("member", "user")).toBe(false);
  });

  test("denies non-members", () => {
    expect(canUpdateProject(null, "user")).toBe(false);
  });

  test("allows system admin even without project role", () => {
    expect(canUpdateProject(null, "admin")).toBe(true);
  });
});

describe("canManageMembers", () => {
  test("allows project owner", () => {
    expect(canManageMembers("owner", "user")).toBe(true);
  });

  test("allows project admin", () => {
    expect(canManageMembers("admin", "user")).toBe(true);
  });

  test("denies project member", () => {
    expect(canManageMembers("member", "user")).toBe(false);
  });

  test("denies non-members", () => {
    expect(canManageMembers(null, "user")).toBe(false);
  });

  test("allows system admin even without project role", () => {
    expect(canManageMembers(null, "admin")).toBe(true);
  });
});

describe("canDeleteProject", () => {
  test("allows only project owner", () => {
    expect(canDeleteProject("owner", "user")).toBe(true);
    expect(canDeleteProject("admin", "user")).toBe(false);
    expect(canDeleteProject("member", "user")).toBe(false);
  });

  test("denies non-members", () => {
    expect(canDeleteProject(null, "user")).toBe(false);
  });

  test("allows system admin even without project role", () => {
    expect(canDeleteProject(null, "admin")).toBe(true);
  });
});

describe("canTransferOwnership", () => {
  test("allows only project owner", () => {
    expect(canTransferOwnership("owner", "user")).toBe(true);
    expect(canTransferOwnership("admin", "user")).toBe(false);
    expect(canTransferOwnership("member", "user")).toBe(false);
  });

  test("denies non-members", () => {
    expect(canTransferOwnership(null, "user")).toBe(false);
  });

  test("allows system admin even without project role", () => {
    expect(canTransferOwnership(null, "admin")).toBe(true);
  });
});
