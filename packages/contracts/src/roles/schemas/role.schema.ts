import { z } from "zod";
import { idSchema } from "../../common/schemas/id.schema.js";

export const createRoleSchema = z.object({
  name: z.string().trim().min(2).max(64),
  permissions: z.array(z.string()).default([]),
});

export const updateRoleSchema = z.object({
  name: z.string().trim().min(2).max(64).optional(),
  permissions: z.array(z.string()).optional(),
});

export const roleParamsSchema = z.object({
  organizationId: idSchema,
  roleId: idSchema,
});
