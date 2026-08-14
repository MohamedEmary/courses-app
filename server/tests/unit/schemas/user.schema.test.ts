import { describe, expect, it } from "vitest";
import { UserIdSchema } from "@/schemas/user.schema.ts";

const validId = "507f1f77bcf86cd799439011";

describe("UserIdSchema", () => {
  it("accepts a valid 24-character hex id", () => {
    expect(UserIdSchema.safeParse({ id: validId }).success).toBe(true);
  });

  it("accepts uppercase hex ids", () => {
    expect(UserIdSchema.safeParse({ id: validId.toUpperCase() }).success).toBe(
      true,
    );
  });

  it("rejects an id that is too short", () => {
    expect(UserIdSchema.safeParse({ id: validId.slice(0, 23) }).success).toBe(
      false,
    );
  });

  it("rejects a non-hex id", () => {
    expect(UserIdSchema.safeParse({ id: "z".repeat(24) }).success).toBe(false);
  });

  it("rejects a missing id", () => {
    expect(UserIdSchema.safeParse({}).success).toBe(false);
  });

  it("uses the 'Invalid User ID' message", () => {
    const result = UserIdSchema.safeParse({ id: "not-an-id" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Invalid User ID");
    }
  });
});
