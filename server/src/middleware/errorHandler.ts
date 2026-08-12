import { STATUS_CODES } from "node:http";
import type { ErrorRequestHandler } from "express";
import multer from "multer";
import { AppError } from "@/errors/AppError.ts";
import { MAX_FILE_SIZE_MB, RESPONSE_STATUS } from "@/utils/constants.ts";

/**
 * Express error-handling middleware. Responds with a JSend `error` envelope:
 * AppError instances use their own status/message, Multer errors map to 400,
 * and anything else becomes a generic 500 without leaking internal details.
 *
 * @param {Error} err - The error passed to the error handler.
 * @param {import("express").Request} _req - Unused.
 * @param {import("express").Response} res - The Express response.
 * @param {import("express").NextFunction} _next - Unused (terminal handler).
 * @returns {void}
 */
const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.status).json({
      status: RESPONSE_STATUS.ERROR,
      message: err.message,
    });
    return;
  }

  // Multer throws a MulterError (e.g. LIMIT_FILE_SIZE) for upload problems.
  // These are client mistakes, so respond 400 instead of falling to the 500.
  if (err instanceof multer.MulterError) {
    res.status(400).json({
      status: RESPONSE_STATUS.ERROR,
      message:
        err.code === "LIMIT_FILE_SIZE"
          ? `File Too Large. Maximum Size Is ${MAX_FILE_SIZE_MB}MB`
          : err.message,
    });
    return;
  }

  res.status(500).json({
    status: RESPONSE_STATUS.ERROR,
    message: STATUS_CODES[500],
  });
};

export { errorHandler };
