import { vi } from "vitest";

export type MockResponse = {
  status: ReturnType<typeof vi.fn>;
  json: ReturnType<typeof vi.fn>;
};

/**
 * Minimal Express `res` stub whose methods chain (`status()` returns `res`),
 * so middleware can be exercised without a real HTTP response.
 *
 * @returns {MockResponse} A stubbed Express `res`.
 */
export const makeMockResponse = (): MockResponse => {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  return res;
};
