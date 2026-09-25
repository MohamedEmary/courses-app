import { Router } from "express";
import {
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
} from "@/controllers/auth.controller.ts";
import { uploadAvatar } from "@/middleware/uploadAvatar.ts";
import { validateRequest } from "@/middleware/validate.ts";
import { LoginSchema, RegisterSchema } from "@/schemas/auth.schema.ts";

const router = Router();

router.route("/login").post(validateRequest({ body: LoginSchema }), loginUser);
router.route("/register").post(
  // Multer must run first: it parses the multipart body into req.body and req.file.
  uploadAvatar.single("avatar"),
  validateRequest({ body: RegisterSchema }),
  registerUser,
);
router.route("/refresh").post(refreshAccessToken);
router.route("/logout").post(logoutUser);

export default router;
