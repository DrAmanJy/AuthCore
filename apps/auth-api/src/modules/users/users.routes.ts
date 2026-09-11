import { Router } from "express";
import { userController } from "../../container.js";

const userRouter = Router();

// Authenticated user
userRouter.get("/me", userController.getAuthenticatedUser);
userRouter.patch("/:userId/profile", userController.updateUserProfile);
userRouter.patch("/:userId/email", userController.updateUserEmail);
userRouter.post("/:userId/deactivate", userController.deactivateUser);
userRouter.delete("/:userId", userController.deleteUser);

// admin

userRouter.get("/:userId", userController.getUserById);
userRouter.get("/", userController.getAllUsers);
userRouter.patch("/:userId/status", userController.changeUserStatus);
