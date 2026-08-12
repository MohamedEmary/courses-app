import type { RequestHandler } from "express";
import { verifyAccessToken } from "@/utils/jwt.ts";

/**
 * Middleware that authenticates a request by reading the Bearer token from the
 * `Authorization` header, verifying it, and attaching `req.userId`/`req.userRole`.
 *
 * @param {import("express").Request} req - Gains `userId` and `userRole` on success.
 * @param {import("express").Response} _res - Unused.
 * @param {import("express").NextFunction} next - Calls the next middleware.
 * @returns {void}
 * @throws {UnauthorizedError} If the token is missing, invalid, or expired.
 */
const requireAuth: RequestHandler = (req, _res, next) => {
  // Extract the token after "bearer " (regex capture group 1).
  const token = req.headers.authorization?.match(/^bearer (.+)$/i)?.[1];

  const { sub, role } = verifyAccessToken(token);
  req.userId = sub as string;
  req.userRole = role;
  next();
};

export { requireAuth };
