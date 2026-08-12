import type { JwtPayload } from "jsonwebtoken";
import jwt from "jsonwebtoken";
import { UnauthorizedError } from "@/errors/AppError.ts";
import type { UserDocument } from "@/models/user.model.ts";
import {
  ACCESS_TOKEN_AGE_MINUTES,
  REFRESH_TOKEN_AGE_DAYS,
  type UserRole,
} from "@/utils/constants.ts";
import { loadEnvVar } from "@/utils/loadEnvVar.ts";

const accessTokenSecret = loadEnvVar("JWT_ACCESS_SECRET");
const refreshTokenSecret = loadEnvVar("JWT_REFRESH_SECRET");
const { sign, verify } = jwt;

/**
 * Verify a JWT and return its payload, throwing UnauthorizedError when the
 * token is missing or fails verification.
 *
 * @param {string | undefined} token - The token to verify.
 * @param {string} secret - The secret to verify against.
 * @param {string} missingMessage - Message when no token is provided.
 * @param {string} [invalidMessage] - Message when verification fails.
 * @returns {import("jsonwebtoken").JwtPayload} The decoded payload when valid.
 * @throws {UnauthorizedError} If the token is missing or invalid/expired.
 */
const verifyToken = (
  token: string | undefined,
  secret: string,
  missingMessage: string,
  invalidMessage = missingMessage,
): JwtPayload => {
  if (!token) throw new UnauthorizedError(missingMessage);

  try {
    return verify(token, secret) as JwtPayload;
  } catch {
    throw new UnauthorizedError(invalidMessage);
  }
};

/**
 * Verify a JWT access token and return its payload.
 *
 * @param {string | undefined} token - The token from the Authorization header.
 * @returns {import("jsonwebtoken").JwtPayload} The decoded payload when valid.
 * @throws {UnauthorizedError} If the token is missing or invalid/expired.
 */
const verifyAccessToken = (token: string | undefined): JwtPayload =>
  verifyToken(
    token,
    accessTokenSecret,
    "Missing Or Invalid Access Token",
    "Invalid Or Expired Token",
  );

/**
 * Verify a JWT refresh token and return its payload.
 *
 * @param {string | undefined} token - The refresh token from the cookie.
 * @returns {import("jsonwebtoken").JwtPayload} The decoded payload when valid.
 * @throws {UnauthorizedError} If the token is missing or invalid/expired.
 */
const verifyRefreshToken = (token: string | undefined): JwtPayload =>
  verifyToken(token, refreshTokenSecret, "Missing Or Invalid Refresh Token");

/**
 * The claims shared by the access and refresh tokens: the user id (`sub`) and
 * their role. Built once here so both sign functions stay in sync instead of
 * each constructing the same payload literal.
 */
type TokenPayload = {
  sub: string;
  role: UserRole;
};

/**
 * Build the shared token claims (`sub` and `role`) for the given user.
 *
 * @param {UserDocument} user - The user whose `_id` and `role` are embedded as claims.
 * @returns {TokenPayload} The payload containing the user id as `sub` and the user role.
 */
const tokenPayloadFor = (user: UserDocument): TokenPayload => ({
  sub: user._id.toString(),
  role: user.role,
});

/**
 * Sign a short-lived JWT access token for the given user.
 *
 * @param {UserDocument} user - The user whose `_id` and `role` are embedded as claims.
 * @returns {string} A signed JWT access token that expires in 15 minutes.
 */
const signAccessToken = (user: UserDocument) => {
  return sign(tokenPayloadFor(user), accessTokenSecret, {
    expiresIn: `${ACCESS_TOKEN_AGE_MINUTES}m`,
  });
};

/**
 * Sign a long-lived JWT refresh token for the given user.
 *
 * @param {UserDocument} user - The user whose `_id` and `role` are embedded as claims.
 * @returns {string} A signed JWT refresh token that expires in 7 days.
 */
const signRefreshToken = (user: UserDocument) => {
  return sign(tokenPayloadFor(user), refreshTokenSecret, {
    expiresIn: `${REFRESH_TOKEN_AGE_DAYS}d`,
  });
};

export {
  signAccessToken,
  signRefreshToken,
  tokenPayloadFor,
  verifyAccessToken,
  verifyRefreshToken,
  verifyToken,
};
