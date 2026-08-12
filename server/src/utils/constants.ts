import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * JSend response status values (`success`, `error`, `fail`).
 */
const RESPONSE_STATUS = {
  SUCCESS: "success",
  ERROR: "error",
  FAIL: "fail",
} as const;

/**
 * User roles (`admin` and `user`).
 */
const USER_ROLES = {
  ADMIN: "admin",
  USER: "user",
} as const;

/** Extract the value type of a const object. */
type ValueOf<T> = T[keyof T];

/** A user role: `admin` or `user`. */
type UserRole = ValueOf<typeof USER_ROLES>;

/** Company email domain; users with this suffix are registered as `admin`. */
const COMPANY_DOMAIN = "@emary.dev";

/** Access token lifetime in minutes (15 min). */
const ACCESS_TOKEN_AGE_MINUTES = 15;

/** Refresh token lifetime in days (7 days). */
const REFRESH_TOKEN_AGE_DAYS = 7;

/**
 * Cookie options for the `refreshToken` (httpOnly, sent only to the refresh endpoint).
 */
const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: REFRESH_TOKEN_AGE_DAYS * 24 * 60 * 60 * 1000,
  // The cookie should only be sent to the refresh token endpoint
  path: "/auth/refresh",
} as const;

/** URL segment used in public URLs (e.g. /uploads/avatar.png) and the folder name on disk. */
const UPLOAD_DIR = "uploads";

/** Default avatar filename, used when a user has not uploaded one. */
const DEFAULT_AVATAR = "avatar.png";

/** Absolute on-disk location of the uploads folder. */
const UPLOAD_DIR_PATH = path.join(
  // ../../ from src/utils/ to the project root
  fileURLToPath(new URL("../..", import.meta.url)),
  UPLOAD_DIR,
);

// Multer (diskStorage) and express.static need the folder to already exist.
mkdirSync(UPLOAD_DIR_PATH, { recursive: true });

/** MIME types accepted for avatar uploads. */
const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png"];

/** Maximum upload size in MB (5 MB). */
const MAX_FILE_SIZE_MB = 5;

export {
  ACCESS_TOKEN_AGE_MINUTES,
  ALLOWED_FILE_TYPES,
  COMPANY_DOMAIN,
  DEFAULT_AVATAR,
  MAX_FILE_SIZE_MB,
  REFRESH_COOKIE_OPTIONS,
  REFRESH_TOKEN_AGE_DAYS,
  RESPONSE_STATUS,
  UPLOAD_DIR,
  UPLOAD_DIR_PATH,
  USER_ROLES,
  type UserRole,
};
