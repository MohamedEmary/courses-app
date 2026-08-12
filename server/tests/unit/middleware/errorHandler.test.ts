import type { NextFunction, Request, Response } from "express";
import multer from "multer";
import { describe, expect, it, vi } from "vitest";
import { AppError, BadRequestError, NotFoundError } from "@/errors/AppError.ts";
import { errorHandler } from "@/middleware/errorHandler.ts";
import { MAX_FILE_SIZE_MB, RESPONSE_STATUS } from "@/utils/constants.ts";
import { makeMockResponse } from "./helpers/mockExpress.ts";

const run = (err: unknown) => {
  const res = makeMockResponse();
  errorHandler(
    err,
    {} as Request,
    res as unknown as Response,
    vi.fn() as unknown as NextFunction,
  );
  return { res };
};

describe("errorHandler", () => {
  it("responds with the AppError status and message", () => {
    const { res } = run(new NotFoundError());
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      status: RESPONSE_STATUS.ERROR,
      message: "Not Found",
    });
  });

  it("handles custom AppError statuses and messages", () => {
    const { res } = run(new BadRequestError("Custom message"));
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      status: RESPONSE_STATUS.ERROR,
      message: "Custom message",
    });
  });

  it("maps a Multer file-too-large error to a 400 with a friendly message", () => {
    const { res } = run(new multer.MulterError("LIMIT_FILE_SIZE"));
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      status: RESPONSE_STATUS.ERROR,
      message: `File Too Large. Maximum Size Is ${MAX_FILE_SIZE_MB}MB`,
    });
  });

  it("maps other Multer errors to a 400 with the original message", () => {
    const { res } = run(new multer.MulterError("LIMIT_UNEXPECTED_FILE"));
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      status: RESPONSE_STATUS.ERROR,
      message: "Unexpected field",
    });
  });

  it("responds 500 for unknown errors and does not leak their message", () => {
    const { res } = run(new Error("secret internal details"));
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      status: RESPONSE_STATUS.ERROR,
      message: "Internal Server Error",
    });
  });

  it("responds with a custom non-standard status code", () => {
    const { res } = run(new AppError("boom", 418));
    expect(res.status).toHaveBeenCalledWith(418);
  });
});
