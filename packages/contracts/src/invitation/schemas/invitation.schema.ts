import { z } from "zod";
import { emailSchema } from "../../common/schemas/common.schema.js";
import { idSchema } from "../../common/schemas/id.schema.js";

export const targetTypeSchema = z.enum(["user", "email"]);

export const sendInvitationSchema = z
  .object({
    roleId: idSchema,
    targetType: targetTypeSchema,
    targetEmail: emailSchema.optional(),
    targetUserId: idSchema.optional(),
  })
  .refine(
    data => {
      if (data.targetType === "user") {
        return Boolean(data.targetUserId);
      }
      return Boolean(data.targetEmail);
    },
    {
      message: "targetUserId is required for user target, targetEmail for email target",
    },
  );

export const invitationParamsSchema = z.object({
  invitationId: idSchema,
});

export const organizationInvitationParamsSchema = z.object({
  organizationId: idSchema,
});
