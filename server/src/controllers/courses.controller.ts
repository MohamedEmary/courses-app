import type { RequestHandler } from "express";
import { NotFoundError } from "@/errors/AppError.ts";
import { CourseModel } from "@/models/course.model.ts";
import { parsePagination } from "@/utils/parsePagination.ts";
import { sendSuccess } from "@/utils/sendSuccess.ts";

const COURSE_NOT_FOUND_MESSAGE = "Course Not Found";

/**
 * List courses with optional pagination (`limit`, `page`). Admin only.
 *
 * @param {import("express").Request} req - Reads `validatedQuery` for `limit`/`page`.
 * @param {import("express").Response} res - Sends the paginated list of courses.
 * @returns {void}
 */
const getAllCourses: RequestHandler = async (req, res) => {
  const { limit, skip } = parsePagination(req.validatedQuery);
  const result = await CourseModel.find().limit(limit).skip(skip);

  sendSuccess(res, { courses: result });
};

/**
 * Return a single course by its id.
 *
 * @param {import("express").Request} req - Reads `validatedParams.id`.
 * @param {import("express").Response} res - Sends the found course.
 * @returns {void}
 * @throws {NotFoundError} If the course does not exist.
 */
const getCourseById: RequestHandler = async (req, res) => {
  const { id } = req.validatedParams;
  const foundCourse = await CourseModel.findById(id);

  if (!foundCourse) throw new NotFoundError(COURSE_NOT_FOUND_MESSAGE);

  sendSuccess(res, { course: foundCourse });
};

/**
 * Create a new course from the validated request body.
 *
 * @param {import("express").Request} req - Reads `validatedBody`.
 * @param {import("express").Response} res - Sends the created course with status 201.
 * @returns {void}
 */
const createCourse: RequestHandler = async (req, res) => {
  const result = await CourseModel.create(req.validatedBody);
  sendSuccess(res, { course: result }, 201);
};

/**
 * Update a course's name and/or price by id.
 *
 * @param {import("express").Request} req - Reads `validatedParams.id` and `validatedBody`.
 * @param {import("express").Response} res - Sends the updated course.
 * @returns {void}
 * @throws {NotFoundError} If the course does not exist.
 */
const updateCourse: RequestHandler = async (req, res) => {
  const { id } = req.validatedParams;
  const { name, price } = req.validatedBody;
  const updatedCourse = await CourseModel.findByIdAndUpdate(
    id,
    { name, price },
    // return the updated document and validate against the schema
    { returnDocument: "after", runValidators: true },
  );

  if (!updatedCourse) throw new NotFoundError(COURSE_NOT_FOUND_MESSAGE);

  sendSuccess(res, { course: updatedCourse });
};

/**
 * Delete a course by id. Admin only.
 *
 * @param {import("express").Request} req - Reads `validatedParams.id`.
 * @param {import("express").Response} res - Sends null data on success.
 * @returns {void}
 * @throws {NotFoundError} If the course does not exist.
 */
const deleteCourse: RequestHandler = async (req, res) => {
  const { id } = req.validatedParams;
  const deletedCourse = await CourseModel.findByIdAndDelete(id);

  if (!deletedCourse) throw new NotFoundError(COURSE_NOT_FOUND_MESSAGE);

  sendSuccess(res, null);
};

export {
  createCourse,
  deleteCourse,
  getAllCourses,
  getCourseById,
  updateCourse,
};
