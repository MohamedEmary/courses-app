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

const router = Router();

// Every user route is authenticated.
router.use(requireAuth);

router
  .route("/")
  .get(
    requireRole("admin"),
    validateRequest({ query: PaginationSchema }),
    getAllUsers,
  );

router.route("/me").get(getCurrentUser);

const validateUserId = validateRequest({ params: UserIdSchema });
router.route("/:id").delete(requireRole("admin"), validateUserId, deleteUser);

export default router;
