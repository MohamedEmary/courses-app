import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createApp } from "@/app.ts";
import { app } from "./helpers/testApp.ts";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("app-level behavior", () => {
  it("returns 404 with a JSend fail envelope for an unknown API route", async () => {
    const res = await request(app).get("/api/does-not-exist");
    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      status: "fail",
      data: { message: "Resource Not Found" },
    });
  });

  it("returns 404 for unknown paths outside the API", async () => {
    const res = await request(app).get("/nope");
    expect(res.status).toBe(404);
    expect(res.body.status).toBe("fail");
  });

  it("reflects any Origin and allows credentials for cross-origin requests", async () => {
    const res = await request(app)
      .get("/api/course")
      .set("Origin", "https://anywhere.example.com");
    expect(res.headers["access-control-allow-origin"]).toBe(
      "https://anywhere.example.com",
    );
    expect(res.headers["access-control-allow-credentials"]).toBe("true");
  });

  it("sets Cache-Control: no-store in development mode", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const devApp = createApp();
    const res = await request(devApp).get("/api/course");
    expect(res.headers["cache-control"]).toBe("no-store");
  });
});
