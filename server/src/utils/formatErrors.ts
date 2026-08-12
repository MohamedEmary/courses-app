import type { z } from "zod";

/**
 * Flatten a Zod validation error into a plain object mapping each field path
 * (dot-joined) to its first error message.
 *
 * @param {z.ZodError} error - The Zod error to format.
 * @returns {Record<string, string>} A map of field path -> error message.
 */
const formatErrors = (error: z.ZodError): Record<string, string> => {
  const errors = new Map<string, string>();
  for (const issue of error.issues) {
    const path = issue.path.join(".");
    if (!errors.has(path)) errors.set(path, issue.message);
  }
  return Object.fromEntries(errors);
};

export { formatErrors };
