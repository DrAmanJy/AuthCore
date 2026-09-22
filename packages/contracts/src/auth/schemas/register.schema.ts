import { z } from "zod";

import { displayNameSchema, emailSchema } from "../../users/schemas/user.schema.js";
import { passwordSchema } from "./auth.schema.js";

export const registerSchema = z.strictObject({
  displayName: displayNameSchema,
  email: emailSchema,
  password: passwordSchema,
});
