import { z } from "zod";

/**
 * Validates pagination query params (`limit`, `page`). Both are optional;
 * `limit` must be 1–20 and `page` a positive integer.
 *
 * @returns {z.ZodObject<{ limit?: z.ZodOptional<z.ZodNumber>; page?: z.ZodOptional<z.ZodNumber> }>} The pagination schema.
 */
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

/** The validated pagination query shape (`limit` and/or `page`, both optional). */
type PaginationQuery = z.infer<typeof PaginationSchema>;

export { type PaginationQuery, PaginationSchema };
