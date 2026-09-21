// Common
export { emailSchema, dateSchema } from "./common/schemas/common.schema.js";

export { idSchema } from "./common/schemas/id.schema.js";

// Auth - Schemas
export { passwordSchema, tokenSchema } from "./auth/schemas/auth.schema.js";

export { registerSchema } from "./auth/schemas/register.schema.js";

export { loginSchema } from "./auth/schemas/login.schema.js";

export { verifyEmailSchema } from "./auth/schemas/verify-email.schema.js";

export { forgotPasswordSchema } from "./auth/schemas/forgot-password.schema.js";

export { resetPasswordSchema } from "./auth/schemas/reset-password.schema.js";

export { sessionParamsSchema } from "./auth/schemas/session-params.schema.js";

// Auth - Types
export type {
  Register,
  Login,
  VerifyEmail,
  ForgotPassword,
  ResetPassword,
  SessionParams,
} from "./auth/types.js";

// Users - Schemas
export { displayNameSchema } from "./users/schemas/user.schema.js";

export { userProfileSchema } from "./users/schemas/user-profile.schema.js";

export { updateUserProfile } from "./users/schemas/update-profile.schema.js";

export { changeEmailSchema } from "./users/schemas/change-email.schema.js";

export { changePasswordSchema } from "./users/schemas/change-password.schema.js";

export { changeStatusSchema } from "./users/schemas/change-status.schema.js";

export { userParamsSchema } from "./users/schemas/user-params.schema.js";

// Users - Types
export type {
  UserProfile,
  UpdateProfile,
  ChangeEmail,
  ChangePassword,
  ChangeStatus,
  UserParams,
} from "./users/types.js";
