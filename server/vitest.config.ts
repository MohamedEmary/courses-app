import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import { loadEnvVar } from "./src/utils/loadEnvVar.ts";

// Load server/.env so secrets/URI are available locally; CI provides them via the workflow.
if (typeof process.loadEnvFile === "function") {
  try {
    process.loadEnvFile();
  } catch {
    // No .env file; the test DB URI must come from the environment.
  }
}

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    // Only pick up real test files, not helpers.
    include: ["tests/**/*.test.ts"],
    // Shared test DB — run files sequentially to avoid interference.
    fileParallelism: false,
    env: {
      NODE_ENV: "test",
      // jwt.ts reads these at import time; provided by .env or the CI workflow.
      JWT_ACCESS_SECRET: loadEnvVar("JWT_ACCESS_SECRET"),
      JWT_REFRESH_SECRET: loadEnvVar("JWT_REFRESH_SECRET"),
      // Required test DB, exposed to the app as MONGODB_URI.
      MONGODB_URI: loadEnvVar("TEST_MONGODB_URI"),
    },
    coverage: {
      provider: "v8",
      reportsDirectory: "coverage",
      include: ["src/**/*.ts"],
      // main.ts is untestable bootstrap (connect + listen), so exclude it.
      exclude: ["src/main.ts"],
    },
  },
});
