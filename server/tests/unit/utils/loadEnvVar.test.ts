import { afterEach, describe, expect, it, vi } from "vitest";
import { loadEnvVar } from "@/utils/loadEnvVar.ts";

describe("loadEnvVar", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns the value when the env var is set", () => {
    vi.stubEnv("PORT", "8080");
    expect(loadEnvVar("PORT")).toBe("8080");
  });

  it("returns the default when the env var is missing and a default is given", () => {
    vi.stubEnv("PORT", undefined);
    expect(loadEnvVar("PORT", "3000")).toBe("3000");
  });

  it("prefers the real env value over the default", () => {
    vi.stubEnv("PORT", "9999");
    expect(loadEnvVar("PORT", "3000")).toBe("9999");
  });

  it("throws when the env var is missing and no default is given", () => {
    vi.stubEnv("JWT_ACCESS_SECRET", undefined);
    expect(() => loadEnvVar("JWT_ACCESS_SECRET")).toThrowError(
      "Missing JWT_ACCESS_SECRET In Environment Variables",
    );
  });
});
