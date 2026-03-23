import { describe, expect, it } from "vitest";
import { getDefaultAdminRoute } from "@/lib/adminAccess";

describe("getDefaultAdminRoute", () => {
  it("returns null when the user has no admin roles", () => {
    expect(
      getDefaultAdminRoute({
        isAdmin: false,
        userRoles: [],
        userPermissions: [],
      }),
    ).toBeNull();
  });

  it("falls back to profile when the user has a role but no explicit permissions", () => {
    expect(
      getDefaultAdminRoute({
        isAdmin: false,
        userRoles: ["user"],
        userPermissions: [],
      }),
    ).toBe("/admin/profile");
  });

  it("returns the first allowed admin page from explicit permissions", () => {
    expect(
      getDefaultAdminRoute({
        isAdmin: false,
        userRoles: ["user"],
        userPermissions: ["view_orders"],
      }),
    ).toBe("/admin/orders");
  });

  it("always sends admins to the dashboard", () => {
    expect(
      getDefaultAdminRoute({
        isAdmin: true,
        userRoles: ["admin"],
        userPermissions: [],
      }),
    ).toBe("/admin");
  });
});
