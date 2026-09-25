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

const router = Router();

// Every course route is authenticated.
router.use(requireAuth);

router
  .route("/")
  .get(
    requireRole("admin"),
    validateRequest({ query: PaginationSchema }),
    getAllCourses,
  )
  .post(validateRequest({ body: AddCourseSchema }), createCourse);

const validateCourseId = validateRequest({ params: CourseIdSchema });
router
  .route("/:id")
  .get(validateCourseId, getCourseById)
  .patch(
    validateCourseId,
    validateRequest({ body: UpdateCourseSchema }),
    updateCourse,
  )
  .delete(requireRole("admin"), validateCourseId, deleteCourse);

export default router;
