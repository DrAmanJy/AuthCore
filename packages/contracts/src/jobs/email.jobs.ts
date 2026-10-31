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

  organizationName: z.string().trim().min(1).max(100).optional(),
  expiresAt: z.string().trim().min(1).max(50),
});

export const sendPasswordRestJobSchema = z.object({
  type: z.literal("email.send_password_reset"),
  version: z.literal(1),

  userId: z.string(),
  email: emailSchema,
  displayName: displayNameSchema,
  resetToken: z.string(),

  organizationName: z.string().trim().min(1).max(100).optional(),
  expiresAt: z.string().trim().min(1).max(50),
});

export const sendInvitationEmailJobSchema = z.object({
  type: z.literal("email.send_invitation"),
  version: z.literal(1),

  invitationId: z.string(),
  email: emailSchema,
  organizationName: z.string().trim().min(1).max(100),
  inviterName: z.string().trim().min(1).max(100),
  roleName: z.string().trim().min(1).max(50),
  invitationToken: z.string(),
  expiresAt: z.string().trim().min(1).max(50),
});

export const emailJobSchema = z.discriminatedUnion("type", [
  sendVerificationEmailJobSchema,
  sendPasswordRestJobSchema,
  sendInvitationEmailJobSchema,
]);

export type EmailJob = z.infer<typeof emailJobSchema>;
