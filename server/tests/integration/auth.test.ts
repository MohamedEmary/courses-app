import jwt from "jsonwebtoken";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { UserModel } from "@/models/user.model.ts";
import { MAX_FILE_SIZE_MB } from "@/utils/constants.ts";
import { getSetCookie, loginUser, registerUser } from "./helpers/api.ts";
import { app, setupIntegrationDb } from "./helpers/testApp.ts";

setupIntegrationDb();

describe("POST /api/auth/refresh", () => {
  it("returns a fresh access token for a valid refresh cookie", async () => {
    const { refreshCookie } = await registerUser(app);
    const res = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", refreshCookie as string);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
    expect(typeof res.body.data.accessToken).toBe("string");
    expect(res.body.data.accessToken).not.toBe("");
  });

  it("refreshes access token automatically via agent cookie jar after register", async () => {
    const agent = request.agent(app);
    await agent
      .post("/api/auth/register")
      .field("name", "Register Jar User")
      .field("email", "reg-jar@example.com")
      .field("password", "asd123");

    const res = await agent.post("/api/auth/refresh");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
    expect(typeof res.body.data.accessToken).toBe("string");
    expect(res.body.data.accessToken).not.toBe("");
  });

  it("refreshes access token automatically via agent cookie jar after login", async () => {
    await registerUser(app, {
      email: "login-jar@example.com",
      password: "password123",
    });

    const agent = request.agent(app);
    await agent
      .post("/api/auth/login")
      .send({ email: "login-jar@example.com", password: "password123" });

    const res = await agent.post("/api/auth/refresh");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
    expect(typeof res.body.data.accessToken).toBe("string");
    expect(res.body.data.accessToken).not.toBe("");
  });

  it("returns 401 when no refresh cookie is sent", async () => {
    const res = await request(app).post("/api/auth/refresh");
    expect(res.status).toBe(401);
    expect(res.body.status).toBe("error");
    expect(res.body.message).toBe("Missing Or Invalid Refresh Token");
  });

  it("returns 401 for a garbage refresh cookie", async () => {
    const res = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", "refreshToken=not-a-real-token");
    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Missing Or Invalid Refresh Token");
  });

  it("returns 401 for a refresh cookie signed with the wrong secret", async () => {
    const forged = jwt.sign(
      { sub: "507f1f77bcf86cd799439011" },
      "attacker-secret",
      { expiresIn: "7d" },
    );
    const res = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", `refreshToken=${forged}`);
    expect(res.status).toBe(401);
  });

  it("returns 401 when the user no longer exists", async () => {
    const { refreshCookie } = await registerUser(app);
    await UserModel.deleteMany({});
    const res = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", refreshCookie as string);
    expect(res.status).toBe(401);
    expect(res.body.message).toBe("User No Longer Exists");
  });

  it("returns 401 when the refresh token has no subject claim", async () => {
    // Signed with the real refresh secret, but the payload has no `sub` —
    // so there is no user identity to refresh against.
    const noSubject = jwt.sign(
      { role: "user" },
      process.env.JWT_REFRESH_SECRET as string,
      { expiresIn: "7d" },
    );
    const res = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", `refreshToken=${noSubject}`);
    expect(res.status).toBe(401);
    expect(res.body.message).toBe("User No Longer Exists");
  });
});

describe("POST /api/auth/logout", () => {
  it("returns 200 with null data", async () => {
    const res = await request(app).post("/api/auth/logout");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "success", data: null });
  });

  it("clears the refresh cookie scoped to /api/auth/refresh", async () => {
    const res = await request(app).post("/api/auth/logout");
    const setCookie = getSetCookie(res.headers).join("; ");
    expect(setCookie).toContain("refreshToken=;");
    expect(setCookie).toContain("Path=/api/auth/refresh");
    expect(setCookie).toMatch(/Max-Age=0|Expires=/i);
  });

  it("works without being logged in (stateless)", async () => {
    const res = await request(app).post("/api/auth/logout");
    expect(res.status).toBe(200);
  });

  it("clears the session in an agent cookie jar so subsequent refresh fails", async () => {
    const agent = request.agent(app);
    await agent
      .post("/api/auth/register")
      .field("name", "Logout User")
      .field("email", "logout-jar@example.com")
      .field("password", "asd123");

    const logoutRes = await agent.post("/api/auth/logout");
    expect(logoutRes.status).toBe(200);

    const refreshRes = await agent.post("/api/auth/refresh");
    expect(refreshRes.status).toBe(401);
    expect(refreshRes.body.message).toBe("Missing Or Invalid Refresh Token");
  });
});

describe("POST /api/auth/register", () => {
  it("creates a user and returns a JSend success envelope", async () => {
    const { status, body } = await registerUser(app);
    expect(status).toBe(201);
    expect(body.status).toBe("success");
    expect(body.data.user).toMatchObject({
      name: "Test User",
      email: "test@example.com",
      role: "user",
    });
    expect(typeof body.data.accessToken).toBe("string");
  });

  it("never returns the password hash", async () => {
    const { body } = await registerUser(app);
    expect(body.data.user).not.toHaveProperty("password");
    expect(JSON.stringify(body)).not.toContain("$argon2");
  });

  it("sets an httpOnly refresh cookie scoped to /api/auth/refresh", async () => {
    const { setCookie } = await registerUser(app, {
      email: "cookie@example.com",
    });
    const joined = setCookie.join("; ");
    expect(joined).toMatch(/^refreshToken=.+$/);
    expect(joined).toContain("HttpOnly");
    expect(joined).toContain("Path=/api/auth/refresh");
    expect(joined).toContain("SameSite=Lax");
  });

  it("assigns the admin role to emails ending in @emary.dev", async () => {
    const { body } = await registerUser(app, { email: "boss@emary.dev" });
    expect(body.data.user.role).toBe("admin");
  });

  it("assigns the user role to other emails", async () => {
    const { body } = await registerUser(app, { email: "user@gmail.com" });
    expect(body.data.user.role).toBe("user");
  });

  it("lowercases the email before storing it", async () => {
    const { body } = await registerUser(app, { email: "MiXeD@Example.COM" });
    expect(body.data.user.email).toBe("mixed@example.com");
  });

  it("returns 409 when the email is already registered", async () => {
    await registerUser(app, { email: "dup@example.com" });
    const { status, body } = await registerUser(app, {
      email: "dup@example.com",
    });
    expect(status).toBe(409);
    expect(body.status).toBe("error");
    expect(body.message).toContain("Already Exists");
  });

  it("returns 400 with per-field errors for an invalid body", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .field("name", "A")
      .field("email", "not-an-email")
      .field("password", "123");
    expect(res.status).toBe(400);
    expect(res.body.status).toBe("fail");
    expect(res.body.data).toHaveProperty("name");
    expect(res.body.data).toHaveProperty("email");
    expect(res.body.data).toHaveProperty("password");
  });

  it("returns 400 with 'Field is Required' for a missing field", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .field("email", "alice@example.com")
      .field("password", "password123");
    expect(res.status).toBe(400);
    expect(res.body.data.name).toBe("Field is Required");
  });

  it("accepts an avatar upload and returns its URL", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .field("name", "With Avatar")
      .field("email", "avatar@example.com")
      .field("password", "password123")
      .attach("avatar", Buffer.from("fake-png-bytes"), {
        filename: "face.png",
        contentType: "image/png",
      });
    expect(res.status).toBe(201);
    expect(res.body.data.user.avatar).toMatch(/^\/uploads\/.+\.png$/);
  });

  it("ignores a disallowed file type and keeps the default avatar", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .field("name", "No Avatar")
      .field("email", "noavatar@example.com")
      .field("password", "password123")
      .attach("avatar", Buffer.from("plain text"), {
        filename: "notes.txt",
        contentType: "text/plain",
      });
    expect(res.status).toBe(201);
    expect(res.body.data.user.avatar).toBe("/uploads/avatar.png");
  });

  it("serves the uploaded avatar file statically", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .field("name", "Served Avatar")
      .field("email", "served@example.com")
      .field("password", "password123")
      .attach("avatar", Buffer.from("fake-png-bytes"), {
        filename: "face.png",
        contentType: "image/png",
      });
    expect(res.status).toBe(201);
    const avatarUrl = res.body.data.user.avatar as string;
    const fileRes = await request(app).get(avatarUrl);
    expect(fileRes.status).toBe(200);
  });

  it("returns 400 when the avatar exceeds the size limit", async () => {
    const oversized = Buffer.alloc(MAX_FILE_SIZE_MB * 1024 * 1024 + 1);
    const res = await request(app)
      .post("/api/auth/register")
      .field("name", "Big Avatar")
      .field("email", "big@example.com")
      .field("password", "password123")
      .attach("avatar", oversized, {
        filename: "big.png",
        contentType: "image/png",
      });
    expect(res.status).toBe(400);
    expect(res.body.status).toBe("error");
    expect(res.body.message).toContain("File Too Large");
  });
});

describe("POST /api/auth/login", () => {
  beforeEach(async () => {
    await registerUser(app, {
      email: "alice@example.com",
      password: "password123",
    });
  });

  it("logs in with valid credentials and returns a token + refresh cookie", async () => {
    const { status, body, refreshCookie } = await loginUser(
      app,
      "alice@example.com",
      "password123",
    );
    expect(status).toBe(200);
    expect(body.status).toBe("success");
    expect(body.data.user.email).toBe("alice@example.com");
    expect(typeof body.data.accessToken).toBe("string");
    expect(refreshCookie).toMatch(/^refreshToken=.+$/);
  });

  it("returns 401 for a wrong password", async () => {
    const { status, body } = await loginUser(app, "alice@example.com", "nope");
    expect(status).toBe(401);
    expect(body.status).toBe("error");
  });

  it("returns 401 for an unknown email", async () => {
    const { status } = await loginUser(app, "ghost@example.com", "password123");
    expect(status).toBe(401);
  });

  it("returns 400 for a missing password", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "alice@example.com" });
    expect(res.status).toBe(400);
    expect(res.body.status).toBe("fail");
  });

  it("returns 400 for an invalid email", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "not-an-email", password: "password123" });
    expect(res.status).toBe(400);
    expect(res.body.status).toBe("fail");
  });
});
