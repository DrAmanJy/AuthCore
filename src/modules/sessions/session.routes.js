import { Router } from "express";
import * as controller from "./session.controller.js";
import { validateId } from "../../middleware/validate.middleware.js";
import { verifyAccessToken } from "../../middleware/jwt.middleware.js";

const router = Router();

router.use(verifyAccessToken);

router.get("/", controller.getUserSessions);
router.delete("/", controller.deleteUserSessions);

router.get("/:sessionId", validateId("sessionId"), controller.getUserSessionById);
router.delete("/:sessionId", validateId("sessionId"), controller.deleteUserSessionById);

export default router;
