import type { z } from "zod";
import type {
  sendInvitationSchema,
  invitationParamsSchema,
  organizationInvitationParamsSchema,
  targetTypeSchema,
} from "./schemas/invitation.schema.js";

export type TargetType = z.infer<typeof targetTypeSchema>;
export type SendInvitation = z.infer<typeof sendInvitationSchema>;
export type InvitationParams = z.infer<typeof invitationParamsSchema>;
export type OrganizationInvitationParams = z.infer<typeof organizationInvitationParamsSchema>;
