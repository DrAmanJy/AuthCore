// POST   /auth/register
// POST   /auth/login
// POST   /auth/refresh

import { Router } from "express";
import { validate } from "../../middleware/validate.middleware.js";
import { changePasswordSchema, loginSchema, registerSchema } from "./auth.validation.js";

const router = Router();

router.post("/register", validate(registerSchema));
router.post("/login", validate(loginSchema));
router.post("/logout");
router.post("/refresh");
router.post("/logout-all");
router.patch("/change-password", validate(changePasswordSchema));
