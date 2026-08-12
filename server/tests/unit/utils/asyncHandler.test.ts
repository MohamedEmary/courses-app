import type { NextFunction, Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";
import { asyncHandler } from "@/utils/asyncHandler.ts";

describe("asyncHandler", () => {
  it("invokes the handler and resolves when it succeeds", async () => {
    const fn = vi.fn(async () => {});
    const next = vi.fn() as unknown as NextFunction;
    const wrapped = asyncHandler(fn as never);

    await wrapped({} as Request, {} as Response, next);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(next).not.toHaveBeenCalled();
  });

  it("forwards a rejected promise to next", async () => {
    const error = new Error("boom");
    const fn = vi.fn(async () => {
      throw error;
    });
    const next = vi.fn() as unknown as NextFunction;
    const wrapped = asyncHandler(fn as never);

    await wrapped({} as Request, {} as Response, next);

    expect(next).toHaveBeenCalledWith(error);
  });

  it("passes through a synchronous throw from the handler", () => {
    const error = new Error("sync boom");
    const fn = vi.fn(() => {
      throw error;
    });
    const next = vi.fn() as unknown as NextFunction;
    const wrapped = asyncHandler(fn as never);

    expect(() => wrapped({} as Request, {} as Response, next)).toThrow(error);
  });
});
