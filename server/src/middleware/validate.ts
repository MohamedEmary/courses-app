import type { RequestHandler } from "express";
import type { z } from "zod";
import { RESPONSE_STATUS } from "@/utils/constants.ts";
import { formatErrors } from "@/utils/formatErrors.ts";

type ValidationSchemas = {
  body?: z.ZodTypeAny;
  params?: z.ZodTypeAny;
  query?: z.ZodTypeAny;
};

type ValidationSchemasKey = keyof ValidationSchemas;

const validatedKeyFor: Record<ValidationSchemasKey, string> = {
  body: "validatedBody",
  params: "validatedParams",
  query: "validatedQuery",
};

/**
 * Create a middleware that validates the `body`, `params`, and/or `query` of a
 * request against the provided Zod schemas. Valid parts are attached to the
 * request as `validatedBody` / `validatedParams` / `validatedQuery`; on any
 * error the middleware responds 400 with the formatted field errors.
 *
 * @param {ValidationSchemas} schemas - Zod schemas keyed by request part (`body`, `params`, `query`).
 * @returns {import("express").RequestHandler} Validation middleware.
 */
const validateRequest = (schemas: ValidationSchemas): RequestHandler => {
  return (req, res, next) => {
    const errors: Record<string, string> = {};

    for (const part of Object.keys(schemas) as ValidationSchemasKey[]) {
      const schema = schemas[part];
      if (!schema) continue;

      const result = schema.safeParse(req[part]);
      if (!result.success) {
        Object.assign(errors, formatErrors(result.error));
      } else {
        (req as any)[validatedKeyFor[part]] = result.data;
      }
    }

    if (Object.keys(errors).length > 0) {
      res.status(400).json({
        status: RESPONSE_STATUS.FAIL,
        data: errors,
      });
      return;
    }

    next();
  };
};

export { validateRequest };
