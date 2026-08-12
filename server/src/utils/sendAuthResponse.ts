import type { Response } from "express";
import { toSafeUser, type UserDocument } from "@/models/user.model.ts";
import { REFRESH_COOKIE_OPTIONS } from "@/utils/constants.ts";
import { signAccessToken, signRefreshToken } from "@/utils/jwt.ts";
import { sendSuccess } from "@/utils/sendSuccess.ts";

/**
 * Sign fresh access + refresh tokens, set the refresh cookie, and send the
 * JSend auth response (the same envelope for login and register).
 *
 * @param {import("express").Response} res - The Express response.
 * @param {UserDocument} user - The authenticated or newly registered user.
 * @param {number} statusCode - HTTP status (200 for login, 201 for register).
 * @returns {void}
 */
const sendAuthResponse = (
  res: Response,
  user: UserDocument,
  statusCode: number,
) => {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  res.cookie("refreshToken", refreshToken, REFRESH_COOKIE_OPTIONS);
  sendSuccess(res, { user: toSafeUser(user), accessToken }, statusCode);
};

export { sendAuthResponse };
