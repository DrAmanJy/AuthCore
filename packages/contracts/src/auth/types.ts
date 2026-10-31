import type { z } from "zod";

import type { registerSchema } from "./schemas/register.schema.js";
import type { loginSchema } from "./schemas/login.schema.js";
import type { verifyEmailSchema } from "./schemas/verify-email.schema.js";
import type { forgotPasswordSchema } from "./schemas/forgot-password.schema.js";
import type { resetPasswordSchema } from "./schemas/reset-password.schema.js";

export type Register = z.infer<typeof registerSchema>;
export type Login = z.infer<typeof loginSchema>;
export type VerifyEmail = z.infer<typeof verifyEmailSchema>;
export type ForgotPassword = z.infer<typeof forgotPasswordSchema>;
export type ResetPassword = z.infer<typeof resetPasswordSchema>;
