import { describe, expect, test } from "bun:test";

import {
  formatAllowedProjectRoles,
  PROJECT_PERMISSIONS,
  permissionDeniedMessage,
} from "./project";

describe("project authz messages", () => {
  test("formatAllowedProjectRoles uses natural language", () => {
    expect(formatAllowedProjectRoles(["owner"])).toBe("owner");
    expect(formatAllowedProjectRoles(["owner", "admin"])).toBe(
      "owner or admin"
    );
    expect(formatAllowedProjectRoles(["owner", "admin", "member"])).toBe(
      "owner, admin, or member"
    );
  });

  test("permissionDeniedMessage matches UX pattern", () => {
    expect(permissionDeniedMessage({ action: "edit project settings" })).toBe(
      "You don't have permission to edit project settings. Contact project owner."
    );
  });

  test("permissionDeniedMessage can include required role hint", () => {
    expect(
      permissionDeniedMessage({
        action: "edit project settings",
        allowedRoles: ["owner", "admin"],
      })
    ).toBe(
      "You don't have permission to edit project settings (requires owner or admin). Contact project owner."
    );
  });

  test("permissionDeniedMessage supports permission enums", () => {
    expect(
      permissionDeniedMessage({
        permission: PROJECT_PERMISSIONS.PROJECT_UPDATE,
        allowedRoles: ["owner", "admin"],
      })
    ).toBe(
      "You don't have permission to edit project settings (requires owner or admin). Contact project owner."
    );
  });
});
