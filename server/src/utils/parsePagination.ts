import type { PaginationQuery } from "@/schemas/shared/pagination.schema.ts";

/**
 * Normalize a validated pagination query into `limit`, `page`, and `skip`.
 * Defaults to `limit` 3 and `page` 1 when omitted, matching `PaginationSchema`.
 *
 * @param {PaginationQuery} query - The validated pagination query.
 * @returns {{ limit: number; page: number; skip: number }} The parsed pagination values.
 */
const parsePagination = (query: PaginationQuery) => {
  const limit = query.limit ?? 3;
  const page = query.page ?? 1;
  return { limit, page, skip: (page - 1) * limit };
};

export { parsePagination };
