import type { RequestHandler } from "express";
import { NotFoundError } from "@/errors/AppError.ts";
import { toSafeUser, UserModel } from "@/models/user.model.ts";
import { parsePagination } from "@/utils/parsePagination.ts";
import { sendSuccess } from "@/utils/sendSuccess.ts";

const USER_NOT_FOUND_MESSAGE = "User Not Found";

/**
 * List users with optional pagination (`limit`, `page`). Admin only.
 * Passwords are never exposed — each user is serialized with `toSafeUser`.
 *
 * @param {import("express").Request} req - Reads `validatedQuery` for `limit`/`page`.
 * @param {import("express").Response} res - Sends the paginated list of users.
 * @returns {void}
 */
const getAllUsers: RequestHandler = async (req, res) => {
  const { limit, skip } = parsePagination(req.validatedQuery);
  const result = await UserModel.find().limit(limit).skip(skip);

  sendSuccess(res, { users: result.map(toSafeUser) });
};

/**
 * Return the currently authenticated user's own profile. The user id comes
 * from `req.userId`, which `requireAuth` sets from the verified access token.
 *
 * @param {import("express").Request} req - Reads `req.userId`.
 * @param {import("express").Response} res - Sends the current user.
 * @returns {void}
 * @throws {NotFoundError} If the authenticated user no longer exists.
 */
const getCurrentUser: RequestHandler = async (req, res) => {
  const user = await UserModel.findById(req.userId);

  if (!user) throw new NotFoundError(USER_NOT_FOUND_MESSAGE);

  sendSuccess(res, { user: toSafeUser(user) });
};

/**
 * Delete a user by id. Admin only.
 *
 * @param {import("express").Request} req - Reads `validatedParams.id`.
 * @param {import("express").Response} res - Sends null data on success.
 * @returns {void}
 * @throws {NotFoundError} If the user does not exist.
 */
const deleteUser: RequestHandler = async (req, res) => {
  const { id } = req.validatedParams;
  const deletedUser = await UserModel.findByIdAndDelete(id);

  if (!deletedUser) throw new NotFoundError(USER_NOT_FOUND_MESSAGE);

  sendSuccess(res, null);
};

export { deleteUser, getAllUsers, getCurrentUser };
