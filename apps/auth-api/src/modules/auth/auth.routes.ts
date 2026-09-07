import { Router } from "express";

const authRouter = Router();

authRouter.post("/register");
authRouter.post("/login");
authRouter.post("/logout");
authRouter.post("/refresh-token");
authRouter.post("/verify-email");
authRouter.post("/resend-verification");
authRouter.post("/forgot-password");
authRouter.post("/reset-password");
authRouter.post("/change-password");

authRouter.get("/sessions");

authRouter.delete("/sessions/:sessionId");
authRouter.delete("/sessions");
