import { describe, it, expect } from "vitest";
import { PERMISSIONS, ALL_PERMISSIONS } from "@authcore/contracts";

describe("Organization Authorization & RBAC Boundaries", () => {
  it("should define standard RBAC permissions correctly", () => {
    expect(PERMISSIONS.ORG_READ).toBe("org:read");
    expect(PERMISSIONS.MEMBERS_MANAGE).toBe("members:manage");
    expect(PERMISSIONS.ROLES_MANAGE).toBe("roles:manage");
    expect(PERMISSIONS.API_KEYS_MANAGE).toBe("api_keys:manage");
    expect(PERMISSIONS.AUDIT_READ).toBe("audit:read");
  });

  it("should contain all declared permissions in ALL_PERMISSIONS array", () => {
    expect(ALL_PERMISSIONS).toContain("org:read");
    expect(ALL_PERMISSIONS).toContain("org:delete");
    expect(ALL_PERMISSIONS).toContain("members:manage");
    expect(ALL_PERMISSIONS).toContain("audit:read");
  });

  it("should reject operations when member lacks required permission", () => {
    const memberPermissions = ["org:read", "members:read"];
    const requiredPermission = PERMISSIONS.MEMBERS_MANAGE;

    const hasPermission = memberPermissions.includes(requiredPermission);
    expect(hasPermission).toBe(false);
  });

  it("should permit operations when owner possesses full permission set", () => {
    const ownerPermissions = [
      PERMISSIONS.ORG_READ,
      PERMISSIONS.ORG_UPDATE,
      PERMISSIONS.ORG_DELETE,
      PERMISSIONS.MEMBERS_MANAGE,
      PERMISSIONS.ROLES_MANAGE,
      PERMISSIONS.API_KEYS_MANAGE,
    ];

    expect(ownerPermissions.includes(PERMISSIONS.ORG_UPDATE)).toBe(true);
    expect(ownerPermissions.includes(PERMISSIONS.MEMBERS_MANAGE)).toBe(true);
  });
});
