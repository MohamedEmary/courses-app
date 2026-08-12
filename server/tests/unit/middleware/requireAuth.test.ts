import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { describe, expect, it, vi } from "vitest";
import { UnauthorizedError } from "@/errors/AppError.ts";
import { requireAuth } from "@/middleware/requireAuth.ts";
import { signAccessToken } from "@/utils/jwt.ts";

const secret = process.env.JWT_ACCESS_SECRET as string;
const userId = "507f1f77bcf86cd799439011";
const validToken = signAccessToken({
  _id: { toString: () => userId },
  role: "user",
} as never);

const run = (req: Partial<Request>) => {
  const res = {} as Response;
  const next = vi.fn() as unknown as NextFunction;
  let thrown: unknown;
  try {
    requireAuth(req as Request, res, next);
  } catch (err) {
    thrown = err;
  }
  return { next, thrown };
};

describe("requireAuth", () => {
  it("accepts a valid Bearer token and sets req.userId and req.userRole", () => {
    const req = {
      headers: { authorization: `Bearer ${validToken}` },
    } as Request & { userId?: string; userRole?: string };
    const { next, thrown } = run(req);
    expect(thrown).toBeUndefined();
    expect(req.userId).toBe(userId);
    expect(req.userRole).toBe("user");
    expect(next).toHaveBeenCalledOnce();
  });

  it("is case-insensitive about the Bearer scheme", () => {
    const req = {
      headers: { authorization: `bearer ${validToken}` },
    } as Request & { userId?: string; userRole?: string };
    const { next, thrown } = run(req);
    expect(thrown).toBeUndefined();
    expect(req.userId).toBe(userId);
    expect(next).toHaveBeenCalledOnce();
  });

  it("throws when there is no authorization header", () => {
    const { thrown } = run({ headers: {} });
    expect(thrown).toBeInstanceOf(UnauthorizedError);
    expect((thrown as UnauthorizedError).message).toBe(
      "Missing Or Invalid Access Token",
    );
  });

  it("throws when the header does not use the Bearer scheme", () => {
    const { thrown } = run({ headers: { authorization: "Basic abc" } });
    expect(thrown).toBeInstanceOf(UnauthorizedError);
    expect((thrown as UnauthorizedError).message).toBe(
      "Missing Or Invalid Access Token",
    );
  });

  it("throws on a malformed token", () => {
    const { thrown } = run({
      headers: { authorization: "Bearer not-a-jwt" },
    });
    expect(thrown).toBeInstanceOf(UnauthorizedError);
    expect((thrown as UnauthorizedError).message).toBe(
      "Invalid Or Expired Token",
    );
  });

  it("throws on a token signed with the wrong secret", () => {
    const forged = jwt.sign({ sub: userId, role: "user" }, "wrong-secret");
    const { thrown } = run({
      headers: { authorization: `Bearer ${forged}` },
    });
    expect(thrown).toBeInstanceOf(UnauthorizedError);
    expect((thrown as UnauthorizedError).message).toBe(
      "Invalid Or Expired Token",
    );
  });

  it("throws on an expired token", () => {
    const expired = jwt.sign({ sub: userId, role: "user" }, secret, {
      expiresIn: "-10s",
    });
    const { thrown } = run({
      headers: { authorization: `Bearer ${expired}` },
    });
    expect(thrown).toBeInstanceOf(UnauthorizedError);
    expect((thrown as UnauthorizedError).message).toBe(
      "Invalid Or Expired Token",
    );
  });
});
