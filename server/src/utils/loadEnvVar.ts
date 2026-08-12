type EnvVarKeys =
  | "MONGODB_URI"
  | "TEST_MONGODB_URI"
  | "NODE_ENV"
  | "JWT_ACCESS_SECRET"
  | "JWT_REFRESH_SECRET"
  | "PORT";

/**
 * Read an environment variable, falling back to a default when provided.
 *
 * @param {EnvVarKeys} key - Name of the environment variable to read.
 * @param {string} [defaultValue] - Fallback value when the variable is unset.
 * @returns {string} The environment variable value (or the default).
 * @throws {Error} If the variable is unset and no default is given.
 */
const loadEnvVar = (key: EnvVarKeys, defaultValue?: string): string => {
  const value = process.env[key];

  if (value !== undefined) return value;
  if (defaultValue !== undefined) return defaultValue;
  throw new Error(`Missing ${key} In Environment Variables`);
};

export { loadEnvVar };
