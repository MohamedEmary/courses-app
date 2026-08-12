import { objectIdParamSchema } from "@/schemas/shared/objectId.schema.ts";

/**
 * Validates the `:id` route param for a user (24-character hex ObjectId).
 *
 * @returns {z.ZodObject<{ id: z.ZodString }>} The user id schema.
 */
const UserIdSchema = objectIdParamSchema("Invalid User ID");

export { UserIdSchema };
