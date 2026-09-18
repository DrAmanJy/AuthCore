import { Router } from "express";

import { authController } from "../../container.js";

const authRouter = Router();

authRouter.post("/register", authController.register);

authRouter.post("/login", authController.login);

authRouter.post("/logout", authController.logout);

authRouter.post("/refresh-token", authController.refreshAccessToken);

authRouter.post("/verify-email", authController.verifyEmail);

authRouter.post("/resend-verification", authController.resendVerification);

authRouter.post("/forgot-password", authController.forgotPassword);

authRouter.post("/reset-password", authController.resetPassword);

authRouter.post("/change-password", authController.changePassword);

authRouter.get("/sessions", authController.getSessions);

authRouter.delete("/sessions/:sessionId", authController.revokeSession);

authRouter.delete("/sessions", authController.revokeAllSessions);

export { authRouter };
