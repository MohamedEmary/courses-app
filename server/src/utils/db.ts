import mongoose from "mongoose";

/**
 * Connect to MongoDB, reusing the existing connection when one is already
 * established or in progress (singleton pattern to avoid multiple pools).
 *
 * @param {string} uri - MongoDB connection string.
 * @returns {Promise<import("mongoose").Connection>} The active Mongoose connection.
 */
const connectDB = async (uri: string) => {
  const { readyState } = mongoose.connection;
  // 1 = connected, 2 = connecting — reuse instead of opening a new pool.
  if (readyState === 1 || readyState === 2) return mongoose.connection;

  await mongoose.connect(uri);
  return mongoose.connection;
};

export { connectDB };
