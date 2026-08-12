import type { RequestHandler } from "express";

/**
 * Wrap an async Express request handler so a rejected promise is forwarded
 * to the error-handling middleware via `next` instead of crashing the app.
 *
 * @param {import("express").RequestHandler} fn - The request handler to wrap.
 * @returns {import("express").RequestHandler} Handler that forwards rejections to `next(error)`.
 */
const asyncHandler = (fn: RequestHandler): RequestHandler => {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
};

export { asyncHandler };
