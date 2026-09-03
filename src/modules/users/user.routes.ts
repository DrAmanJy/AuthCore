import { Router } from "express";
import * as controller from "./user.controller.js";
import { verifyAccessToken } from "../../middleware/jwt.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { updateUserSchema } from "./user.validation.js";

const router = Router();

router.use(verifyAccessToken);

/**
 * @swagger
 * /user/me:
 *   get:
 *     tags: [User]
 *     summary: Get current user profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully fetched user profile
 */
router.get("/me", controller.getMe);
/**
 * @swagger
 * /user/me:
 *   patch:
 *     tags: [User]
 *     summary: Update current user profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
router.patch("/me", validate(updateUserSchema), controller.updateMe);
/**
 * @swagger
 * /user/me:
 *   delete:
 *     tags: [User]
 *     summary: Deactivate current user account
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account successfully deactivated
 */
router.delete("/me", controller.deactivateMe);

export default router;
