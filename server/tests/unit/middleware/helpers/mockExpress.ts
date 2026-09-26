import type { Response } from "express";
import { type Mock, vi } from "vitest";

export type MockResponse = Response & {
  status: Mock;
  json: Mock;
  cookie: Mock;
};

/**
 * Minimal Express `res` stub whose methods chain (`status()` returns `res`),
 * so middleware and response helpers can be exercised without a real HTTP
 * response.
 *
 * @returns {MockResponse} A stubbed Express `res`.
 */
export const makeMockResponse = (): MockResponse => {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    cookie: vi.fn().mockReturnThis(),
  };
  return res as unknown as MockResponse;
};
