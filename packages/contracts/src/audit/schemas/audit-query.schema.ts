import { z } from "zod";
import { idSchema } from "../../common/schemas/id.schema.js";

export const auditQuerySchema = z.object({
  action: z.string().trim().max(100).optional(),
  targetType: z.string().trim().max(50).optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  page: z.coerce.number().min(1).default(1),
});

export const organizationAuditParamsSchema = z.object({
  organizationId: idSchema,
});

export type AuditQuery = z.infer<typeof auditQuerySchema>;
export type OrganizationAuditParams = z.infer<typeof organizationAuditParamsSchema>;
