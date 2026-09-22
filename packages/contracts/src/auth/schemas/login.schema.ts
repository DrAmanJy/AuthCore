import { z } from "zod";

import { idSchema } from "../../common/schemas/id.schema.js";
import { emailSchema } from "../../users/schemas/user.schema.js";

export const loginSchema = z.strictObject({
  organizationId: idSchema,
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});
