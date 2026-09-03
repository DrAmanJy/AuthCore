import { Router } from "express";
import * as controller from "./session.controller.js";
import { validateId } from "../../middleware/validate.middleware.js";
import { verifyAccessToken } from "../../middleware/jwt.middleware.js";

const router = Router();

router.use(verifyAccessToken);

/**
 * @swagger
 * /session:
 *   get:
 *     tags: [Session]
 *     summary: Get all sessions for the current user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sessions successfully found
 */
router.get("/", controller.getUserSessions);
/**
 * @swagger
 * /session:
 *   delete:
 *     tags: [Session]
 *     summary: Delete all sessions for the current user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All sessions successfully revoked
 */
router.delete("/", controller.deleteUserSessions);

/**
 * @swagger
 * /session/{sessionId}:
 *   get:
 *     tags: [Session]
 *     summary: Get a specific user session by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the session
 *     responses:
 *       200:
 *         description: Session successfully found
 */
router.get("/:sessionId", validateId("sessionId"), controller.getUserSessionById);
/**
 * @swagger
 * /session/{sessionId}:
 *   delete:
 *     tags: [Session]
 *     summary: Delete a specific user session by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the session to delete
 *     responses:
 *       200:
 *         description: Session successfully deleted
 */
router.delete("/:sessionId", validateId("sessionId"), controller.deleteUserSessionById);

export default router;
