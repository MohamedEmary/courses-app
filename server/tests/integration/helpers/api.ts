import type { Express } from "express";
import request from "supertest";

/**
 * Extract the `refreshToken=...` pair from a `set-cookie` header.
 *
 * @param {string | string[] | undefined} setCookieHeader - The raw `set-cookie` header value(s).
 * @returns {string | undefined} The raw `refreshToken=...` pair, without the trailing cookie attributes.
 */
export const extractRefreshCookie = (
  setCookieHeader: string | string[] | undefined,
): string | undefined => {
  const cookies = Array.isArray(setCookieHeader)
    ? setCookieHeader
    : setCookieHeader
      ? [setCookieHeader]
      : [];
  const cookie = cookies.find((c) => c.startsWith("refreshToken="));
  return cookie?.split(";")[0];
};
/**
 * Normalize a `set-cookie` header into an array of raw cookie strings.
 *
 * @param {Record<string, unknown>} headers - The response headers.
 * @returns {string[]} The raw `set-cookie` values as an array.
 */
export const getSetCookie = (headers: Record<string, unknown>): string[] => {
  const value = headers["set-cookie"];
  if (Array.isArray(value)) return value as string[];
  return value ? [value as string] : [];
};
/**
 * Build an `Authorization` header from a Bearer token.
 *
 * @param {string | undefined} token - The access token.
 * @returns {{ Authorization: string }} An `Authorization: Bearer <token>` header object.
 */
export const auth = (token: string | undefined) => ({
  Authorization: `Bearer ${token}`,
});

export type AuthResult = {
  status: number;
  body: Record<string, any>;
  accessToken: string | undefined;
  refreshCookie: string | undefined;
  setCookie: string[];
};

const toResult = (res: request.Response): AuthResult => ({
  status: res.status,
  body: res.body as Record<string, any>,
  accessToken: res.body?.data?.accessToken as string | undefined,
  refreshCookie: extractRefreshCookie(res.headers["set-cookie"]),
  setCookie: getSetCookie(res.headers),
});

/**
 * Register a test user and return the parsed auth result.
 *
 * @param {Express} app - The Express app to request against.
 * @param {{ name?: string; email?: string; password?: string }} [overrides] - Optional field overrides.
 * @returns {Promise<AuthResult>} The parsed response (status, body, tokens, cookies).
 */
export const registerUser = async (
  app: Express,
  overrides: { name?: string; email?: string; password?: string } = {},
): Promise<AuthResult> => {
  const res = await request(app)
    .post("/api/auth/register")
    .field("name", overrides.name ?? "Test User")
    .field("email", overrides.email ?? "test@example.com")
    .field("password", overrides.password ?? "password123");
  return toResult(res);
};

/**
 * Log a user in and return the parsed auth result.
 *
 * @param {Express} app - The Express app to request against.
 * @param {string} email - The user's email.
 * @param {string} password - The user's password.
 * @returns {Promise<AuthResult>} The parsed response (status, body, tokens, cookies).
 */
export const loginUser = async (
  app: Express,
  email: string,
  password: string,
): Promise<AuthResult> => {
  const res = await request(app)
    .post("/api/auth/login")
    .send({ email, password });
  return toResult(res);
};
