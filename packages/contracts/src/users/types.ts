import type { z } from "zod";

import type { changeEmailSchema } from "./schemas/change-email.schema.js";
import type { changeStatusSchema } from "./schemas/change-status.schema.js";
import type { updateUserProfile } from "./schemas/update-profile.schema.js";
import type { userProfileSchema } from "./schemas/user-profile.schema.js";
import type { changePasswordSchema } from "./schemas/change-password.schema.js";
import type { userParamsSchema } from "./schemas/user-params.schema.js";

export type UserProfile = z.infer<typeof userProfileSchema>;
export type UpdateProfile = z.infer<typeof updateUserProfile>;
export type ChangeEmail = z.infer<typeof changeEmailSchema>;
export type ChangeStatus = z.infer<typeof changeStatusSchema>;
export type ChangePassword = z.infer<typeof changePasswordSchema>;
export type UserParams = z.infer<typeof userParamsSchema>;
