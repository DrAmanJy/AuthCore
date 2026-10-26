import { Router } from "express";

import {
  changeEmailSchema,
  // changeStatusSchema,
  updateUserProfile,
  userParamsSchema,
} from "@authcore/contracts";

import { invitationController, userController } from "../../container.js";
import { validateAccessToken } from "../../middlewares/token.middleware.js";
import { validateBody, validateParams } from "../../middlewares/validate.middleware.js";

const userRouter = Router();

userRouter.use(validateAccessToken);

// ─────────────────────────────────────────────
// Authenticated user
// ─────────────────────────────────────────────

userRouter.get("/me", validateAccessToken, userController.getAuthenticatedUser);
userRouter.patch(
  "/profile",
  validateParams(userParamsSchema),
  validateBody(updateUserProfile),
  userController.updateUserProfile,
);
userRouter.post(
  "/email/request",
  validateBody(changeEmailSchema),
  userController.requestEmailChange,
);
userRouter.post(
  "/email/confirm",
  userController.confirmEmailChange,
);

userRouter.patch(
  "/email",
  validateParams(userParamsSchema),
  validateBody(changeEmailSchema),
  userController.updateUserEmail,
);
userRouter.post(
  "/deactivate",
  validateParams(userParamsSchema),
  userController.deactivateUser,
);
userRouter.delete("/", validateParams(userParamsSchema), userController.deleteUser);

userRouter.get("/invitation", invitationController.getUserInvites);
userRouter.post(
  "/invitation/:invitationId/accept",
  invitationController.acceptInvitation,
);
userRouter.post(
  "/invitation/:invitationId/reject",
  invitationController.rejectInvitation,
);

// ─────────────────────────────────────────────
// Admin
// ─────────────────────────────────────────────
// Paused deu to no system admin implemented

// userRouter.get(
//   "/:userId",
//   validateAccessToken,
//   validateParams(userParamsSchema),
//   userController.getUserById,
// );
// userRouter.get("/", validateAccessToken, userController.getAllUsers);
// userRouter.patch(
//   "/:userId/status",
//   validateAccessToken,
//   validateParams(userParamsSchema),
//   validateBody(changeStatusSchema),
//   userController.changeUserStatus,
// );

export { userRouter };
