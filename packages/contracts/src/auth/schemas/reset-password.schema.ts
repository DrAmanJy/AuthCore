import { z } from "zod";

import { passwordSchema, tokenSchema } from "./auth.schema.js";

export const resetPasswordSchema = z.strictObject({
  token: tokenSchema,
  password: passwordSchema,
});
