import { Router } from "express";
import { validate } from "../../middleware/validate.middleware.js";
import { changePasswordSchema, loginSchema, registerSchema } from "./auth.validation.js";
import * as controller from "./auth.controller.js";
import { extractServiceIdentity } from "../../middleware/serviceIdentity.middleware.js";
import { verifyAccessToken } from "../../middleware/jwt.middleware.js";

const router = Router();

router.post("/register", validate(registerSchema), controller.register);
router.post("/login", validate(loginSchema), extractServiceIdentity, controller.login);
router.post("/logout", verifyAccessToken, controller.logout);
router.post("/refresh", verifyAccessToken, controller.refreshToken);

router.post(
  "/logout-all",
  verifyAccessToken,
  extractServiceIdentity,
  controller.logoutAll
);

router.patch(
  "/change-password",
  verifyAccessToken,
  extractServiceIdentity,
  validate(changePasswordSchema),
  controller.changePassword
);
