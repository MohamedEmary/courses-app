import { randomUUID } from "node:crypto";
import multer from "multer";
import {
  ALLOWED_FILE_TYPES,
  MAX_FILE_SIZE_MB,
  UPLOAD_DIR_PATH,
} from "@/utils/constants.ts";

const storage = multer.diskStorage({
  // absolute on-disk location of the uploads folder
  destination: UPLOAD_DIR_PATH,
  filename: (_req, file, cb) => {
    const savedFileName =
      Date.now() +
      "-" +
      randomUUID() + // generate a unique identifier for the file name
      "." +
      file.originalname.split(".").pop(); // file extension
    cb(null, savedFileName);
  },
});

/**
 * Reject uploaded files whose MIME type is not in the allow-list.
 *
 * @param {import("express").Request} _req - Unused.
 * @param {Express.Multer.File} file - The uploaded file; checked via `file.mimetype`.
 * @param {(error: Error | null, acceptFile: boolean) => void} cb - Callback to accept or reject.
 * @returns {void}
 */
const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  if (!ALLOWED_FILE_TYPES.includes(file.mimetype)) return cb(null, false);
  cb(null, true);
};

const limits: multer.Options["limits"] = {
  fileSize: MAX_FILE_SIZE_MB * 1024 * 1024,
};

const uploadAvatar = multer({
  storage,
  fileFilter,
  limits,
});

export { uploadAvatar };
