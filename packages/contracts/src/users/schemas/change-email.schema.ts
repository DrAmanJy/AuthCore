import { z } from "zod";

import { emailSchema } from "./user.schema.js";

export const changeEmailSchema = z.strictObject({
  email: emailSchema,
});

export const confirmEmailChangeSchema = z.strictObject({
  token: z.string().trim().min(1, "Verification token is required"),
});
