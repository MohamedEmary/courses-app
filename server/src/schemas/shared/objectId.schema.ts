import { z } from "zod";

/** Matches a MongoDB ObjectId — exactly 24 hexadecimal characters. */
const objectIdRegex = /^[0-9a-fA-F]{24}$/;

/**
 * Create a Zod schema that validates a route param `id` as a 24-character hex
 * ObjectId. Shared by all resources that use Mongo ids as route params.
 *
 * @param {string} invalidMessage - Error message for a malformed id.
 * @returns {z.ZodObject<{ id: z.ZodString }>} A schema with an `id` field.
 */
const objectIdParamSchema = (invalidMessage: string) =>
  z.object({
    // id should be a hex number of 24 characters
    id: z.string().regex(objectIdRegex, invalidMessage),
  });

export { objectIdParamSchema };
