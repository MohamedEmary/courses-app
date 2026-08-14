import { Router } from "express";
import {
  deleteUser,
  getAllUsers,
  getCurrentUser,
} from "@/controllers/users.controller.ts";
import { requireAuth } from "@/middleware/requireAuth.ts";
import { requireRole } from "@/middleware/requireRole.ts";
import { validateRequest } from "@/middleware/validate.ts";
import { PaginationSchema } from "@/schemas/shared/pagination.schema.ts";
import { UserIdSchema } from "@/schemas/user.schema.ts";
import { asyncHandler } from "@/utils/asyncHandler.ts";

const router = Router();

router
  .route("/")
  .get(
    requireAuth,
    requireRole("admin"),
    validateRequest({ query: PaginationSchema }),
    asyncHandler(getAllUsers),
  );

router.route("/me").get(requireAuth, asyncHandler(getCurrentUser));

const validateUserId = validateRequest({ params: UserIdSchema });
router
  .route("/:id")
  .delete(
    requireAuth,
    requireRole("admin"),
    validateUserId,
    asyncHandler(deleteUser),
  );

export default router;
