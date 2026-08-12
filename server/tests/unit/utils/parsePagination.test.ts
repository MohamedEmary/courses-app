import { describe, expect, it } from "vitest";
import { parsePagination } from "@/utils/parsePagination.ts";

describe("parsePagination", () => {
  it("defaults limit to 3 and page to 1 when omitted", () => {
    expect(parsePagination({})).toEqual({ limit: 3, page: 1, skip: 0 });
  });

  it("uses the provided limit and page", () => {
    expect(parsePagination({ limit: 10, page: 3 })).toEqual({
      limit: 10,
      page: 3,
      skip: 20,
    });
  });

  it("computes skip as (page - 1) * limit", () => {
    expect(parsePagination({ limit: 5, page: 1 }).skip).toBe(0);
    expect(parsePagination({ limit: 5, page: 2 }).skip).toBe(5);
    expect(parsePagination({ limit: 5, page: 3 }).skip).toBe(10);
  });

  it("falls back to defaults per field independently", () => {
    expect(parsePagination({ limit: 7 })).toEqual({
      limit: 7,
      page: 1,
      skip: 0,
    });
    expect(parsePagination({ page: 2 })).toEqual({
      limit: 3,
      page: 2,
      skip: 3,
    });
  });
});
