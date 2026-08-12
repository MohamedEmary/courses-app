import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { UserModel } from "@/models/user.model.ts";
import { type AuthResult, auth, registerUser } from "./helpers/api.ts";
import { app, setupIntegrationDb } from "./helpers/testApp.ts";

let user: AuthResult;
let admin: AuthResult;

setupIntegrationDb();

beforeEach(async () => {
  user = await registerUser(app, { email: "user@example.com" });
  admin = await registerUser(app, { email: "admin@emary.dev" });
});

describe("GET /api/users/me", () => {
  it("returns the current user's profile", async () => {
    const res = await request(app)
      .get("/api/users/me")
      .set(auth(user.accessToken));
    expect(res.status).toBe(200);
    expect(res.body.data.user).toMatchObject({
      id: user.body.data.user.id,
      name: "Test User",
      email: "user@example.com",
      role: "user",
    });
  });

  it("returns 404 when the user no longer exists", async () => {
    await UserModel.findByIdAndDelete(user.body.data.user.id);
    const res = await request(app)
      .get("/api/users/me")
      .set(auth(user.accessToken));
    expect(res.status).toBe(404);
  });

  it("never includes the password", async () => {
    const res = await request(app)
      .get("/api/users/me")
      .set(auth(user.accessToken));
    expect(res.body.data.user).not.toHaveProperty("password");
  });

  it("returns 401 without a token", async () => {
    const res = await request(app).get("/api/users/me");
    expect(res.status).toBe(401);
  });
});

describe("GET /api/users", () => {
  it("forbids listing for a regular user", async () => {
    const res = await request(app)
      .get("/api/users")
      .set(auth(user.accessToken));
    expect(res.status).toBe(403);
  });

  it("returns 404 when there are no users (admin)", async () => {
    await UserModel.deleteMany({});
    const res = await request(app)
      .get("/api/users")
      .set(auth(admin.accessToken));
    expect(res.status).toBe(404);
    expect(res.body.message).toBe("No Users Found");
  });

  it("lists users for an admin without passwords", async () => {
    const res = await request(app)
      .get("/api/users")
      .set(auth(admin.accessToken));
    expect(res.status).toBe(200);
    expect(res.body.data.users).toHaveLength(2);
    expect(res.body.data.users[0]).toHaveProperty("id");
    expect(res.body.data.users[0]).not.toHaveProperty("password");
  });

  it("paginates results with limit and page", async () => {
    const res = await request(app)
      .get("/api/users?limit=1&page=2")
      .set(auth(admin.accessToken));
    expect(res.status).toBe(200);
    expect(res.body.data.users).toHaveLength(1);
  });

  it("rejects a limit above 20", async () => {
    const res = await request(app)
      .get("/api/users?limit=21")
      .set(auth(admin.accessToken));
    expect(res.status).toBe(400);
    expect(res.body.data).toHaveProperty("limit");
  });

  it("rejects a page below 1", async () => {
    const res = await request(app)
      .get("/api/users?page=0")
      .set(auth(admin.accessToken));
    expect(res.status).toBe(400);
    expect(res.body.data).toHaveProperty("page");
  });
});

describe("DELETE /api/users/:id", () => {
  it("forbids deletion by a regular user", async () => {
    const res = await request(app)
      .delete(`/api/users/${user.body.data.user.id}`)
      .set(auth(user.accessToken));
    expect(res.status).toBe(403);
    expect(res.body).toEqual({
      status: "error",
      message: "Forbidden",
    });
  });

  it("deletes the user as an admin", async () => {
    const res = await request(app)
      .delete(`/api/users/${user.body.data.user.id}`)
      .set(auth(admin.accessToken));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "success", data: null });

    const found = await UserModel.findById(user.body.data.user.id);
    expect(found).toBeNull();
  });

  it("returns 404 when an admin deletes an unknown user", async () => {
    const res = await request(app)
      .delete("/api/users/507f1f77bcf86cd799439011")
      .set(auth(admin.accessToken));
    expect(res.status).toBe(404);
  });

  it("returns 400 for an invalid id format", async () => {
    const res = await request(app)
      .delete("/api/users/not-an-id")
      .set(auth(admin.accessToken));
    expect(res.status).toBe(400);
    expect(res.body.data).toHaveProperty("id");
  });
});
