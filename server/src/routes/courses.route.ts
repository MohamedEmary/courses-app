import { Router } from "express";
import {
  createCourse,
  deleteCourse,
  getAllCourses,
  getCourseById,
  updateCourse,
} from "@/controllers/courses.controller.ts";
import { requireAuth } from "@/middleware/requireAuth.ts";
import { requireRole } from "@/middleware/requireRole.ts";
import { validateRequest } from "@/middleware/validate.ts";
import {
  AddCourseSchema,
  CourseIdSchema,
  UpdateCourseSchema,
} from "@/schemas/course.schema.ts";
import { PaginationSchema } from "@/schemas/shared/pagination.schema.ts";
import { asyncHandler } from "@/utils/asyncHandler.ts";

const router = Router();

router
  .route("/")
  .get(
    requireAuth,
    requireRole("admin"),
    validateRequest({ query: PaginationSchema }),
    asyncHandler(getAllCourses),
  )
  .post(
    requireAuth,
    validateRequest({ body: AddCourseSchema }),
    asyncHandler(createCourse),
  );

const validateCourseId = validateRequest({ params: CourseIdSchema });
router
  .route("/:id")
  .get(requireAuth, validateCourseId, asyncHandler(getCourseById))
  .patch(
    requireAuth,
    validateCourseId,
    validateRequest({ body: UpdateCourseSchema }),
    asyncHandler(updateCourse),
  )
  .delete(
    requireAuth,
    requireRole("admin"),
    validateCourseId,
    asyncHandler(deleteCourse),
  );

export default router;
