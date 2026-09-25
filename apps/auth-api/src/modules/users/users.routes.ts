import { Router } from "express";

import {
  changeEmailSchema,
  changeStatusSchema,
  updateUserProfile,
  userParamsSchema,
} from "@authcore/contracts";

import { userController } from "../../container.js";
import { validateAccessToken } from "../../middlewares/token.middleware.js";
import { validateBody, validateParams } from "../../middlewares/validate.middleware.js";

const userRouter = Router();

// ─────────────────────────────────────────────
// Authenticated user
// ─────────────────────────────────────────────

userRouter.get("/me", validateAccessToken, userController.getAuthenticatedUser);
userRouter.patch(
  "/:userId/profile",
  validateAccessToken,
  validateParams(userParamsSchema),
  validateBody(updateUserProfile),
  userController.updateUserProfile,
);
userRouter.patch(
  "/:userId/email",
  validateAccessToken,
  validateParams(userParamsSchema),
  validateBody(changeEmailSchema),
  userController.updateUserEmail,
);
userRouter.post(
  "/:userId/deactivate",
  validateAccessToken,
  validateParams(userParamsSchema),
  userController.deactivateUser,
);
userRouter.delete(
  "/:userId",
  validateAccessToken,
  validateParams(userParamsSchema),
  userController.deleteUser,
);

// ─────────────────────────────────────────────
// Admin
// ─────────────────────────────────────────────

userRouter.get(
  "/:userId",
  validateAccessToken,
  validateParams(userParamsSchema),
  userController.getUserById,
);
userRouter.get("/", validateAccessToken, userController.getAllUsers);
userRouter.patch(
  "/:userId/status",
  validateAccessToken,
  validateParams(userParamsSchema),
  validateBody(changeStatusSchema),
  userController.changeUserStatus,
);
