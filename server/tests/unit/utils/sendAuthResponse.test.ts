import type { Response } from "express";
import jwt from "jsonwebtoken";
import { describe, expect, it, vi } from "vitest";
import { REFRESH_COOKIE_OPTIONS, RESPONSE_STATUS } from "@/utils/constants.ts";
import { sendAuthResponse } from "@/utils/sendAuthResponse.ts";

const userId = "507f1f77bcf86cd799439011";
const user = {
  _id: { toString: () => userId },
  name: "Alice",
  email: "alice@example.com",
  role: "user",
  avatar: "avatar.png",
} as never;

type MockedResponse = Response & {
  status: ReturnType<typeof vi.fn>;
  json: ReturnType<typeof vi.fn>;
  cookie: ReturnType<typeof vi.fn>;
};

const makeRes = (): MockedResponse => {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    cookie: vi.fn().mockReturnThis(),
  };
  return res as unknown as MockedResponse;
};

/** Return the nth argument of the mock's first call, failing if never called. */
const firstCallArg = (fn: ReturnType<typeof vi.fn>, index: number): unknown => {
  const call = fn.mock.calls[0];
  if (!call) throw new Error("Expected the mock to have been called");
  return call[index];
};

describe("sendAuthResponse", () => {
  it("signs tokens, sets the refresh cookie, and sends the JSend envelope", () => {
    const res = makeRes();
    sendAuthResponse(res, user, 200);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.cookie).toHaveBeenCalledWith(
      "refreshToken",
      expect.any(String),
      expect.objectContaining({
        httpOnly: true,
        sameSite: "lax",
        path: "/auth/refresh",
      }),
    );

    const refreshCookieValue = firstCallArg(res.cookie, 1) as string;
    expect(jwt.decode(refreshCookieValue)).toMatchObject({ sub: userId });

    const payload = firstCallArg(res.json, 0) as {
      status: string;
      data: { user: Record<string, unknown>; accessToken: string };
    };
    expect(payload.status).toBe(RESPONSE_STATUS.SUCCESS);
    expect(payload.data.user).toEqual({
      id: expect.anything(),
      name: "Alice",
      email: "alice@example.com",
      role: "user",
      avatar: "/uploads/avatar.png",
    });
    expect(jwt.decode(payload.data.accessToken)).toMatchObject({
      sub: userId,
      role: "user",
    });
  });

  it("sends the response with the provided status code", () => {
    const res = makeRes();
    sendAuthResponse(res, user, 201);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it("uses the configured refresh cookie options", () => {
    const res = makeRes();
    sendAuthResponse(res, user, 200);
    expect(res.cookie).toHaveBeenCalledWith(
      "refreshToken",
      expect.any(String),
      REFRESH_COOKIE_OPTIONS,
    );
  });
});
