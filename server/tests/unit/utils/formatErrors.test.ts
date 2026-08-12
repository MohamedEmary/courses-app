import { describe, expect, it } from "vitest";
import { z } from "zod";
import { formatErrors } from "@/utils/formatErrors.ts";

/** Parse an input that is expected to fail and format the resulting errors. */
const parseAndFormat = (schema: z.ZodTypeAny, input: unknown) => {
  const result = schema.safeParse(input);
  if (result.success) {
    throw new Error("Expected parsing to fail, but it succeeded");
  }
  return formatErrors(result.error);
};

describe("formatErrors", () => {
  it("returns an empty object when there are no issues", () => {
    const emptyError = { issues: [] } as unknown as z.ZodError;
    expect(formatErrors(emptyError)).toEqual({});
  });

  it("flattens a single field error into a record keyed by path", () => {
    const errors = parseAndFormat(z.object({ name: z.string() }), {
      name: 123,
    });
    expect(errors).toHaveProperty("name");
    expect(typeof errors.name).toBe("string");
  });

  it("aggregates errors from multiple fields", () => {
    const schema = z.object({
      name: z.string(),
      price: z.number(),
    });
    const errors = parseAndFormat(schema, { name: 1, price: "high" });
    expect(Object.keys(errors).sort()).toEqual(["name", "price"]);
  });

  it("joins nested paths with a dot", () => {
    const schema = z.object({
      user: z.object({ email: z.string() }),
    });
    const errors = parseAndFormat(schema, { user: { email: 42 } });
    expect(errors).toHaveProperty("user.email");
  });

  it("keeps the first message when several issues share a path", () => {
    // min(10).max(5) is unsatisfiable, so parsing 7 produces two issues
    // on the same (empty) path. Only the first should be kept.
    const schema = z.number().min(10).max(5);
    const errors = parseAndFormat(schema, 7);
    expect(Object.keys(errors)).toHaveLength(1);
  });

  it("preserves custom validation messages", () => {
    const schema = z.object({
      name: z.string().min(5, "Name Too Short"),
    });
    const errors = parseAndFormat(schema, { name: "abc" });
    expect(errors.name).toBe("Name Too Short");
  });
});
