import jwt from "jsonwebtoken";
import { describe, expect, it } from "vitest";
import { REFRESH_COOKIE_OPTIONS, RESPONSE_STATUS } from "@/utils/constants.ts";
import { sendAuthResponse } from "@/utils/sendAuthResponse.ts";
import { makeMockResponse } from "../middleware/helpers/mockExpress.ts";

const userId = "507f1f77bcf86cd799439011";
const user = {
  _id: { toString: () => userId },
  name: "Alice",
  email: "alice@example.com",
  role: "user",
  avatar: "avatar.png",
} as never;

type SentBody = {
  status: string;
  data: { user: Record<string, unknown>; accessToken: string };
};

describe("sendAuthResponse", () => {
  it("signs tokens, sets the refresh cookie, and sends the JSend envelope", () => {
    const res = makeMockResponse();
    sendAuthResponse(res, user, 200);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.cookie).toHaveBeenCalledWith(
      "refreshToken",
      expect.any(String),
      expect.objectContaining({
        httpOnly: true,
        sameSite: "lax",
        path: "/api/auth/refresh",
      }),
    );

    const [, refreshCookieValue] = res.cookie.mock.calls[0] ?? [];
    expect(jwt.decode(refreshCookieValue as string)).toMatchObject({
      sub: userId,
    });

    const [sent] = res.json.mock.calls[0] ?? [];
    const body = sent as SentBody;
    expect(body.status).toBe(RESPONSE_STATUS.SUCCESS);
    expect(body.data.user).toEqual({
      id: expect.anything(),
      name: "Alice",
      email: "alice@example.com",
      role: "user",
      avatar: "/uploads/avatar.png",
    });
    expect(jwt.decode(body.data.accessToken)).toMatchObject({
      sub: userId,
      role: "user",
    });
  });

  it("sends the response with the provided status code", () => {
    const res = makeMockResponse();
    sendAuthResponse(res, user, 201);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it("uses the configured refresh cookie options", () => {
    const res = makeMockResponse();
    sendAuthResponse(res, user, 200);
    expect(res.cookie).toHaveBeenCalledWith(
      "refreshToken",
      expect.any(String),
      REFRESH_COOKIE_OPTIONS,
    );
  });
});
