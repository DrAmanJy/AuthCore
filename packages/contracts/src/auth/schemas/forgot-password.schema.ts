import { z } from "zod";

import { emailSchema } from "../../users/schemas/user.schema.js";

export const forgotPasswordSchema = z.strictObject({
  email: emailSchema,
});
