import { Router } from "express";

import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  sessionParamsSchema,
  verifyEmailSchema,
} from "@authcore/contracts";

import { authController } from "../../container.js";
import { validateAccessToken } from "../../middlewares/token.middleware.js";
import { validateBody, validateParams } from "../../middlewares/validate.middleware.js";

const authRouter = Router();

// ─────────────────────────────────────────────
// Authentication
// ─────────────────────────────────────────────

authRouter.post("/register", validateBody(registerSchema), authController.register);

authRouter.post("/login", validateBody(loginSchema), authController.login);

authRouter.post("/refresh-token", authController.refreshAccessToken);

authRouter.post("/logout", validateAccessToken, authController.logout);

// ─────────────────────────────────────────────
// Email Verification
// ─────────────────────────────────────────────

authRouter.post(
  "/verify-email",
  validateBody(verifyEmailSchema),
  authController.verifyEmail,
);

authRouter.post("/resend-verification", authController.resendVerification);

// ─────────────────────────────────────────────
// Password Recovery
// ─────────────────────────────────────────────

authRouter.post(
  "/forgot-password",
  validateBody(forgotPasswordSchema),
  authController.forgotPassword,
);

authRouter.post("/reset-password", validateBody(resetPasswordSchema));

authRouter.post(
  "/change-password",
  validateAccessToken,
  validateBody(changePasswordSchema),
  authController.changePassword,
);

// ─────────────────────────────────────────────
// Sessions
// ─────────────────────────────────────────────

authRouter.get("/sessions", validateAccessToken, authController.getSessions);

authRouter.delete(
  "/sessions/:sessionId",
  validateAccessToken,
  validateParams(sessionParamsSchema),
  authController.revokeSession,
);

authRouter.delete("/sessions", validateAccessToken, authController.revokeAllSessions);

export { authRouter };
