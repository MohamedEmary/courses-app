import { describe, expect, it } from "vitest";
import { COMPANY_DOMAIN, USER_ROLES } from "@/utils/constants.ts";
import { getUserRoleForEmail } from "@/utils/getUserRoleForEmail.ts";

describe("getUserRoleForEmail", () => {
  it("returns the admin role for emails ending in the company domain", () => {
    expect(getUserRoleForEmail(`boss${COMPANY_DOMAIN}`)).toBe(USER_ROLES.ADMIN);
  });

  it("returns the user role for other emails", () => {
    expect(getUserRoleForEmail("alice@gmail.com")).toBe(USER_ROLES.USER);
  });

  it("is case-sensitive to the exact company domain suffix", () => {
    // Registration lowercases emails first, so this never happens in practice,
    // but the mapping itself is a plain suffix check.
    expect(getUserRoleForEmail(`BOSS${COMPANY_DOMAIN.toUpperCase()}`)).toBe(
      USER_ROLES.USER,
    );
  });
});
