import { z } from "zod";

/**
 * Validates the registration body (`name`, `email`, `password`).
 *
 * @returns {z.ZodObject<{ name: z.ZodString; email: z.ZodString; password: z.ZodString }>} The registration schema.
 */
const RegisterSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name Must Be At Least 2 Characters Long")
    .max(100, "Name Can't Be More Than 100 Characters Long")
    // Names from any language, allow spaces, hyphens, and apostrophes
    .regex(/^[\p{L}\p{M}\s\-']+$/u, "Name Must Not Contain Special Characters"),
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: z
    .string()
    .trim()
    .min(6, "Password Must Be At Least 6 Characters Long")
    .max(100, "Password Can't Be More Than 100 Characters Long"),
});

/**
 * Validates the login body (`email`, `password`).
 *
 * @returns {z.ZodObject<{ email: z.ZodString; password: z.ZodString }>} The login schema.
 */
const LoginSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: z.string().trim(),
});

export { LoginSchema, RegisterSchema };
