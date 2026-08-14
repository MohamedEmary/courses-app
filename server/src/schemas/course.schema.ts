import { z } from "zod";
import { objectIdParamSchema } from "@/schemas/shared/objectId.schema.ts";

/**
 * Validates a course creation body (`name`, `price`).
 */
const AddCourseSchema = z.object({
  name: z.string().min(3, "Name Must Be At Least 3 Characters Long"),
  price: z.coerce.number().min(500, "Price Must Be At Least 500"),
});

/**
 * Validates a course update — every field optional (`name`, `price`).
 */
const UpdateCourseSchema = AddCourseSchema.partial();

/**
 * Validates the `:id` route param for a course (24-character hex ObjectId).
 */
const CourseIdSchema = objectIdParamSchema("Invalid Course ID");

export { AddCourseSchema, CourseIdSchema, UpdateCourseSchema };
