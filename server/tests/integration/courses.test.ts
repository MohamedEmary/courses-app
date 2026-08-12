import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { CourseModel } from "@/models/course.model.ts";
import { type AuthResult, auth, registerUser } from "./helpers/api.ts";
import { app, setupIntegrationDb } from "./helpers/testApp.ts";

let user: AuthResult;
let admin: AuthResult;

const createCourse = (
  token: string | undefined,
  body: Record<string, unknown>,
) => request(app).post("/api/course").set(auth(token)).send(body);

const createCourseId = async (token: string | undefined) => {
  const res = await createCourse(token, { name: "Node.js", price: 500 });
  return res.body.data.course._id as string;
};

setupIntegrationDb();

beforeEach(async () => {
  user = await registerUser(app, { email: "user@example.com" });
  admin = await registerUser(app, { email: "admin@emary.dev" });
});

describe("POST /api/course", () => {
  it("returns 401 without a token", async () => {
    const res = await request(app).post("/api/course").send({
      name: "React",
      price: 500,
    });
    expect(res.status).toBe(401);
  });

  it("creates a course as a regular user", async () => {
    const res = await createCourse(user.accessToken, {
      name: "Node.js",
      price: 500,
    });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe("success");
    expect(res.body.data.course).toMatchObject({
      name: "Node.js",
      price: 500,
    });
    const courseId = res.body.data.course._id;
    expect(courseId).toMatch(/^[0-9a-f]{24}$/);
  });

  it("rejects a name shorter than 3 characters", async () => {
    const res = await createCourse(user.accessToken, {
      name: "ab",
      price: 500,
    });
    expect(res.status).toBe(400);
    expect(res.body.status).toBe("fail");
    expect(res.body.data).toHaveProperty("name");
  });

  it("rejects a price below 500", async () => {
    const res = await createCourse(user.accessToken, {
      name: "React",
      price: 499,
    });
    expect(res.status).toBe(400);
    expect(res.body.data).toHaveProperty("price");
  });

  it("coerces a string price into a number", async () => {
    const res = await createCourse(user.accessToken, {
      name: "React",
      price: "500",
    });
    expect(res.status).toBe(201);
    expect(res.body.data.course.price).toBe(500);
  });
});

describe("GET /api/course/:id", () => {
  let courseId: string;

  beforeEach(async () => {
    courseId = await createCourseId(user.accessToken);
  });

  it("returns the course for an authenticated user", async () => {
    const res = await request(app)
      .get(`/api/course/${courseId}`)
      .set(auth(user.accessToken));
    expect(res.status).toBe(200);
    expect(res.body.data.course).toMatchObject({
      name: "Node.js",
      price: 500,
    });
  });

  it("returns 401 without a token", async () => {
    const res = await request(app).get(`/api/course/${courseId}`);
    expect(res.status).toBe(401);
  });

  it("returns 404 for a valid but unknown id", async () => {
    const res = await request(app)
      .get("/api/course/507f1f77bcf86cd799439011")
      .set(auth(user.accessToken));
    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Course Not Found");
  });

  it("returns 400 for an invalid id format", async () => {
    const res = await request(app)
      .get("/api/course/not-an-id")
      .set(auth(user.accessToken));
    expect(res.status).toBe(400);
    expect(res.body.data).toHaveProperty("id");
  });
});

describe("PATCH /api/course/:id", () => {
  let courseId: string;

  beforeEach(async () => {
    courseId = await createCourseId(user.accessToken);
  });

  it("updates the name", async () => {
    const res = await request(app)
      .patch(`/api/course/${courseId}`)
      .set(auth(user.accessToken))
      .send({ name: "Advanced Node.js" });
    expect(res.status).toBe(200);
    expect(res.body.data.course.name).toBe("Advanced Node.js");
    expect(res.body.data.course.price).toBe(500);
  });

  it("updates the price only", async () => {
    const res = await request(app)
      .patch(`/api/course/${courseId}`)
      .set(auth(user.accessToken))
      .send({ price: 800 });
    expect(res.status).toBe(200);
    expect(res.body.data.course.price).toBe(800);
  });

  it("returns 404 when the course does not exist", async () => {
    const res = await request(app)
      .patch("/api/course/507f1f77bcf86cd799439011")
      .set(auth(user.accessToken))
      .send({ name: "Valid Name" });
    expect(res.status).toBe(404);
  });

  it("returns 400 for an invalid update body", async () => {
    const res = await request(app)
      .patch(`/api/course/${courseId}`)
      .set(auth(user.accessToken))
      .send({ price: 100 });
    expect(res.status).toBe(400);
    expect(res.body.data).toHaveProperty("price");
  });
});

describe("DELETE /api/course/:id", () => {
  let courseId: string;

  beforeEach(async () => {
    courseId = await createCourseId(user.accessToken);
  });

  it("forbids deletion by a regular user", async () => {
    const res = await request(app)
      .delete(`/api/course/${courseId}`)
      .set(auth(user.accessToken));
    expect(res.status).toBe(403);
    expect(res.body).toEqual({
      status: "error",
      message: "Forbidden",
    });
  });

  it("deletes the course as an admin", async () => {
    const res = await request(app)
      .delete(`/api/course/${courseId}`)
      .set(auth(admin.accessToken));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "success", data: null });

    const found = await CourseModel.findById(courseId);
    expect(found).toBeNull();
  });

  it("returns 404 when an admin deletes an unknown course", async () => {
    const res = await request(app)
      .delete("/api/course/507f1f77bcf86cd799439011")
      .set(auth(admin.accessToken));
    expect(res.status).toBe(404);
  });
});

describe("GET /api/course", () => {
  it("forbids listing for a regular user", async () => {
    const res = await request(app)
      .get("/api/course")
      .set(auth(user.accessToken));
    expect(res.status).toBe(403);
  });

  it("returns 404 when there are no courses (admin)", async () => {
    const res = await request(app)
      .get("/api/course")
      .set(auth(admin.accessToken));
    expect(res.status).toBe(404);
    expect(res.body.message).toBe("No Courses Found");
  });

  it("lists courses for an admin", async () => {
    await createCourse(user.accessToken, { name: "React", price: 500 });
    const res = await request(app)
      .get("/api/course")
      .set(auth(admin.accessToken));
    expect(res.status).toBe(200);
    expect(res.body.data.courses).toHaveLength(1);
    expect(res.body.data.courses[0].name).toBe("React");
  });

  it("paginates results with limit and page", async () => {
    await CourseModel.insertMany(
      Array.from({ length: 5 }, (_, i) => ({
        name: `Course ${i + 1}`,
        price: 500 + i,
      })),
    );
    const res = await request(app)
      .get("/api/course?limit=2&page=2")
      .set(auth(admin.accessToken));
    expect(res.status).toBe(200);
    expect(res.body.data.courses).toHaveLength(2);
  });

  it("rejects a limit above 20", async () => {
    const res = await request(app)
      .get("/api/course?limit=21")
      .set(auth(admin.accessToken));
    expect(res.status).toBe(400);
    expect(res.body.data).toHaveProperty("limit");
  });

  it("rejects a page below 1", async () => {
    const res = await request(app)
      .get("/api/course?page=0")
      .set(auth(admin.accessToken));
    expect(res.status).toBe(400);
    expect(res.body.data).toHaveProperty("page");
  });
});
