import { hash, verify } from "argon2";
import type { RequestHandler } from "express";
import { ExistingEmailError, UnauthorizedError } from "@/errors/AppError.ts";
import { UserModel } from "@/models/user.model.ts";
import { getUserRoleForEmail } from "@/utils/getUserRoleForEmail.ts";
import { signAccessToken, verifyRefreshToken } from "@/utils/jwt.ts";
import { sendAuthResponse } from "@/utils/sendAuthResponse.ts";
import { sendSuccess } from "@/utils/sendSuccess.ts";

type LoginRequestBody = {
  email: string;
  password: string;
};

type RegisterRequestBody = LoginRequestBody & {
  name: string;
};

/**
 * Authenticate a user by email and password, then issue access + refresh tokens.
 *
 * @param {import("express").Request} req - Reads `validatedBody` (email, password).
 * @param {import("express").Response} res - Sets the refresh cookie and returns the user.
 * @returns {void}
 * @throws {UnauthorizedError} If the credentials are invalid.
 */
const loginUser: RequestHandler = async (req, res) => {
  const { email, password } = req.validatedBody as LoginRequestBody;
  const user = await UserModel.findOne({ email });
  // argon2's verify, not jwt's
  const passwordMatches = user ? await verify(user.password, password) : false;
  if (!user || !passwordMatches) throw new UnauthorizedError();
  sendAuthResponse(res, user, 200);
};

/**
 * Register a new user, hash their password, and issue access + refresh tokens.
 * Emails ending in the company domain are assigned the `admin` role.
 *
 * @param {import("express").Request} req - Reads `validatedBody` and an optional uploaded avatar.
 * @param {import("express").Response} res - Sets the refresh cookie and returns the user.
 * @returns {void}
 * @throws {ExistingEmailError} If the email is already registered.
 */
const registerUser: RequestHandler = async (req, res) => {
  const { name, email, password } = req.validatedBody as RegisterRequestBody;
  const role = getUserRoleForEmail(email);
  const passwordHash = await hash(password);
  const existingUser = await UserModel.findOne({ email });
  if (existingUser)
    throw new ExistingEmailError("A User With This Email Already Exists");

  const newUser = await UserModel.create({
    name,
    email,
    role,
    password: passwordHash,
    ...(req.file ? { avatar: req.file.filename } : {}),
  });
  sendAuthResponse(res, newUser, 201);
};

/**
 * Exchange a valid refresh-token cookie for a fresh access token. The refresh
 * route has no auth middleware, so the user identity comes from the token payload.
 *
 * @param {import("express").Request} req - Reads the `refreshToken` cookie.
 * @param {import("express").Response} res - Sends the new access token.
 * @returns {void}
 * @throws {UnauthorizedError} If the token is invalid or the user no longer exists.
 */
const refreshAccessToken: RequestHandler = async (req, res) => {
  // No requireAuth middleware. req.userId comes from the refresh token.
  const payload = verifyRefreshToken(req.cookies.refreshToken);

  const user = payload.sub ? await UserModel.findById(payload.sub) : null;
  // Token is valid but the user is not found
  if (!user) throw new UnauthorizedError("User No Longer Exists");

  const newAccessToken = signAccessToken(user);
  sendSuccess(res, { accessToken: newAccessToken });
};

/**
 * Log the user out by clearing the `refreshToken` cookie.
 *
 * @param {import("express").Request} _req - Unused.
 * @param {import("express").Response} res - Clears the cookie and returns null data.
 * @returns {void}
 */
const logoutUser: RequestHandler = (_req, res) => {
  res.clearCookie("refreshToken", { path: "/auth/refresh" });
  // JSend spec: if a call returns no data, data must be null
  sendSuccess(res, null);
};

export { loginUser, logoutUser, refreshAccessToken, registerUser };
