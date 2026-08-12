import { describe, expect, it } from "vitest";
import { CourseModel } from "@/models/course.model.ts";

describe("CourseModel", () => {
  it("accepts a valid course", async () => {
    const doc = new CourseModel({ name: "Node.js", price: 500 });
    await doc.validate();
  });

  it("requires a name", async () => {
    const doc = new CourseModel({ price: 500 });
    await expect(doc.validate()).rejects.toMatchObject({
      errors: expect.objectContaining({ name: expect.anything() }),
    });
  });

  it("defaults price to 0 when not provided", async () => {
    const doc = new CourseModel({ name: "Node.js" });
    expect(doc.price).toBe(0);
    await doc.validate();
  });
});
