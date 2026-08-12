import mongoose from "mongoose";
import { afterAll, beforeAll, beforeEach } from "vitest";
import { createApp } from "@/app.ts";
import { connectDB } from "@/utils/db.ts";
import { loadEnvVar } from "@/utils/loadEnvVar.ts";

const testDbUri = loadEnvVar("TEST_MONGODB_URI");

// Safety guard: only ever run against a dedicated test database — never the
// development `coursesApp` (or a URI with no database segment at all).
const dbName = new URL(testDbUri).pathname.replace(/^\//, "").split("?")[0];
if (!dbName?.endsWith("_test")) {
  throw new Error(
    `Refusing to run integration tests against database '${dbName || "(none)"}'. ` +
      "Point TEST_MONGODB_URI at a dedicated test database ending in '_test' " +
      "(e.g. coursesApp_test).",
  );
}

export const app = createApp();

/**
 * Connect to the test database.
 *
 * @returns {Promise<void>} Resolves once the connection is established.
 */
export const connectTestDb = async () => {
  await connectDB(testDbUri);
};

/**
 * Disconnect from the test database.
 *
 * @returns {Promise<void>} Resolves once the connection is closed.
 */
export const disconnectTestDb = async () => {
  await mongoose.disconnect();
};

/**
 * Delete all documents from every collection in the test database.
 *
 * @returns {Promise<void>} Resolves once all collections are cleared.
 */
export const clearDatabase = async () => {
  const collections = mongoose.connection.collections;
  await Promise.all(
    Object.values(collections).map((collection) => collection.deleteMany({})),
  );
};

/**
 * Register the shared DB lifecycle hooks for integration test files:
 * connect once, wipe the database before each test, disconnect at the end.
 *
 * @returns {void}
 */
export const setupIntegrationDb = () => {
  beforeAll(connectTestDb);
  afterAll(disconnectTestDb);
  beforeEach(clearDatabase);
};
