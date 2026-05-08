import { Router } from "express";
import { validate } from "../../middleware/validate.middleware.js";
import {
  changePasswordSchema,
  loginSchema,
  registerSchema,
  verifyOtpSchema,
} from "./auth.validation.js";
import * as controller from "./auth.controller.js";
import { extractServiceIdentity } from "../../middleware/serviceIdentity.middleware.js";
import { verifyAccessToken } from "../../middleware/jwt.middleware.js";

const router = Router();

router.post("/register", validate(registerSchema), controller.register);
router.post("/login", extractServiceIdentity, validate(loginSchema), controller.login);
router.post("/refresh", controller.refreshToken);

router.post(
  "/verify",
  extractServiceIdentity,
  validate(verifyOtpSchema),
  controller.verifyEmail
);

router.use(verifyAccessToken);

router.post("/logout", controller.logout);
router.post("/logout-all", controller.logoutAll);

router.patch(
  "/change-password",
  extractServiceIdentity,
  validate(changePasswordSchema),
  controller.changePassword
);
