import { describe, expect, it } from "vitest";
import {
  AddCourseSchema,
  CourseIdSchema,
  UpdateCourseSchema,
} from "@/schemas/course.schema.ts";

const validCourse = { name: "Node.js", price: 500 };
const validId = "507f1f77bcf86cd799439011";

describe("AddCourseSchema", () => {
  it("accepts a valid course", () => {
    expect(AddCourseSchema.safeParse(validCourse).success).toBe(true);
  });

  it("accepts the minimum price boundary of 500", () => {
    expect(
      AddCourseSchema.safeParse({ name: "React", price: 500 }).success,
    ).toBe(true);
  });

  it("rejects a price below 500", () => {
    expect(
      AddCourseSchema.safeParse({ name: "React", price: 499 }).success,
    ).toBe(false);
  });

  it("rejects a name shorter than 3 characters", () => {
    expect(AddCourseSchema.safeParse({ name: "ab", price: 500 }).success).toBe(
      false,
    );
  });

  it("accepts a name of exactly 3 characters", () => {
    expect(AddCourseSchema.safeParse({ name: "abc", price: 500 }).success).toBe(
      true,
    );
  });

  it("rejects a missing name", () => {
    expect(AddCourseSchema.safeParse({ price: 500 }).success).toBe(false);
  });

  it("coerces a numeric string price to a number", () => {
    const result = AddCourseSchema.safeParse({ name: "React", price: "500" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.price).toBe(500);
    }
  });

  it("rejects a non-numeric price", () => {
    expect(
      AddCourseSchema.safeParse({ name: "React", price: "abc" }).success,
    ).toBe(false);
  });
});

describe("UpdateCourseSchema", () => {
  it("accepts an empty partial update", () => {
    expect(UpdateCourseSchema.safeParse({}).success).toBe(true);
  });

  it("accepts updating only the name", () => {
    expect(UpdateCourseSchema.safeParse({ name: "New Name" }).success).toBe(
      true,
    );
  });

  it("accepts updating only the price", () => {
    expect(UpdateCourseSchema.safeParse({ price: 600 }).success).toBe(true);
  });

  it("rejects an invalid partial update", () => {
    expect(UpdateCourseSchema.safeParse({ price: 100 }).success).toBe(false);
  });
});

describe("CourseIdSchema", () => {
  it("accepts a valid 24-character hex id", () => {
    expect(CourseIdSchema.safeParse({ id: validId }).success).toBe(true);
  });

  it("accepts uppercase hex ids", () => {
    expect(
      CourseIdSchema.safeParse({ id: validId.toUpperCase() }).success,
    ).toBe(true);
  });

  it("rejects an id that is too short", () => {
    expect(CourseIdSchema.safeParse({ id: validId.slice(0, 23) }).success).toBe(
      false,
    );
  });

  it("rejects a non-hex id", () => {
    expect(CourseIdSchema.safeParse({ id: "z".repeat(24) }).success).toBe(
      false,
    );
  });

  it("rejects a missing id", () => {
    expect(CourseIdSchema.safeParse({}).success).toBe(false);
  });
});
