import { Router } from "express";
import { validate } from "../../middleware/validate.middleware.js";
import {
  changePasswordSchema,
  emailOnlySchema,
  loginSchema,
  registerSchema,
  verifyOtpSchema,
} from "./auth.validation.js";
import * as controller from "./auth.controller.js";
import { extractServiceIdentity } from "../../middleware/serviceIdentity.middleware.js";
import { verifyAccessToken } from "../../middleware/jwt.middleware.js";
import {
  authLimiter,
  loginLimiter,
  otpLimiter,
} from "../../middleware/rateLimit.middleware.js";

const router = Router();

/**
 * @swagger
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 */
router.post("/register", authLimiter, validate(registerSchema), controller.register);
/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: User logged in successfully
 */
router.post(
  "/login",
  loginLimiter,
  extractServiceIdentity,
  validate(loginSchema),
  controller.login
);
/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Refresh access token using refresh token cookie
 *     responses:
 *       200:
 *         description: Access token successfully created
 */
router.post("/refresh", extractServiceIdentity, controller.refreshToken);
/**
 * @swagger
 * /auth/resend-verification:
 *   post:
 *     tags: [Auth]
 *     summary: Resend verification email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: A new verification code has been sent
 */
router.post(
  "/resend-verification",
  otpLimiter,
  validate(emailOnlySchema),
  controller.resendVerification
);
/**
 * @swagger
 * /auth/verify:
 *   post:
 *     tags: [Auth]
 *     summary: Verify user email via OTP
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               otp:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email successfully verified
 */
router.post(
  "/verify",
  authLimiter,
  extractServiceIdentity,
  validate(verifyOtpSchema),
  controller.verifyEmail
);

router.use(verifyAccessToken, authLimiter);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout user from current session
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User logged out successfully
 */
router.post("/logout", controller.logout);

/**
 * @swagger
 * /auth/logout-all:
 *   post:
 *     tags: [Auth]
 *     summary: Logout user from all sessions
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully logged out of all devices
 */
router.post("/logout-all", controller.logoutAll);

/**
 * @swagger
 * /auth/change-password:
 *   patch:
 *     tags: [Auth]
 *     summary: Change user password
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               oldPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password successfully changed
 */
router.patch(
  "/change-password",
  extractServiceIdentity,
  validate(changePasswordSchema),
  controller.changePassword
);

export default router;
