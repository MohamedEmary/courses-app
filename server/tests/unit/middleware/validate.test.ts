import type { Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { validateRequest } from "@/middleware/validate.ts";
import { RESPONSE_STATUS } from "@/utils/constants.ts";
import { makeMockResponse } from "./helpers/mockExpress.ts";

const bodySchema = z.object({ name: z.string().min(2, "Name Too Short") });
const paramsSchema = z.object({ id: z.string().min(1, "Invalid Id") });
const querySchema = z.object({ page: z.coerce.number().int().positive() });

const run = (
  req: Partial<Request>,
  schemas: Parameters<typeof validateRequest>[0],
) => {
  const res = makeMockResponse();
  const next = vi.fn();
  validateRequest(schemas)(req as Request, res as unknown as Response, next);
  return { req: req as Request & Record<string, unknown>, res, next };
};

describe("validateRequest", () => {
  it("sets req.validatedBody on a valid body and calls next", () => {
    const { req, next } = run(
      { body: { name: "Alice" } },
      { body: bodySchema },
    );
    expect(req.validatedBody).toEqual({ name: "Alice" });
    expect(next).toHaveBeenCalledOnce();
  });

  it("sets req.validatedParams and req.validatedQuery for valid parts", () => {
    const { req, next } = run(
      { params: { id: "abc" }, query: { page: "2" } },
      { params: paramsSchema, query: querySchema },
    );
    expect(req.validatedParams).toEqual({ id: "abc" });
    expect(req.validatedQuery).toEqual({ page: 2 });
    expect(next).toHaveBeenCalledOnce();
  });

  it("responds 400 with formatted errors and does not call next on an invalid body", () => {
    const { res, next } = run({ body: { name: "x" } }, { body: bodySchema });
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      status: RESPONSE_STATUS.FAIL,
      data: { name: "Name Too Short" },
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("aggregates errors across multiple parts", () => {
    const { res, next } = run(
      { body: { name: "x" }, query: { page: "nope" } },
      { body: bodySchema, query: querySchema },
    );
    expect(res.status).toHaveBeenCalledWith(400);
    const payload = res.json.mock.calls[0]?.[0] as {
      data: Record<string, string>;
    };
    expect(Object.keys(payload.data).sort()).toEqual(["name", "page"]);
    expect(next).not.toHaveBeenCalled();
  });

  it("still populates valid parts even when another part fails", () => {
    const { req, res, next } = run(
      { body: { name: "Alice" }, query: { page: "nope" } },
      { body: bodySchema, query: querySchema },
    );
    expect(req.validatedBody).toEqual({ name: "Alice" });
    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  it("calls next when no schemas are provided", () => {
    const { next } = run({ body: {} }, {});
    expect(next).toHaveBeenCalledOnce();
  });

  it("skips schema keys whose value is undefined", () => {
    const schemas = { body: bodySchema, query: undefined };
    const { req, next } = run({ body: { name: "Alice" } }, schemas as never);
    expect(req.validatedBody).toEqual({ name: "Alice" });
    expect(next).toHaveBeenCalledOnce();
  });
});
