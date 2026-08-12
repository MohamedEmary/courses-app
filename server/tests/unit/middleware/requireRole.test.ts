import type { Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";
import { ForbiddenError, UnauthorizedError } from "@/errors/AppError.ts";
import { requireRole } from "@/middleware/requireRole.ts";
import type { UserRole } from "@/utils/constants.ts";

const run = (req: Partial<Request>, ...roles: UserRole[]) => {
  const next = vi.fn();
  let thrown: unknown;
  try {
    requireRole(...roles)(req as Request, {} as Response, next);
  } catch (err) {
    thrown = err;
  }
  return { next, thrown };
};

describe("requireRole", () => {
  it("calls next when the user role matches the required role", () => {
    const { next, thrown } = run({ userRole: "admin" }, "admin");
    expect(thrown).toBeUndefined();
    expect(next).toHaveBeenCalledOnce();
  });

  it("allows any of the accepted roles", () => {
    const { next, thrown } = run({ userRole: "user" }, "admin", "user");
    expect(thrown).toBeUndefined();
    expect(next).toHaveBeenCalledOnce();
  });

  it("throws ForbiddenError for a role that is not allowed", () => {
    const { next, thrown } = run({ userRole: "user" }, "admin");
    expect(thrown).toBeInstanceOf(ForbiddenError);
    expect((thrown as ForbiddenError).message).toBe("Forbidden");
    expect(next).not.toHaveBeenCalled();
  });

  it("throws UnauthorizedError when no role is set (requireAuth not run)", () => {
    const { next, thrown } = run({}, "admin");
    expect(thrown).toBeInstanceOf(UnauthorizedError);
    expect((thrown as UnauthorizedError).message).toBe("Unauthorized");
    expect(next).not.toHaveBeenCalled();
  });
});
