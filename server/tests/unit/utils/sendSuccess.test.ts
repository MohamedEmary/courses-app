import type { Response } from "express";
import { describe, expect, it } from "vitest";
import { RESPONSE_STATUS } from "@/utils/constants.ts";
import { sendSuccess } from "@/utils/sendSuccess.ts";
import { makeMockResponse } from "../middleware/helpers/mockExpress.ts";

describe("sendSuccess", () => {
  it("sends the JSend success envelope with the default 200 status", () => {
    const res = makeMockResponse();
    sendSuccess(res as unknown as Response, { id: 1 });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: RESPONSE_STATUS.SUCCESS,
      data: { id: 1 },
    });
  });

  it("uses the provided status code", () => {
    const res = makeMockResponse();
    sendSuccess(res as unknown as Response, null, 201);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      status: RESPONSE_STATUS.SUCCESS,
      data: null,
    });
  });
});
