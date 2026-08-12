import type { RequestHandler } from "express";
import { ForbiddenError, UnauthorizedError } from "@/errors/AppError.ts";
import type { UserRole } from "@/utils/constants.ts";

/**
 * Create a middleware factory that restricts a route to the given roles.
 * Unauthenticated requests (no role set) throw a 401, and authenticated users
 * with a disallowed role throw a 403. Throwing (instead of responding directly)
 * keeps the JSend envelope consistent with `requireAuth`/`errorHandler`:
 * both produce `{ status: "error", message }`.
 *
 * @param {...UserRole} roles - Roles allowed to access the route.
 * @returns {import("express").RequestHandler} Middleware that rejects unauthorized/forbidden requests.
 */
const requireRole = (...roles: UserRole[]): RequestHandler => {
  return (req, _res, next) => {
    // requireAuth should run first — never let an unauthenticated request through.
    if (!req.userRole) throw new UnauthorizedError("Unauthorized");

    if (!roles.includes(req.userRole)) throw new ForbiddenError("Forbidden");

    next();
  };
};

export { requireRole };
