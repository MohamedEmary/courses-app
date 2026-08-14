import { describe, expect, it } from "vitest";
import { objectIdParamSchema } from "@/schemas/shared/objectId.schema.ts";

const validId = "507f1f77bcf86cd799439011";

describe("objectIdParamSchema", () => {
  it("accepts a valid 24-character hex ObjectId", () => {
    const schema = objectIdParamSchema("Invalid ID");
    expect(schema.safeParse({ id: validId }).success).toBe(true);
  });

  it("rejects an invalid id with the given message", () => {
    const schema = objectIdParamSchema("Invalid User ID");
    const result = schema.safeParse({ id: "not-an-id" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Invalid User ID");
    }
  });

  it("rejects a missing id", () => {
    const schema = objectIdParamSchema("Invalid ID");
    expect(schema.safeParse({}).success).toBe(false);
  });

  it("keeps each schema independent with its own message", () => {
    const courseSchema = objectIdParamSchema("Invalid Course ID");
    const userSchema = objectIdParamSchema("Invalid User ID");
    const courseResult = courseSchema.safeParse({ id: "bad" });
    const userResult = userSchema.safeParse({ id: "bad" });
    expect(courseResult.success).toBe(false);
    expect(userResult.success).toBe(false);
    if (!courseResult.success && !userResult.success) {
      expect(courseResult.error.issues[0]?.message).toBe("Invalid Course ID");
      expect(userResult.error.issues[0]?.message).toBe("Invalid User ID");
    }
  });
});
