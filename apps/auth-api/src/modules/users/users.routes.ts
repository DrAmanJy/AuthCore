import { Router } from "express";

import { updateUserProfile } from "@authcore/contracts";

import { invitationController, userController } from "../../container.js";
import { validateAccessToken } from "../../middlewares/token.middleware.js";
import { validateBody } from "../../middlewares/validate.middleware.js";

const userRouter = Router();

userRouter.use(validateAccessToken);

// ─────────────────────────────────────────────
// Authenticated user
// ─────────────────────────────────────────────

userRouter.get("/me", validateAccessToken, userController.getAuthenticatedUser);
userRouter.patch(
  "/profile",
  validateBody(updateUserProfile),
  userController.updateUserProfile,
);

userRouter.post("/deactivate", userController.deactivateUser);
userRouter.delete("/", userController.deleteUser);

userRouter.get("/invitation", invitationController.getUserInvites);
userRouter.post(
  "/:organizationId/invitation/:invitationId/accept",
  invitationController.acceptInvitation,
);
userRouter.post(
  "/:organizationId/invitation/:invitationId/reject",
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
