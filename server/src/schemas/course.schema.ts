import { z } from "zod";

const AddCourseSchema = z.object({
  name: z.string().min(3, "Name Must Be At Least 3 Characters Long"),
  price: z.coerce.number().min(500, "Price Must Be At Least 500"),
});

const UpdateCourseSchema = AddCourseSchema.partial();

const courseIdRegex = /^[0-9a-fA-F]{24}$/;
const CourseIdSchema = z.object({
  // id should be a hex number of 24 characters
  id: z.string().regex(courseIdRegex, "Invalid Course ID"),
});

const PaginationSchema = z.object({
  limit: z.coerce
    .number()
    .int("Limit must be an integer")
    .positive("Limit must be a positive integer")
    .max(20, "Limit Can't Be More Than 20")
    .optional(),
  page: z.coerce
    .number()
    .int("Page must be an integer")
    .positive("Page must be a positive integer")
    .optional(),
});

export {
  AddCourseSchema,
  CourseIdSchema,
  PaginationSchema,
  UpdateCourseSchema,
};
