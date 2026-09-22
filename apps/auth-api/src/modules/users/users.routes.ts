import { Router } from "express";
import { userController } from "../../container.js";
import { validateBody, validateParams } from "../../middlewares/validate.middleware.js";
import {
  updateUserProfile,
  changeEmailSchema,
  changeStatusSchema,
  userParamsSchema,
} from "@authcore/contracts";

const userRouter = Router();

// Authenticated user
userRouter.get("/me", userController.getAuthenticatedUser);
userRouter.patch(
  "/:userId/profile",
  validateParams(userParamsSchema),
  validateBody(updateUserProfile),
  userController.updateUserProfile,
);
userRouter.patch(
  "/:userId/email",
  validateParams(userParamsSchema),
  validateBody(changeEmailSchema),
  userController.updateUserEmail,
);
userRouter.post(
  "/:userId/deactivate",
  validateParams(userParamsSchema),
  userController.deactivateUser,
);
userRouter.delete(
  "/:userId",
  validateParams(userParamsSchema),
  userController.deleteUser,
);

// admin

userRouter.get(
  "/:userId",
  validateParams(userParamsSchema),
  userController.getUserById,
);
userRouter.get("/", userController.getAllUsers);
userRouter.patch(
  "/:userId/status",
  validateParams(userParamsSchema),
  validateBody(changeStatusSchema),
  userController.changeUserStatus,
);
