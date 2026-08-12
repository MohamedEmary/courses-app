import { STATUS_CODES } from "node:http";

/**
 * Base application error that carries an HTTP status code. Throwing this (or a
 * subclass) from a handler lets the error middleware respond with the right status.
 */
class AppError extends Error {
  /**
   * @param {string} message - Human-readable error message.
   * @param {number} [status=500] - HTTP status code to send with the error.
   */
  constructor(
    message: string,
    // `public` Creates status property on class and assigns constructor status param to this.status
    public status: number = 500,
  ) {
    super(message);
  }
}

/**
 * 404 Not Found error.
 */
class NotFoundError extends AppError {
  /**
   * @param {string} message - Error message, defaults to the 404 status text.
   */
  constructor(message = STATUS_CODES[404] as string) {
    super(message, 404);
  }
}

/**
 * 400 Bad Request error.
 */
class BadRequestError extends AppError {
  /**
   * @param {string} message - Error message, defaults to the 400 status text.
   */
  constructor(message = STATUS_CODES[400] as string) {
    super(message, 400);
  }
}

/**
 * 401 Unauthorized error.
 */
class UnauthorizedError extends AppError {
  /**
   * @param {string} message - Error message, defaults to the 401 status text.
   */
  constructor(message = STATUS_CODES[401] as string) {
    super(message, 401);
  }
}

/**
 * 403 Forbidden error for an authenticated user without the required role.
 */
class ForbiddenError extends AppError {
  /**
   * @param {string} message - Error message, defaults to the 403 status text.
   */
  constructor(message = STATUS_CODES[403] as string) {
    super(message, 403);
  }
}

/**
 * 409 Conflict error for an email that is already registered.
 */
class ExistingEmailError extends AppError {
  /**
   * @param {string} message - Error message, defaults to the 409 status text.
   */
  constructor(message = STATUS_CODES[409] as string) {
    super(message, 409);
  }
}

export {
  AppError,
  BadRequestError,
  ExistingEmailError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
};
