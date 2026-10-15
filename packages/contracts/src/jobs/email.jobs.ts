import { z } from "zod";
import { emailSchema } from "../common/schemas/common.schema.js";
import { displayNameSchema } from "../users/schemas/user.schema.js";

export const sendVerificationEmailJobSchema = z.object({
  type: z.literal("email.send_verification"),
  version: z.literal(1),

  userId: z.string(),
  email: emailSchema,
  displayName: displayNameSchema,
  verificationToken: z.string(),
});

export const sendPasswordRestJobSchema = z.object({
  type: z.literal("email.send_password_reset"),
  version: z.literal(1),

  userId: z.string(),
  email: emailSchema,
  displayName: displayNameSchema,
  resetToken: z.string(),
});

export const emailJobSchema = z.discriminatedUnion("type", [
  sendVerificationEmailJobSchema,
  sendPasswordRestJobSchema,
]);

export type EmailJob = z.infer<typeof emailJobSchema>;
