import { Router } from "express";

import { authController } from "../../container.js";
import { validateBody, validateParams } from "../../middlewares/validate.middleware.js";
import {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  sessionParamsSchema,
} from "@authcore/contracts";

const authRouter = Router();

authRouter.post("/register", validateBody(registerSchema), authController.register);

authRouter.post("/login", validateBody(loginSchema), authController.login);

authRouter.post("/logout", authController.logout);

authRouter.post("/refresh-token", authController.refreshAccessToken);

authRouter.post("/verify-email", validateBody(verifyEmailSchema), authController.verifyEmail);

authRouter.post("/resend-verification", authController.resendVerification);

authRouter.post(
  "/forgot-password",
  validateBody(forgotPasswordSchema),
  authController.forgotPassword,
);

authRouter.post(
  "/reset-password",
  validateBody(resetPasswordSchema),
  authController.resetPassword,
);

authRouter.post(
  "/change-password",
  validateBody(changePasswordSchema),
  authController.changePassword,
);

authRouter.get("/sessions", authController.getSessions);

authRouter.delete(
  "/sessions/:sessionId",
  validateParams(sessionParamsSchema),
  authController.revokeSession,
);

authRouter.delete("/sessions", authController.revokeAllSessions);

export { authRouter };
