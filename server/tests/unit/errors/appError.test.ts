import { describe, expect, it } from "vitest";
import {
  AppError,
  BadRequestError,
  ExistingEmailError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from "@/errors/AppError.ts";

describe("AppError", () => {
  it("is an instance of Error", () => {
    expect(new AppError("boom")).toBeInstanceOf(Error);
  });

  it("defaults to status 500", () => {
    expect(new AppError("boom").status).toBe(500);
  });

  it("accepts a custom status", () => {
    expect(new AppError("boom", 418).status).toBe(418);
  });

  it("exposes the message", () => {
    expect(new AppError("boom").message).toBe("boom");
  });
});

describe("typed errors", () => {
  it("NotFoundError defaults to 404 with 'Not Found'", () => {
    const err = new NotFoundError();
    expect(err.status).toBe(404);
    expect(err.message).toBe("Not Found");
    expect(err).toBeInstanceOf(AppError);
  });

  it("BadRequestError defaults to 400 with 'Bad Request'", () => {
    const err = new BadRequestError();
    expect(err.status).toBe(400);
    expect(err.message).toBe("Bad Request");
  });

  it("UnauthorizedError defaults to 401 with 'Unauthorized'", () => {
    const err = new UnauthorizedError();
    expect(err.status).toBe(401);
    expect(err.message).toBe("Unauthorized");
  });

  it("ForbiddenError defaults to 403 with 'Forbidden'", () => {
    const err = new ForbiddenError();
    expect(err.status).toBe(403);
    expect(err.message).toBe("Forbidden");
    expect(err).toBeInstanceOf(AppError);
  });

  it("ExistingEmailError defaults to 409 with 'Conflict'", () => {
    const err = new ExistingEmailError();
    expect(err.status).toBe(409);
    expect(err.message).toBe("Conflict");
  });

  it("custom messages override the defaults", () => {
    expect(new NotFoundError("Nope").message).toBe("Nope");
    expect(new UnauthorizedError("Go Away").message).toBe("Go Away");
    expect(new ForbiddenError("Stop").message).toBe("Stop");
  });
});
