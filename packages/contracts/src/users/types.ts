import { z } from "zod";

import { changeEmailSchema } from "./schemas/change-email.schema.js";
import { changeStatusSchema } from "./schemas/change-status.schema.js";
import { updateUserProfile } from "./schemas/update-profile.schema.js";
import { userProfileSchema } from "./schemas/user-profile.schema.js";
import { changePasswordSchema } from "./schemas/change-password.schema.js";

export type UserProfile = z.infer<typeof userProfileSchema>;
export type UpdateProfile = z.infer<typeof updateUserProfile>;
export type ChangeEmail = z.infer<typeof changeEmailSchema>;
export type ChangeStatus = z.infer<typeof changeStatusSchema>;
export type ChangePassword = z.infer<typeof changePasswordSchema>;
