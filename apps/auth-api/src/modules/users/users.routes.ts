import { Router } from "express";
import { UserService } from "./users.service.js";
import { UserController } from "./users.controller.js";
import { MongoUserRepository } from "@authcore/database";

const userRepository = new MongoUserRepository();
const userService = new UserService(userRepository);
const userController = new UserController(userService);

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
