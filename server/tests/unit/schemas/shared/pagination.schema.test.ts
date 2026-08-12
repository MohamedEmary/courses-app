import { describe, expect, it } from "vitest";
import { PaginationSchema } from "@/schemas/shared/pagination.schema.ts";

describe("PaginationSchema", () => {
  it("accepts an empty query", () => {
    expect(PaginationSchema.safeParse({}).success).toBe(true);
  });

  it("accepts valid limit and page", () => {
    const result = PaginationSchema.safeParse({ limit: 5, page: 2 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ limit: 5, page: 2 });
    }
  });

  it("coerces string query values to numbers", () => {
    const result = PaginationSchema.safeParse({ limit: "10", page: "3" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ limit: 10, page: 3 });
    }
  });

  it("rejects a limit above 20", () => {
    expect(PaginationSchema.safeParse({ limit: 21 }).success).toBe(false);
  });

  it("rejects a non-positive limit", () => {
    expect(PaginationSchema.safeParse({ limit: 0 }).success).toBe(false);
    expect(PaginationSchema.safeParse({ limit: -1 }).success).toBe(false);
  });

  it("rejects a non-integer limit", () => {
    expect(PaginationSchema.safeParse({ limit: 2.5 }).success).toBe(false);
  });

  it("rejects a non-positive page", () => {
    expect(PaginationSchema.safeParse({ page: 0 }).success).toBe(false);
    expect(PaginationSchema.safeParse({ page: -2 }).success).toBe(false);
  });

  it("rejects a non-integer page", () => {
    expect(PaginationSchema.safeParse({ page: 1.5 }).success).toBe(false);
  });
});
