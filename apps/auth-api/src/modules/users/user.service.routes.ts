import { Router } from "express";
import { validateApiToken } from "../../middlewares/token.middleware.js";
import { validateParams } from "../../middlewares/validate.middleware.js";
import { userParamsSchema } from "@authcore/contracts";
import { userController } from "../../container.js";

const userServiceRouter = Router();

userServiceRouter.get(
  "/:userId",
  validateApiToken,
  validateParams(userParamsSchema),
  userController.getUserById,
);

userServiceRouter.get("/", validateApiToken, userController.getAllUsers);

export { userServiceRouter };
