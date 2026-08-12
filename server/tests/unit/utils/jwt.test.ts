import jwt from "jsonwebtoken";
import { describe, expect, it } from "vitest";
import { UnauthorizedError } from "@/errors/AppError.ts";
import {
  signAccessToken,
  signRefreshToken,
  tokenPayloadFor,
  verifyAccessToken,
  verifyRefreshToken,
  verifyToken,
} from "@/utils/jwt.ts";

const user = {
  _id: { toString: () => "507f1f77bcf86cd799439011" },
  role: "user",
};

describe("jwt", () => {
  describe("signAccessToken", () => {
    it("returns a JWT string", () => {
      expect(typeof signAccessToken(user as never)).toBe("string");
    });

    it("embeds the sub and role claims", () => {
      const payload = jwt.decode(signAccessToken(user as never));
      expect(payload).toMatchObject({
        sub: "507f1f77bcf86cd799439011",
        role: "user",
      });
    });

    it("expires in 15 minutes", () => {
      const { exp, iat } = jwt.decode(signAccessToken(user as never)) as {
        exp: number;
        iat: number;
      };
      expect(exp - iat).toBe(15 * 60);
    });
  });

  describe("signRefreshToken", () => {
    it("embeds the sub claim and expires in 7 days", () => {
      const payload = jwt.decode(signRefreshToken(user as never)) as {
        sub: string;
        exp: number;
        iat: number;
      };
      expect(payload.sub).toBe("507f1f77bcf86cd799439011");
      expect(payload.exp - payload.iat).toBe(7 * 24 * 60 * 60);
    });
  });

  describe("tokenPayloadFor", () => {
    it("derives the sub and role claims shared by both tokens", () => {
      expect(tokenPayloadFor(user as never)).toEqual({
        sub: "507f1f77bcf86cd799439011",
        role: "user",
      });
    });
  });

  describe("verifyToken", () => {
    const secret = process.env.JWT_ACCESS_SECRET as string;
    const validToken = jwt.sign(
      { sub: "507f1f77bcf86cd799439011", role: "user" },
      secret,
    );

    it("returns the payload for a valid token", () => {
      expect(
        verifyToken(validToken, secret, "missing", "invalid"),
      ).toMatchObject({
        sub: "507f1f77bcf86cd799439011",
        role: "user",
      });
    });

    it("throws with the missing message when no token is provided", () => {
      expect(() =>
        verifyToken(undefined, secret, "missing", "invalid"),
      ).toThrow("missing");
    });

    it("throws with the invalid message when verification fails", () => {
      expect(() =>
        verifyToken("not-a-jwt", secret, "missing", "invalid"),
      ).toThrow("invalid");
    });

    it("defaults the invalid message to the missing message", () => {
      expect(() => verifyToken("not-a-jwt", secret, "same")).toThrow("same");
    });
  });

  describe("verifyAccessToken", () => {
    it("verifies a token it signed", () => {
      expect(verifyAccessToken(signAccessToken(user as never))).toMatchObject({
        sub: "507f1f77bcf86cd799439011",
        role: "user",
      });
    });

    it("throws UnauthorizedError for a tampered token", () => {
      const token = signAccessToken(user as never);
      const tampered = token.slice(0, -1) + (token.endsWith("a") ? "b" : "a");
      expect(() => verifyAccessToken(tampered)).toThrow(UnauthorizedError);
    });

    it("throws UnauthorizedError when given a refresh token (different secret)", () => {
      expect(() => verifyAccessToken(signRefreshToken(user as never))).toThrow(
        UnauthorizedError,
      );
    });

    it("throws UnauthorizedError for garbage input", () => {
      expect(() => verifyAccessToken("not-a-jwt")).toThrow(UnauthorizedError);
    });

    it("throws UnauthorizedError when no token is provided", () => {
      expect(() => verifyAccessToken(undefined)).toThrowError(
        "Missing Or Invalid Access Token",
      );
    });
  });

  describe("verifyRefreshToken", () => {
    it("verifies a token it signed", () => {
      expect(verifyRefreshToken(signRefreshToken(user as never))).toMatchObject(
        {
          sub: "507f1f77bcf86cd799439011",
        },
      );
    });

    it("throws UnauthorizedError when given an access token (different secret)", () => {
      expect(() => verifyRefreshToken(signAccessToken(user as never))).toThrow(
        UnauthorizedError,
      );
    });

    it("throws UnauthorizedError when no token is provided", () => {
      expect(() => verifyRefreshToken(undefined)).toThrow(UnauthorizedError);
    });
  });
});
