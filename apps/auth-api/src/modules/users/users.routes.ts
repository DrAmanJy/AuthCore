import { Router } from "express";

import { updateUserProfile, userParamsSchema } from "@authcore/contracts";

import { userController } from "../../container.js";
import { validateAccessToken } from "../../middlewares/token.middleware.js";
import { validateBody, validateParams } from "../../middlewares/validate.middleware.js";
import { invitationController } from "../organization/organization.container.js";

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
