import { objectIdParamSchema } from "@/schemas/shared/objectId.schema.ts";

/**
 * Validates the `:id` route param for a user (24-character hex ObjectId).
 */
const UserIdSchema = objectIdParamSchema("Invalid User ID");

export { UserIdSchema };
