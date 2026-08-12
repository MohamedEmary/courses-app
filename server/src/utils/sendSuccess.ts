import type { Response } from "express";
import { RESPONSE_STATUS } from "@/utils/constants.ts";

/**
 * Send a JSend success response envelope: `{ status: "success", data }`.
 * Centralises the envelope so handlers only specify their payload.
 *
 * @param {import("express").Response} res - The Express response.
 * @param {unknown} data - The payload under `data` (use `null` when none).
 * @param {number} [statusCode=200] - HTTP status to send with the response.
 * @returns {void}
 */
const sendSuccess = (res: Response, data: unknown, statusCode = 200) => {
  res.status(statusCode).json({
    status: RESPONSE_STATUS.SUCCESS,
    data,
  });
};

export { sendSuccess };
